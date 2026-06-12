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
  toggleProductStatusService,
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

// // update product
// export const updateProductController = async (req, res, next) => {
//   try {
//     const { productId } = req.params;
    

//     const payload = {
//       ...req.body,
//     };
//     console.log("updateController: ", req.files);

//     if (payload.existingCoverImage) {
//       payload.coverImage = payload.existingCoverImage;
//     }

//     const coverFile = (req.files || []).find(
//       (file) => file.fieldname === "coverImage",
//     );

//     if (coverFile) {
//       if (payload.existingCoverImage) {
//         await deleteImageFromCloudinary(payload.existingCoverImage);
//       }

//       const uploadedCover = await uploadImage(
//         coverFile,
//         "products/cover-images",
//       );

//       payload.coverImage = uploadedCover.secure_url;
//       console.log("payloadCoverImage: ", payload.coverImage)
//     }

//     const variantGroups = payload.variantGroups || [];
//     console.log("Variantgroup: ", variantGroups)

//     for (let index = 0; index < variantGroups.length; index++) {
//       const group = variantGroups[index];

//       const groupFiles = (req.files || []).filter(
//         (file) => file.fieldname === `variantGroupImages_${index}[]`,
//       );

//       const uploadedUrls = [];

//       for (const file of groupFiles) {
//         const uploaded = await uploadImage(file, "products/variants");

//         uploadedUrls.push(uploaded.secure_url);
//       }

//       group.images = [...(group.images || []), ...uploadedUrls];
//     }

//     if (payload.variants) {
//       payload.variants = payload.variants.map((variant) => {
//         const matchedGroup = variantGroups.find(
//           (group) => group.color === variant.color,
//         );

//         return {
//           ...variant,

//           images: matchedGroup?.images || [],
//         };
//       });
//     }

//     console.log("updated payload:", payload);

//     const result = await updateProductService(productId, payload);

//     return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
//   } catch (err) {
//     next(err);
//   }
// };




export const updateProductController = async (req, res, next) => {
  try {
    const { productId } = req.params;
    console.log("Incoming files:", req.files);
    console.log("Raw body string payload:", req.body);

    const payload = { ...req.body };

    // Parse text-wrapped arrays arriving via multi-part FormData
    if (typeof payload.variantGroups === "string") {
      payload.variantGroups = JSON.parse(payload.variantGroups);
    }
    if (typeof payload.variants === "string") {
      payload.variants = JSON.parse(payload.variants);
    }
    if (typeof payload.manufacturer === "string") {
      payload.manufacturer = JSON.parse(payload.manufacturer);
    }

    if (payload.existingCoverImage) {
      payload.coverImage = payload.existingCoverImage;
    }

    // Cover Image processing block
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

    // Core Loop: Process files uploaded for each dynamic variant group field index
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

      // Merge remaining old image URLs with the newly generated secure upload URLs
      group.images = [...(group.images || []), ...uploadedUrls];
    }

    // Sync newly updated group images down across your individual variant records
    if (payload.variants) {
      payload.variants = payload.variants.map((variant) => {
        const matchedGroup = variantGroups.find(
          (group) => group.color === variant.color,
        );
        return {
          ...variant,
          images: matchedGroup ? matchedGroup.images : variant.images || [],
        };
      });
    }

    console.log("Final processed database update payload:", payload);

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

//Toggle product status
export const toggleProductStatusController = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await toggleProductStatusService(productId);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};