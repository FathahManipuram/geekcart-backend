import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { generateSlug } from "../../../../common/utils/slugify.js";
import { Category } from "../../category-management/models/category.model.js";
import { Product } from "../models/product.model.js";
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js";
import { Variant } from "../models/variant.model.js";
import { buildQuery } from "../../../../common/utils/buildQuery.js";
import { deleteImageFromCloudinary } from "../../../../common/utils/cloudinary.delete.js";
import { create } from "hbs";

//Create Product
export const createProductService = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      description,
      coverImage,
      category,
      subcategory,
      manufacturer,
      isReturnable,
      returnWindowDays,
      isFeatured,
      sleeve,
      fabric,
      isLimited,
      isActive,
      variants = [],
    } = data;

    if (!variants || variants.length === 0) {
      throw new AppError(
        "At least one variant configuration is required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existingCategory = await Category.findOne({
      _id: category,
      isDeleted: false,
    }).session(session);

    const existingSubcategory = await Subcategory.findOne({
      _id: subcategory,
      category,
      isDeleted: false,
    }).session(session);

    if (!existingCategory) {
      throw new AppError(
        "Selected master category does not exist or has been removed.",
        HTTP_STATUS.NOT_FOUND,
      );
    }
    if (!existingSubcategory) {
      throw new AppError(
        "Selected subcategory relation could not be verified.",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const combinations = new Set();
    const skus = [];

    const sanitizedVariants = variants.map((v) => {
      const key = `${v.color?.trim()}-${v.size?.trim()}`.toLowerCase();
      if (combinations.has(key)) {
        throw new AppError(
          `Duplicate color/size match found within payload: ${v.size} / ${v.color}`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      combinations.add(key);

      if (!v.sku) {
        throw new AppError(
          "All generated inventory variants must contain a valid SKU.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      skus.push(v.sku);

      return {
        ...v,
        sku: v.sku.toUpperCase().trim(),
        stock: Number(v.stock) || 0,
        price: Number(v.price) || 0,
        costPrice: Number(v.costPrice) || 0,
        salePrice:
          v.salePrice === "" ||
          v.salePrice === undefined ||
          v.salePrice === null
            ? null
            : Number(v.salePrice),
        lowStockThreshold: Number(v.lowStockThreshold) || 5,
      };
    });

    const existingSku = await Variant.findOne({
      sku: { $in: skus },
      isDeleted: false,
    }).session(session);
    if (existingSku) {
      throw new AppError(
        `Inventory SKU overlap clash. Global SKU registry already claims: ${existingSku.sku}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const normalizedName = name.trim();
    const baseSlug = generateSlug(normalizedName);

    const existingSlugs = await Product.find({
      slug: new RegExp(`^${baseSlug}(-[0-9]+)?$`),
      isDeleted: false,
    })
      .select("slug")
      .session(session)
      .lean();

    let slug = baseSlug;
    if (existingSlugs.length > 0) {
      const slugSet = new Set(existingSlugs.map((p) => p.slug));
      let counter = 1;
      while (slugSet.has(`${baseSlug}-${counter}`)) {
        counter++;
      }
      slug = `${baseSlug}-${counter}`;
    }

    const [product] = await Product.create(
      [
        {
          name: normalizedName,
          slug,
          description,
          coverImage,
          sleeve,
          fabric,
          isReturnable,
          returnWindowDays,
          category,
          subcategory,
          manufacturer:
            typeof manufacturer === "string"
              ? JSON.parse(manufacturer)
              : manufacturer,
          isFeatured,
          isLimited,
          isActive,
        },
      ],
      { session },
    );

    const variantDocs = sanitizedVariants.map((variant, index) => ({
      ...variant,
      product: product._id,
      isDefault: index === 0 ? true : !!variant.isDefault,
    }));

    await Variant.insertMany(variantDocs, { session });

    await session.commitTransaction();

    const createdProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean();

    const createdVariants = await Variant.find({
      product: product._id,
    }).lean();

    return {
      message: "Product catalog records completely synchronized successfully.",
      data: {
        ...createdProduct,
        variants: createdVariants,
      },
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};


//Get product
export const getProductsServices = async (query) => {
  
  const {
    page = 1,

    limit = 10,

    search = "",

    status = "",

    subcategory = "",
  } = query;


const filters = {
  isDeleted: false,
};


if (subcategory) {
  filters.subcategory = subcategory;
}


if (search.trim()) {
  filters.name = {
    $regex: search,
    $options: "i",
  };
}

  const products = await Product.find(filters)
    .populate("category", "name")
    .populate("subcategory", "name")
    .sort({ createdAt: -1 })
    .lean();


  const productIds = products.map((product) => product._id);

 
  const variants = await Variant.find({
    product: {
      $in: productIds,
    },

    isDeleted: false,
  }).lean();

 
  const formattedProducts = products.map((product) => {
  
    const productVariants = variants.filter(
      (variant) => variant.product.toString() === product._id.toString(),
    );

  
    const stock = productVariants.reduce(
      (total, variant) => total + (variant.stock || 0),
      0,
    );


    const price =
      productVariants.length > 0
        ? Math.min(
            ...productVariants.map(
              (variant) => variant.salePrice || variant.price,
            ),
          )
        : 0;

    
    let status = "in-stock";

    if (stock === 0) {
      status = "out-of-stock";
    } else if (stock < 5) {
      status = "low-stock";
    }

   
    const sizes = [...new Set(productVariants.map((variant) => variant.size))];

    return {
      ...product,

      variants: productVariants,

      stock,

      price,

      status,

      sizes,
    };
  });

  

  const totalSkuUnits = variants.reduce(
    (total, variant) => total + (variant.stock || 0),
    0,
  );

  const lowStockAlerts = variants.filter(
    (variant) => variant.stock <= variant.lowStockThreshold,
  ).length;

  const activeSubcategories = new Set(
    products.map((product) => product.subcategory?._id?.toString()),
  ).size;

  const inventoryValue = variants.reduce(
    (total, variant) =>
      total + variant.stock * (variant.salePrice || variant.price || 0),
    0,
  );

  return {
    message: "Products fetched successfully",

    data: {
      products: formattedProducts,

      stats: {
        totalSkuUnits,

        lowStockAlerts,

        activeSubcategories,

        inventoryValue,
      },
    },
  };
};


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


//Update
export const updateProductService = async (productId, data) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
   
    const existingProduct = await Product.findOne({
      _id: productId,

      isDeleted: false,
    }).session(session);

    if (!existingProduct) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

   
    const { variants, ...productData } = data;

   
    const updateData = Object.fromEntries(
      Object.entries(productData).filter(([_, value]) => value !== undefined),
    );

   
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,

      updateData,

      {
        new: true,

        session,
      },
    );

   
    let oldImages = [];

   
    if (variants !== undefined) {
     
      const skus = variants.map((variant) => variant.sku);

      const existingSku = await Variant.findOne({
        sku: {
          $in: skus,
        },

        product: {
          $ne: productId,
        },

        isDeleted: false,
      }).session(session);

      if (existingSku) {
        throw new AppError(
          `SKU already exists: ${existingSku.sku}`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

     
      const oldVariants = await Variant.find({
        product: productId,

        isDeleted: false,
      }).session(session);

      
      oldImages = oldVariants.flatMap((variant) => variant.images || []);

      
      await Variant.updateMany(
        {
          product: productId,
        },

        {
          isDeleted: true,
        },

        {
          session,
        },
      );

     
      const existingVariantMap = new Map(
        oldVariants.map((variant) => [
          `${variant.color}-${variant.size}`,
          variant,
        ]),
      );

      
      const variantDocs = variants.map((variant, index) => {
        const key = `${variant.color}-${variant.size}`;

        const existingVariant = existingVariantMap.get(key);

        return {
          ...variant,

         
          images:
            variant.images && variant.images.length >= 3
              ? variant.images
              : existingVariant?.images || [],

          product: productId,

          isDefault: index === 0,
        };
      });

      if (variantDocs.length > 0) {
        await Variant.insertMany(variantDocs, {
          session,
        });
      }
    }

   
    await session.commitTransaction();

   
    const finalVariants = await Variant.find({
      product: updatedProduct._id,

      isDeleted: false,
    }).lean();

   
    const usedImages = finalVariants.flatMap((variant) => variant.images || []);

   
    const removableImages = oldImages.filter(
      (image) => !usedImages.includes(image),
    );

    for (const image of removableImages) {
      await deleteImageFromCloudinary(image);
    }

    
    const finalProduct = await Product.findById(updatedProduct._id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean();

    return {
      message: "Product updated successfully",

      data: {
        ...finalProduct,

        variants: finalVariants,
      },
    };
  } catch (err) {
    await session.abortTransaction();

    throw err;
  } finally {
    await session.endSession();
  }
};


export const getProductsService = async (query) => {
  
 const {
   page = 1,

   limit = 10,

   search = "",

   subcategory = "",

   productStatus = "",

   stockStatus = "",

   sort = "latest",
 } = query;

  
  const filters = {
    isDeleted: false,
  };

  
  if (search.trim()) {
    filters.name = {
      $regex: search,
      $options: "i",
    };
  }


  if (subcategory) {
    filters.subcategory = subcategory;
  }
if (productStatus) {
  filters.isActive = productStatus === "active";
}
 
  const products = await Product.find(filters)
    .populate("category", "name")
    .populate("subcategory", "name")
    .sort({
      createdAt: sort === "oldest" ? 1 : -1,
    })
    .lean();

 
  const productIds = products.map((product) => product._id);

 
  const variants = await Variant.find({
    product: {
      $in: productIds,
    },

    isDeleted: false,
  }).lean();

 
  const formattedProducts = products.map((product) => {
   
    const productVariants = variants.filter(
      (variant) => variant.product.toString() === product._id.toString(),
    );

    
    const stock = productVariants.reduce(
      (total, variant) => total + (variant.stock || 0),
      0,
    );

   
    const price =
      productVariants.length > 0
        ? Math.min(
            ...productVariants.map(
              (variant) => variant.salePrice || variant.price,
            ),
          )
        : 0;

   
    let productStatus = "in-stock";

    if (stock === 0) {
      productStatus = "out-of-stock";
    } else if (stock < 5) {
      productStatus = "low-stock";
    }

    
    const sizes = [...new Set(productVariants.map((variant) => variant.size))];

    return {
      ...product,

      variants: productVariants,

      stock,

      price,

      status: productStatus,

      sizes,
    };
  });

 
  let filteredProducts = formattedProducts;

  if (stockStatus) {
    filteredProducts = formattedProducts.filter(
      (product) => product.status === stockStatus,
    );
  }

  
  const currentPage = Number(page);

  const perPage = Number(limit);

  const totalProducts = filteredProducts.length;

  const totalPages = Math.ceil(totalProducts / perPage);

  const startIndex = (currentPage - 1) * perPage;

  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + perPage,
  );

  
  const totalSkuUnits = variants.reduce(
    (total, variant) => total + (variant.stock || 0),
    0,
  );

  const lowStockAlerts = variants.filter(
    (variant) => variant.stock <= variant.lowStockThreshold,
  ).length;

  const activeSubcategories = new Set(
    products.map((product) => product.subcategory?._id?.toString()),
  ).size;

  const inventoryValue = variants.reduce(
    (total, variant) =>
      total + variant.stock * (variant.salePrice || variant.price || 0),
    0,
  );

  return {
    message: "Products fetched successfully",

    data: {
      products: paginatedProducts,

      pagination: {
        totalProducts,

        totalPages,

        currentPage,

        perPage,
      },

      stats: {
        totalSkuUnits,

        lowStockAlerts,

        activeSubcategories,

        inventoryValue,
      },
    },
  };
};


// delete product
export const deleteProductService = async (productId) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
   
    const existingProduct = await Product.findOne({
      _id: productId,
      isDeleted: false,
    }).session(session);

    if (!existingProduct) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    
    await Product.findByIdAndUpdate(
      productId,
      {
        isDeleted: true,
        isActive: false,
      },
      {
        session,
      },
    );

 
    await Variant.updateMany(
      {
        product: productId,
      },
      {
        isDeleted: true,
        isActive: false,
      },
      {
        session,
      },
    );

  
    await session.commitTransaction();

    return {
      message: "Product deleted successfully",
    };
  } catch (err) {
    await session.abortTransaction();

    throw err;
  } finally {
    await session.endSession();
  }
};