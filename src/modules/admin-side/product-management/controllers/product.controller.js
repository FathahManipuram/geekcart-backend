
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { deleteImageFromCloudinary } from "../../../../common/utils/cloudinary.delete.js";
import { uploadImage } from "../../../../common/utils/uploadImage.js";
import { createProductService, getProductDetailsService, getProductsService, updateProductService } from "../services/product.service.js";


// create product
export const createProductController = async (req, res, next) => {
  try {
    console.log("req.body here: ", req.body);

    const payload = {
      ...req.body,
    };

    console.log("payload here: ", payload);


    const coverFile = (req.files || []).find(
      (file) => file.fieldname === "coverImage",
    );

    if (coverFile) {
      const uploadedCover = await uploadImage(
        coverFile,
        "products/cover-images",
      );

      payload.coverImage = uploadedCover.secure_url;
    }

    const galleryFiles= (req.files || []).filter((file)=> file.fieldname === "galleryImages")

      const uploadedGalleryImages =[]

      for (const file of galleryFiles) {
          const uploaded = await uploadImage(file, "products/gallery-images");

          uploadedGalleryImages.push(uploaded.secure_url);
        }

        payload.galleryImages =[
          ...(payload.existingGalleryImages || []),
          ...uploadedGalleryImages,
        ]

        delete payload.existingGalleryImages




    console.log("final payload: ", payload);


    const result = await createProductService(payload);

    return successResponse(res, HTTP_STATUS.CREATED, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// //get products
// export const getProductsController=async (req, res, next)=>{
// try{
//   const query= req.qurey
//   const result= await getProductsService()

//    return successResponse(
//         res,

//         HTTP_STATUS.OK,

//         result.message,

//         result.data,
//       );
// } catch(err){
//   next(err)
// }
// }

export const getProductsController = async (req, res, next) => {
  try {
   
    const result = await getProductsService();


    return successResponse(
      res,

      HTTP_STATUS.OK,

      result.message,

      result.data,
    );
  } catch (err) {
    next(err);
  }
};


//Get product details
export const getProductDetailsController= async(req, res, next)=>{
  try{
    const {slug} = req.params

    const result = await getProductDetailsService(slug)

    return successResponse(
      res,
      HTTP_STATUS.OK,
      result.message,
      result.data
    )
  }catch(err){
    next(err)
  }
}


//Update product
export const updateProductController= async(req, res, next)=>{
  try{
      const { productId } = req.params;
  const payload = {
    ...req.body,
  };

payload.coverImage= payload.existingCoverImage || ""
const coverFile= (req.files || []).find((file)=> file.fieldname=== "coverImage")

if(coverFile){
  if(payload.existingCoverImage){
    await deleteImageFromCloudinary(payload.existingCoverIamge)
  }
  const uploadedCover= await uploadImage(coverFile, "products/cover-images")
  payload.coverImage= uploadedCover.secure_url
}
 console.log("update payload:", payload);

const result = await updateProductService(productId, payload);
return successResponse(res, HTTP_STATUS.OK, result.message, result.data);

  }catch(err){
    next(err)
  }
}