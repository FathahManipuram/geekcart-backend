import mongoose from "mongoose";

import { Product } from "../../../admin-side/product-management/models/product.model.js";
import { getActiveOffers } from "../../offer/helpers/getActiveOffers.helper.js";
import { applyOffersToProducts } from "../../offer/helpers/applyOffersToProducts.helper.js";

export const getCollectionsService = async (query) => {
  console.log("collection Service: ", query)
  const {
    page = 1,
    limit = 8,
    search = "",
    subcategory = [],
    sizes = [],
    colors = [],
    sortBy = "latest",
    minPrice = 0,
    maxPrice = 99999,
  } = query;


  const currentPage = Number(page);
  const perPage = Number(limit);


  const normalizedSubcategories = Array.isArray(subcategory)
    ? subcategory
    : subcategory
      ? [subcategory]
      : [];

  const normalizedSizes = Array.isArray(sizes) ? sizes : sizes ? [sizes] : [];

  const normalizedColors = Array.isArray(colors)
    ? colors
    : colors
      ? [colors]
      : [];

  
  const productMatch = {
    isDeleted: false,
    isActive: true,
  };

 
  if (search.trim()) {
    productMatch.name = {
      $regex: search,
      $options: "i",
    };
  }

 
  if (normalizedSubcategories.length > 0) {
    productMatch.subcategory = {
      $in: normalizedSubcategories.map((id) => new mongoose.Types.ObjectId(id)),
    };

   }


  const variantMatch = {
    isDeleted: false,
    isActive: true,
  };


  if (normalizedSizes.length > 0) {
    variantMatch.size = {
      $in: normalizedSizes,
    };
  }

 
  if (normalizedColors.length > 0) {
    variantMatch.color = {
      $in: normalizedColors,
    };
  }


  variantMatch.$expr = {
    $and: [
      {
        $gte: [
          {
            $ifNull: ["$salePrice", "$price"],
          },
          Number(minPrice),
        ],
      },

      {
        $lte: [
          {
            $ifNull: ["$salePrice", "$price"],
          },
          Number(maxPrice),
        ],
      },
    ],
  };


  let sortStage = {
    createdAt: -1,
  };

  if (sortBy === "oldest") {
    sortStage = {
      createdAt: 1,
    };
  }

  if (sortBy === "price-low") {
    sortStage = {
      lowestPrice: 1,
    };
  }

  if (sortBy === "price-high") {
    sortStage = {
      lowestPrice: -1,
    };
  }

  if (sortBy === "A-Z") {
    sortStage = {
      name: 1,
    };
  }

    if (sortBy === "Z-A") {
      sortStage = {
        name: -1,
      };
    }


  const pipeline = [

    {
      $match: productMatch,
    },

    
    {
      $lookup: {
        from: "variants",

        localField: "_id",

        foreignField: "product",

        as: "variants",
      },
    },

   
    {
      $addFields: {
        variants: {
          $filter: {
            input: "$variants",

            as: "variant",

            cond: {
              $and: [
                {
                  $eq: ["$$variant.isDeleted", false],
                },

                {
                  $eq: ["$$variant.isActive", true],
                },

                ...(normalizedSizes.length > 0
                  ? [
                      {
                        $in: ["$$variant.size", normalizedSizes],
                      },
                    ]
                  : []),

                ...(normalizedColors.length > 0
                  ? [
                      {
                        $in: ["$$variant.color", normalizedColors],
                      },
                    ]
                  : []),

                {
                  $gte: [
                    {
                      $ifNull: ["$$variant.salePrice", "$$variant.price"],
                    },
                    Number(minPrice),
                  ],
                },

                {
                  $lte: [
                    {
                      $ifNull: ["$$variant.salePrice", "$$variant.price"],
                    },
                    Number(maxPrice),
                  ],
                },
              ],
            },
          },
        },
      },
    },

  
    {
      $match: {
        "variants.0": {
          $exists: true,
        },
      },
    },

   
    {
      $addFields: {
        lowestPrice: {
          $min: {
            $map: {
              input: "$variants",

              as: "variant",

              in: {
                $ifNull: ["$$variant.salePrice", "$$variant.price"],
              },
            },
          },
        },
      },
    },

   
    {
      $lookup: {
        from: "subcategories",

        localField: "subcategory",

        foreignField: "_id",

        as: "subcategory",
      },
    },

    {
      $unwind: {
        path: "$subcategory",

        preserveNullAndEmptyArrays: true,
      },
    },


    {
      $sort: sortStage,
    },

    {
      $facet: {
        products: [
          {
            $skip: (currentPage - 1) * perPage,
          },

          {
            $limit: perPage,
          },
        ],

        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    },
  ];


  const result = await Product.aggregate(pipeline);

const offers= await getActiveOffers()
const products = applyOffersToProducts({
  products: result[0]?.products || [],
  offers,
});

 // const products = result[0]?.products || [];

  const totalProducts = result[0]?.totalCount?.[0]?.count || 0;

  const totalPages = Math.ceil(totalProducts / perPage);


  return {
    message: "Collections fetched successfully",

    data: {
      products,

      pagination: {
        currentPage,

        perPage,

        totalProducts,

        totalPages,
      },
    },
  };

};
