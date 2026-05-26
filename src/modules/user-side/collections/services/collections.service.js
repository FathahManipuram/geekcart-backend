import mongoose from "mongoose";

import { Product } from "../../../admin-side/product-management/models/product.model";

export const getCollectionsService = async (query) => {
  /**
   * Query Params
   */
  const {
    page = 1,

    limit = 12,

    search = "",

    subcategory = [],

    sizes = [],

    colors = [],

    sortBy = "latest",

    minPrice = 0,

    maxPrice = 999999,
  } = query;

  /**
   * Pagination
   */
  const currentPage = Number(page);

  const perPage = Number(limit);

  /**
   * Normalize Arrays
   */
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

  /**
   * Product Match
   */
  const productMatch = {
    isDeleted: false,

    isActive: true,
  };

  /**
   * Search
   */
  if (search.trim()) {
    productMatch.name = {
      $regex: search,
      $options: "i",
    };
  }

  /**
   * Subcategory
   */
  if (normalizedSubcategories.length > 0) {
    productMatch.subcategory = {
      $in: normalizedSubcategories.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  /**
   * Variant Match
   */
  const variantMatch = {
    isDeleted: false,

    isActive: true,
  };

  /**
   * Sizes
   */
  if (normalizedSizes.length > 0) {
    variantMatch.size = {
      $in: normalizedSizes,
    };
  }

  /**
   * Colors
   */
  if (normalizedColors.length > 0) {
    variantMatch.color = {
      $in: normalizedColors,
    };
  }

  /**
   * Price Filter
   */
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

  /**
   * Sort
   */
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

  /**
   * Aggregation Pipeline
   */
  const pipeline = [
    /**
     * Product Filters
     */
    {
      $match: productMatch,
    },

    /**
     * Variants
     */
    {
      $lookup: {
        from: "variants",

        localField: "_id",

        foreignField: "product",

        as: "variants",
      },
    },

    /**
     * Filter Variants
     */
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

    /**
     * Remove Empty Variant Products
     */
    {
      $match: {
        "variants.0": {
          $exists: true,
        },
      },
    },

    /**
     * Lowest Price
     */
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

    /**
     * Populate Subcategory
     */
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

    /**
     * Sorting
     */
    {
      $sort: sortStage,
    },

    /**
     * Pagination
     */
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

  /**
   * Execute
   */
  const result = await Product.aggregate(pipeline);

  /**
   * Data
   */
  const products = result[0]?.products || [];

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
