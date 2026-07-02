import { mongoose } from "mongoose"; // ✅ Import mongoose for transactions
import { User } from "../../user-profile/models/user.model.js";
import { creditWallet } from "../../wallet/services/wallet.service.js";
import {
  NEW_USER_REWARD,
  REFERRER_REWARD,
} from "../constants/referral.constants.js";

export const processReferralReward = async (userId) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);

    if (!user || !user.referredBy || user.referralBonusProcessed) {
      await session.endSession();
      return;
    }

    await creditWallet(
      {
        userId: user.referredBy,
        amount: REFERRER_REWARD,
        reason: "REFERRAL_BONUS",
        description: `Referral reward for inviting ${user.fullName}`,
        referenceId: user._id,
      },
      { session },
    );

   
    await creditWallet(
      {
        userId: user._id,
        amount: NEW_USER_REWARD,
        reason: "REFERRAL_BONUS",
        description: "Referral welcome bonus",
        referenceId: user.referredBy,
      },
      { session },
    );


    await User.findByIdAndUpdate(
      user.referredBy,
      {
        $inc: {
          referralCount: 1,
          totalReferralEarnings: REFERRER_REWARD,
        },
      },
      { session },
    );


    user.referralBonusProcessed = true;
    await user.save({ session });


    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("Referral processing failed, rolled back:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};
