import { Order } from "../../../user-side/order/models/order.model.js";
import { buildDateFilter } from "../../sales-report/helper/buildDateFilter.helper.js";

export const getTopSubcategories = async (type) => {

  const dateFilter = buildDateFilter({ type });
  const topSubcategories = await Order.aggregate([
    
    {
      $match: {
        orderStatus: { $in: ["PLACED", "SHIPPED", "DELIVERED"] },
        ...dateFilter,
      },
    },

    // 2. Unpack individual item rows
    {
      $unwind: "$items",
    },

    // 3. Filter out cancellations and returns
    {
      $match: {
        "items.itemStatus": {
          $nin: ["CANCELLED", "RETURN_COMPLETED", "RETURNED"],
        },
      },
    },

    // 4. Join the live product collection safely
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      // FIX: Use an Outer Join layout so historical items with missing/deleted products aren't discarded
      $unwind: {
        path: "$productInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 5. Group by Subcategory ID, assigning a fallback tag if the live product lookup returned null
    {
      $group: {
        _id: {
          $ifNull: ["$productInfo.subcategory", "ARCHIVED_SUBCAT"],
        },
        totalSold: { $sum: "$items.quantity" },
      },
    },

    // 6. Sort by sales volume high-to-low
    {
      $sort: { totalSold: -1 },
    },

    // 7. Restrict output to top 10 results
    {
      $limit: 10,
    },

    // 8. Pull subcategory text/metadata details
    {
      $lookup: {
        from: "subcategories",
        localField: "_id",
        foreignField: "_id",
        as: "liveSubcategory",
      },
    },
    {
      $unwind: {
        path: "$liveSubcategory",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 9. Shape clean frontend projections with robust fallbacks
    {
      $project: {
        _id: 1,
        totalSold: 1,
        name: {
          $cond: [
            { $eq: ["$_id", "ARCHIVED_SUBCAT"] },
            "Archived Product Sales",
            { $ifNull: ["$liveSubcategory.name", "Uncategorized Items"] },
          ],
        },
      },
    },
  ]);

  return topSubcategories;
};
