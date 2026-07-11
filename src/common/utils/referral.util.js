import { User } from "../../modules/user-side/user-profile/models/user.model.js";

export const generateReferralCode = async (fullName) => {
  let referralCode;
  let exists = true;

  const cleanName = fullName && fullName.trim().length > 0 ? fullName : "USER";

  const prefix = "GC";
  const namePart = cleanName
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");

  while (exists) {
    const numberPart = Math.floor(1000 + Math.random() * 9000);

    const suffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()
      .padEnd(3, "Z");

    referralCode = `${prefix}${namePart}${numberPart}${suffix}`;

    exists = await User.exists({ referralCode });
  }

  return referralCode;
};
