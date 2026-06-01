import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";






//Get prodect details
export const getProductDetailsService = async (slug) => {

  const product = await Product.findOne({
	slug,
	isDeleted: false,
  })
	.populate("category", "name")
	.populate("subcategory", "name")
	.lean();

  
  if (!product) {
	throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  
  const variants = await Variant.find({
	product: product._id,

	isDeleted: false,
  }).lean();

  return {
	message: "Product details fetched successfully",

	data: {
	  ...product,
	  variants,
	},
  };
};


//Get similar product
export const getSimilarProductsService = async (slug) => {
  const currentProduct = await Product.findOne({ slug, isDeleted: false });

  if (!currentProduct) {
    throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  const products = await Product.find({
    _id: {
      $ne: currentProduct._id,
    },
    subcategory: currentProduct.subcategory,
    isActive: true,
    isDeleted: false,
  })
    .limit(8)
    .populate("subcategory", "name")
    .lean();

  const productIds = products.map((product) => product._id);

  const variants = await Variant.find({
    product: {
      $in: productIds,
    },
    isDeleted: false,
    isActive: true,
  }).lean();

  const formattedProducts = products.map((product) => ({
    ...product,
    variants: variants.filter(
      (variant) => variant.product.toString() === product._id.toString(),
    ),
  }));

  return {
    message: "Similar products fetched successfully",
    data: formattedProducts,
  };
};
