import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Category } from "../../category-management/models/category.model.js";
import { Product } from "../../product-management/models/product.model.js";
import { Variant } from "../../product-management/models/variant.model.js";
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js";
import { Offer } from "../models/offer.model.js";

// Create Offer
export const createOfferService = async (payload) => {
  const { name, offerType, targetId, startDate, expiryDate } = payload;

  if (new Date(startDate) >= new Date(expiryDate)) {
    throw new AppError(
      "Expiry date must be after the start date",
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  let target = null;

  switch (offerType) {
    case "Product":
      target = await Product.findOne({
        _id: targetId,
        isDeleted: false,
        isActive: true,
      });
      break;

    case "Category":
      target = await Category.findOne({
        _id: targetId,
        isDeleted: false,
        isActive: true,
      });
      break;

    case "Subcategory":
      target = await Subcategory.findOne({
        _id: targetId,
        isDeleted: false,
        isActive: true,
      });
      break;

    default:
      throw new AppError("Invalid offer type", HTTP_STATUS.BAD_REQUEST);
  }

  if (!target) {
    throw new AppError(`${offerType} not found`, HTTP_STATUS.NOT_FOUND);
  }

  
  const existingOffer = await Offer.findOne({
    offerType,
    targetId,
    isDeleted: false,
  });

  if (existingOffer) {
    throw new AppError(
      `An offer already exists for this ${offerType.toLowerCase()}`,
      HTTP_STATUS.CONFLICT,
    );
  }


  const existingName = await Offer.findOne({
    name: {
      $regex: `^${name.trim()}$`,
      $options: "i",
    },
    isDeleted: false,
  });

  if (existingName) {
    throw new AppError("Offer name already exists", HTTP_STATUS.CONFLICT);
  }

  const offer = await Offer.create(payload);

  return {
    message: "Offer created successfully",
    data: offer,
  };
};


// Get all offer
export const getOffersService = async ({
  page = 1,
  limit = 10,
  search = "",
  offerType,
  status,
  sort = "-createdAt",
}) => {
  const query = {
    isDeleted: false,
  };


 page = Number(page);
 limit = Number(limit);
  const now = new Date();

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };

    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  if (offerType && offerType !== "ALL") {
    query.offerType = offerType;
  }

  if (status === "ACTIVE") {
    query.isActive = true;
    query.startDate = { $lte: now };
    query.expiryDate = {$gte: now}
  }

  if (status === "INACTIVE") {
    query.isActive = false;
  }

   if (status === "SCHEDULED") {
    query.isActive = true;
     query.startDate = {$gt: now}
   }

    if (status === "EXPIRED") {
      query.isActive = true;
      query.expiryDate = {$lt: now}

    }



 const skip = (page - 1) * limit;


  const [offers, totalOffers, statsResult] = await Promise.all([
    //offers
    Offer.find(query)
      .populate("targetId", "name")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),

    //total offers
    Offer.countDocuments(query),

    //statsResult
    Offer.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,

          totalOffers: {
            $sum: 1,
          },

          activeOffers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isActive", true] },
                    { $lte: ["$startDate", now] },
                    { $gte: ["$expiryDate", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          productOffers: {
            $sum: {
              $cond: [{ $eq: ["$offerType", "Product"] }, 1, 0],
            },
          },

          categoryOffers: {
            $sum: {
              $cond: [
                {
                  $in: ["$offerType", ["Category", "Subcategory"]],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const stats = statsResult[0] || {
    totalOffers: 0,
    activeOffers: 0,
    productOffers: 0,
    categoryOffers: 0,
  };

  return {
    message: "Offers fetched successfully",

    data: {
      offers,
      stats,

      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalOffers / Number(limit)),
        totalItems: totalOffers,
        limit: Number(limit),
      },
    },
  };
};

// Get offer details
export const getOfferDetailsService = async (offerId) => {
  const offer = await Offer.findOne({
    _id: offerId,
    isDeleted: false,
  })
    .populate("targetId", "name")

  if (!offer) {
    throw new AppError("Offer not found", HTTP_STATUS.NOT_FOUND);
  }


  return {
    message: "Offer fetched successfully",
    data: offer,
  };
};



// Update offer
export const updateOfferService = async (offerId, payload) => {
  const offer = await Offer.findOne({
    _id: offerId,
    isDeleted: false,
  });

  if (!offer) {
    throw new AppError("Offer not found", HTTP_STATUS.NOT_FOUND);
  }

  if (payload.startDate) {
    payload.startDate = new Date(payload.startDate);

    payload.startDate.setHours(0, 0, 0, 0);
  }

  if (payload.expiryDate) {
    payload.expiryDate = new Date(payload.expiryDate);

    payload.expiryDate.setHours(23, 59, 59, 999);
  }

  const startDate = payload.startDate || offer.startDate;

  const expiryDate = payload.expiryDate || offer.expiryDate;

  if (startDate > expiryDate) {
    throw new AppError(
      "Expiry date must be after start date",
      HTTP_STATUS.BAD_REQUEST,
    );
  }


  const offerType = payload.offerType || offer.offerType;
  const targetId = payload.targetId || offer.targetId;

  let target = null;

  switch (offerType) {
    case "Product":
      target = await Product.findOne({
        _id: targetId,
        isActive: true,
        isDeleted: false,
      });
      break;

    case "Category":
      target = await Category.findOne({
        _id: targetId,
        isActive: true,
        isDeleted: false,
      });
      break;

    case "Subcategory":
      target = await Subcategory.findOne({
        _id: targetId,
        isActive: true,
        isDeleted: false,
      });
      break;

    default:
      throw new AppError("Invalid offer type", HTTP_STATUS.BAD_REQUEST);
  }

  if (!target) {
    throw new AppError(`${offerType} not found`, HTTP_STATUS.NOT_FOUND);
  }


  const existingOffer = await Offer.findOne({
    _id: { $ne: offerId },
    offerType,
    targetId,
    isDeleted: false,
  });

  if (existingOffer) {
    throw new AppError(
      `An offer already exists for this ${offerType.toLowerCase()}`,
      HTTP_STATUS.CONFLICT,
    );
  }


  if (payload.name) {
    const existingName = await Offer.findOne({
      _id: { $ne: offerId },
      name: {
        $regex: `^${payload.name.trim()}$`,
        $options: "i",
      },
      isDeleted: false,
    });

    if (existingName) {
      throw new AppError("Offer name already exists", HTTP_STATUS.CONFLICT);
    }
  }

  const updatedOffer = await Offer.findByIdAndUpdate(offerId, payload, {
    new: true,
    runValidators: true,
  }).populate("targetId", "name");

  return {
    message: "Offer updated successfully",
    data: updatedOffer,
  };
};


// Toggle status
export const toggleOfferStatusService = async (offerId) => {
  const offer = await Offer.findOne({
    _id: offerId,
    isDeleted: false,
  });

  if (!offer) {
    throw new AppError("Offer not found", HTTP_STATUS.NOT_FOUND);
  }

  offer.isActive = !offer.isActive;

  await offer.save();

  return {
    message: `Offer ${
      offer.isActive ? "activated" : "deactivated"
    } successfully`,
    data: offer,
  };
};

export const deleteOfferService = async (offerId) => {
  const offer = await Offer.findOne({
    _id: offerId,
    isDeleted: false,
  });

  if (!offer) {
    throw new AppError("Offer not found", HTTP_STATUS.NOT_FOUND);
  }
  offer.isDeleted = true;

  await offer.save();

  return {
    message: "Offer deleted successfully",
  };
};