import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Wallet } from "../models/wallet.model.js";
import { WalletTransaction } from "../models/walletTransaction.model.js";

export const createWalletTransaction = async ({
  userId,
  type,
  amount,
  reason,
  description,
  referenceId = null,
}) => {
  const wallet = await Wallet.findOne({
    user: userId,
  });

  if (!wallet) {
    throw new AppError("Wallet not found", HTTP_STATUS.NOT_FOUND);
  }

  if (type === "DEBIT" && wallet.balance < amount) {
    throw new AppError("Insufficient wallet balance", HTTP_STATUS.BAD_REQUEST);
  }

  if (type === "CREDIT") {
    wallet.balance += amount;
  } else {
    wallet.balance -= amount;
  }

  await wallet.save();

  await WalletTransaction.create({
    wallet: wallet._id,
    user: userId,
    type,
    amount,
    reason,
    description,
    balanceAfterTransaction: wallet.balance,
    referenceId,
  });

  return wallet;
};
