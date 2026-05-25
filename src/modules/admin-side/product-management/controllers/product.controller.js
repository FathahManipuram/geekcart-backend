import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { deleteImageFromCloudinary } from "../../../../common/utils/cloudinary.delete.js";
import { uploadImage } from "../../../../common/utils/uploadImage.js";
import {
  createProductService,
  deleteProductService,
  getProductDetailsService,
  getProductsService,
  updateProductService,
} from "../services/product.service.js";


// create product
export const createProductController = async (req, res, next) => {
  try {
    console.log("REQ FILES:", req.files);
    const payload = {
      ...req.body,
    };

    console.log("Payload here :", payload);
    const coverFile = req.files?.find(
      (file) => file.fieldname === "coverImage",
    );

    if (coverFile) {
      const uploadedCover = await uploadImage(
        coverFile,
        "products/cover-images",
      );

      payload.coverImage = uploadedCover.secure_url;
    }

    const variantGroups = payload.variantGroups || [];

    for (let index = 0; index < variantGroups.length; index++) {
      const group = variantGroups[index];

      const groupFiles =
        req.files?.filter(
          (file) => file.fieldname === `variantGroupImages_${index}[]`,
        ) || [];

      const uploadedUrls = [];

      for (const file of groupFiles) {
        const uploaded = await uploadImage(file, "products/variants");

        uploadedUrls.push(uploaded.secure_url);
      }

      group.images = [...(group.images || []), ...uploadedUrls];
    }

    payload.variants = (payload.variants || []).map((variant) => {
      const matchedGroup = variantGroups.find(
        (group) => group.color === variant.color,
      );

      return {
        ...variant,

        images: matchedGroup?.images || [],
      };
    });

    const invalidVariant = payload.variants.find(
      (variant) => !variant.images || variant.images.length < 3,
    );

    if (invalidVariant) {
      throw new AppError(
        `Variant ${invalidVariant.size}/${invalidVariant.color} requires at least 3 images.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    console.log("Final payload: ", payload);
    const result = await createProductService(payload);

    return successResponse(
      res,
      HTTP_STATUS.CREATED,
      result.message,
      result.data,
    );
  } catch (err) {
    next(err);
  }
};




//Get product details
export const getProductDetailsController = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const result = await getProductDetailsService(slug);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};


// update product
export const updateProductController = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const payload = {
      ...req.body,
    };

   
    if (payload.existingCoverImage) {
      payload.coverImage = payload.existingCoverImage;
    }

   
    const coverFile = (req.files || []).find(
      (file) => file.fieldname === "coverImage",
    );

   
    if (coverFile) {
     
      if (payload.existingCoverImage) {
        await deleteImageFromCloudinary(payload.existingCoverImage);
      }

      
      const uploadedCover = await uploadImage(
        coverFile,
        "products/cover-images",
      );

      payload.coverImage = uploadedCover.secure_url;
    }

    const variantGroups = payload.variantGroups || [];

    
    for (let index = 0; index < variantGroups.length; index++) {
      const group = variantGroups[index];

      const groupFiles = (req.files || []).filter(
        (file) => file.fieldname === `variantGroupImages_${index}[]`,
      );

      const uploadedUrls = [];

      
      for (const file of groupFiles) {
        const uploaded = await uploadImage(file, "products/variants");

        uploadedUrls.push(uploaded.secure_url);
      }

     
      group.images = [...(group.images || []), ...uploadedUrls];
    }

  
    if (payload.variants) {
      payload.variants = payload.variants.map((variant) => {
        const matchedGroup = variantGroups.find(
          (group) => group.color === variant.color,
        );

        return {
          ...variant,

          images: matchedGroup?.images || [],
        };
      });
    }

    console.log("update payload:", payload);

    const result = await updateProductService(productId, payload);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Delete product
export const deleteProductController = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await deleteProductService(productId);

    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};


//get product
export const getProductsController = async (req, res, next) => {
  try {
    const query = req.query;

    const result = await getProductsService(query);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};