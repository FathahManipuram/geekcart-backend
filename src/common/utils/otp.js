import bcrypt from "bcryptjs";

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = async (otp) => {
  return await bcrypt.hash(otp, 8);
};

export const compareOtp = async (otp, hash) => {
  const cleanOtp = String(otp).trim();
  return await bcrypt.compare(cleanOtp, hash);
};
