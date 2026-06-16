import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Subcategory } from "../../../admin-side/subcategory-management/models/subcategory.model.js";


export const getHomeDataService = async () => {
 
  const categories = await Subcategory.find({
    isDeleted: false,
    isActive: true,
  })
    .select("name image slug")
    .limit(4)
    .lean();

 
  const products = await Product.find({
    isDeleted: false,
    //isActive: true,
  })
    .populate("subcategory", "name")
    .sort({
      createdAt: -1,
    })
    .limit(8)
    .lean();


  const productIds = products.map((product) => product._id);

  const variants = await Variant.find({
    product: {
      $in: productIds,
    },

    isDeleted: false,

    isActive: true,
  }).lean();


  const formattedProducts = products.map((product) => {
    const productVariants = variants.filter(
      (variant) => variant.product.toString() === product._id.toString(),
    );

 const defaultVariant = productVariants[0];
  
    const price =
      productVariants.length > 0
        ? Math.min(
            ...productVariants.map(
              (variant) => variant.salePrice || variant.price,
            ),
          )
        : 0;

   
    const image = productVariants[0]?.images?.[0] || "";

    return {
      ...product,
      price: defaultVariant?.price,
      salePrice: defaultVariant?.salePrice || null,
      image,
      variantId: defaultVariant?._id || null,
    };
  });

  return {
    message: "Home data fetched successfully",

    data: {
      categories,

      newDrops: formattedProducts,
    },
  };
};

