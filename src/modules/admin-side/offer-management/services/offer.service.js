import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Offer } from "../models/offer.model.js";

// Create Offer
export const createOfferService = async (payload) => {
  const {
    offerType,
    productId,
    categoryId,
    subcategoryId,
    startDate,
    expiryDate,
  } = payload;

  if (offerType === "PRODUCT" && !productId) {
    throw new AppError("Product is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (offerType === "CATEGORY" && !categoryId) {
    throw new AppError("Category is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (offerType === "SUBCATEGORY" && !subcategoryId) {
    throw new AppError("Subcategory is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (new Date(startDate) >= new Date(expiryDate)) {
    throw new AppError(
      "Expiry date must be after start date",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let existingOffer = null;

  if (offerType === "PRODUCT") {
    existingOffer = await Offer.findOne({
      offerType: "PRODUCT",
      applicableProducts: productId,
      isDeleted: false,
    });

    payload.applicableProducts = productId;
    delete payload.productId;
  }

  if (offerType === "CATEGORY") {
    existingOffer = await Offer.findOne({
      offerType: "CATEGORY",
      applicableCategories: categoryId,
      isDeleted: false,
    });

    payload.applicableCategories = categoryId;
    delete payload.categoryId;
  }

  if (offerType === "SUBCATEGORY") {
    existingOffer = await Offer.findOne({
      offerType: "SUBCATEGORY",
      applicableSubcategories: subcategoryId,
      isDeleted: false,
    });

    payload.applicableSubcategories = subcategoryId;
    delete payload.subcategoryId;
  }

  if (existingOffer) {
    throw new AppError(
      `${offerType.toLowerCase()} offer already exists`,
      HTTP_STATUS.CONFLICT,
    );
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

  if (search && search.trim()) {
    query.name = {
      $regex: search,
      $options: "i",
    };
  }

  if (offerType && offerType !== "ALL") {
    query.offerType = offerType;
  }

  if (status === "ACTIVE") {
    query.isActive = true;
  }

  if (status === "INACTIVE") {
    query.isActive = false;
  }

  const skip = (page - 1) * limit;

  const [offers, totalOffers] = await Promise.all([
    Offer.find(query)
      .populate("applicableProducts", "name")
      .populate("applicableCategories", "name")
      .populate("applicableSubcategories", "name")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Offer.countDocuments(query),
  ]);

  return {
    message: "Offers fetched successfully",

    data: {
      offers,

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
    .populate("applicableProducts", "name")
    .populate("applicableCategories", "name")
    .populate("applicableSubcategories", "name")
    .lean();

  if (!offer) {
    throw new AppError("Offer not found", HTTP_STATUS.NOT_FOUND);
  }

  const formValues = {
    ...offer,

    productId: offer?.applicableProducts?._id || "",

    categoryId: offer?.applicableCategories?._id || "",

    subcategoryId: offer?.applicableSubcategories?._id || "",
  };

  return {
    message: "Offer fetched successfully",
    data: formValues,
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

  const { offerType, productId, categoryId, subcategoryId } = payload;

  if (offerType === "PRODUCT" && !productId) {
    throw new AppError("Product is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (offerType === "CATEGORY" && !categoryId) {
    throw new AppError("Category is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (offerType === "SUBCATEGORY" && !subcategoryId) {
    throw new AppError("Subcategory is required", HTTP_STATUS.BAD_REQUEST);
  }

  let existingOffer = null;

  if (offerType === "PRODUCT") {
    existingOffer = await Offer.findOne({
      _id: { $ne: offerId },

      offerType: "PRODUCT",

      applicableProducts: productId,

      isDeleted: false,
      isActive: true,
    });

    payload.applicableProducts = productId;

    payload.applicableCategories = null;

    payload.applicableSubcategories = null;
  }

  if (offerType === "CATEGORY") {
    existingOffer = await Offer.findOne({
      _id: { $ne: offerId },

      offerType: "CATEGORY",

      applicableCategories: categoryId,

      isDeleted: false,
      isActive: true,
    });

    payload.applicableCategories = categoryId;

    payload.applicableProducts = null;

    payload.applicableSubcategories = null;
  }

  if (offerType === "SUBCATEGORY") {
    existingOffer = await Offer.findOne({
      _id: { $ne: offerId },

      offerType: "SUBCATEGORY",

      applicableSubcategories: subcategoryId,

      isDeleted: false,
      isActive: true,
    });

    payload.applicableSubcategories = subcategoryId;

    payload.applicableProducts = null;

    payload.applicableCategories = null;
  }

  if (existingOffer) {
    throw new AppError("Offer already exists", HTTP_STATUS.CONFLICT);
  }

  delete payload.productId;
  delete payload.categoryId;
  delete payload.subcategoryId;

  const updatedOffer = await Offer.findByIdAndUpdate(offerId, payload, {
    new: true,
    runValidators: true,
  });

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