import { Offer } from "../../../admin-side/offer-management/models/offer.model.js";

export const getActiveOffers = async () => {
  const now = new Date();

  return await Offer.find({
    isDeleted: false,
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
  })
  .lean();
};
