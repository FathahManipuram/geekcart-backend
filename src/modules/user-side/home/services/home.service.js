import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { Variant } from "../../../admin-side/product-management/models/variant.model.js";
import { Subcategory } from "../../../admin-side/subcategory-management/models/subcategory.model.js";
import { applyOffersToProducts } from "../../offer/helpers/applyOffersToProducts.helper.js";
import { getActiveOffers } from "../../offer/helpers/getActiveOffers.helper.js";

export const getHomeDataService = async () => {



  const [categories, offers, products] = await Promise.all([
    Subcategory.find({ isDeleted: false, isActive: true })
      .select("name image slug")
      .limit(4)
      .lean(),

    getActiveOffers(),

    Product.find({ isDeleted: false, isActive: true })
      .populate("subcategory", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);


  
  // const categories = await Subcategory.find({
  //   isDeleted: false,
  //   isActive: true,
  // })
  //   .select("name image slug")
  //   .limit(4)
  //   .lean();


  // const products = await Product.find({
  //   isDeleted: false,
  //   isActive: true,
  // })
  //   .populate("subcategory", "name")
  //   .sort({ createdAt: -1 })
  //   .limit(8)
  //   .lean();



  const productIds = products.map((product) => product._id);


  const variants = await Variant.find({
    product: { $in: productIds },
    isDeleted: false,
   // isActive: true,
  }).lean();


 // const offers = await getActiveOffers();

  const productsWithVariants = products.map((product) => ({
    ...product,
    variants: variants.filter(
      (variant) => variant.product.toString() === product._id.toString(),
    ),
  }));

 
  const offeredProducts = applyOffersToProducts({products: productsWithVariants, offers});


  const formattedProducts = offeredProducts.map((product) => {
    const defaultVariant =
      product.variants.find((variant) => variant.isDefault) ??
      product.variants[0];

    return {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      subcategory: product.subcategory,
      isActive: product.isActive,

      variantId: defaultVariant?._id ?? null,

      image: defaultVariant?.images?.[0] ?? "",

      price: defaultVariant?.price ?? 0,

      salePrice: defaultVariant?.salePrice ?? defaultVariant?.price ?? 0,

      discountAmount: defaultVariant?.discountAmount ?? 0,

      appliedOffer: defaultVariant?.appliedOffer ?? null,
    };
  });

  return {
    message: "Home data fetched successfully",
    data: {
      categories,
      newDrops: formattedProducts,
      offers,
    },
  };
};