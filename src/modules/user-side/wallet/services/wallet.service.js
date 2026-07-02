import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { razorpay } from "../../../../config/razorpay.config.js";
import { WalletTopup } from "../models/walletTopup.model.js";
import crypto from "crypto";

import { Wallet } from "../models/wallet.model.js";
import { WalletTransaction } from "../models/walletTransaction.model.js";

export const createWalletTopupOrderService = async (userId, amount) => {

	if (!amount || amount < 100) {
    throw new AppError(
      "Minimum wallet topup amount is ₹100",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `wallet_${Date.now()}`,
  });

  const topup = await WalletTopup.create({
    user: userId,
    amount,
    razorpayOrderId: razorpayOrder.id,
  });

  return {
    message: "Wallet topup order created successfully",

    data: {
      topupId: topup._id,

      orderId: razorpayOrder.id,

      amount,
    },
  };
};

export const verifyWalletTopupService = async (payload) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    payload;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new AppError("Invalid payment signature", HTTP_STATUS.BAD_REQUEST);
  }

  const topup = await WalletTopup.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!topup) {
    throw new AppError("Topup not found", HTTP_STATUS.NOT_FOUND);
  }

  if (topup.status === "SUCCESS") {
    return {
      message: "Wallet already credited",
      data: null,
    };
  }

  topup.status = "SUCCESS";

  topup.razorpayPaymentId = razorpay_payment_id;

  topup.razorpaySignature = razorpay_signature;

  await topup.save();

  await creditWallet({
    userId: topup.user,
    amount: topup.amount,
    reason: "ADD_MONEY",
    description: "Wallet Topup",
    referenceId: topup._id,
  });

  return {
    message: "Wallet credited successfully",
  };
};

export const creditWallet = async ({
  userId,
  amount,
  reason,
  description,
  referenceId = null,
}, options={}) => {
  let wallet = await Wallet.findOne({
    user: userId,
  }).session(options.session || null)

  if (!wallet) {
    const [newWallet] = await Wallet.create([{user: userId}], options)
   wallet = newWallet;
  }

  wallet.balance += amount;

  await wallet.save(options);

 const [transaction] = await WalletTransaction.create(
   [
     {
       wallet: wallet._id,
       user: userId,
       type: "CREDIT",
       amount,
       reason,
       description,
       referenceId,
       balanceAfterTransaction: wallet.balance,
     },
   ],
   options,
 )

console.log("Wallet Credit successfully", {
  userId,
  amount,
  reason,
});
  

  return {
    wallet,
    transaction,
  };
};

export const debitWallet = async ({
  userId,
  amount,
  reason,
  description,
  referenceId = null
}, options={}) => {

  const session = options.session || null;

  const wallet = await Wallet.findOne({
    user: userId,
  }).session(session)

  if (!wallet) {
    throw new AppError("Wallet not found", HTTP_STATUS.NOT_FOUND);
  }

  if (wallet.balance < amount) {
    throw new AppError("Insufficient wallet balance", HTTP_STATUS.BAD_REQUEST);
  }

  wallet.balance -= amount;

  await wallet.save(options);

  const [transaction] = await WalletTransaction.create([{
    wallet: wallet._id,
    user: userId,
    type: "DEBIT",
    amount,
    reason,
    description,
    referenceId,
    balanceAfterTransaction: wallet.balance,
  }], options);

  return {
    wallet,
    transaction,
  };
};

export const getWalletService = async (userId) => {
  let wallet = await Wallet.findOne({
    user: userId,
  });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userId,
    });
  }

  return {
    message: "Wallet fetched successfully",
    data: wallet,
  };
};

export const getWalletTransactionsService = async (userId, query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search= query.search
  const skip = (page - 1) * limit;
  const filter = {
    user: userId,
  };

  if (query.type && query.type !== "ALL") {
    filter.type = query.type;
  }

  if(search && search.trim().length){
	filter.reason={
		$regex: search.trim(),
		$options: "i"
	}
  }

  const transactions = await WalletTransaction.find(filter)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);

  const total = await WalletTransaction.countDocuments(filter);

  return {
    message: "Transactions fetched successfully",

    data: {
      transactions,

      pagination: {
        currentPage: page,

        totalPages: Math.ceil(total / limit),

        totalItems: total,
      },
    },
  };
};