import { User } from "../../user-profile/models/user.model.js";
import { creditWallet } from "../../wallet/services/wallet.service.js";
import { NEW_USER_REWARD, REFERRER_REWARD } from "../constants/referral.constants.js";

export const processReferralReward = async (userId) => {
  const user = await User.findById(userId);

   if (!user || !user.referredBy || user.referralBonusProcessed) {
     return;
   }

  await creditWallet({
    userId: user.referredBy,
    amount: REFERRER_REWARD,
    reason: "REFERRAL_BONUS",
    description: `Referral reward for inviting ${user.fullName}`,
    referenceId: user._id,
  });

  await creditWallet({
    userId: user._id,
    amount: NEW_USER_REWARD,
    reason: "REFERRAL_BONUS",
    description: "Referral welcome bonus",
    referenceId: user.referredBy,
  });

  await User.findByIdAndUpdate(user.referredBy, {
    $inc: {
      referralCount: 1,
      totalReferralEarnings: REFERRER_REWARD,
    },
  });

  user.referralBonusProcessed = true;

  await user.save();
};
