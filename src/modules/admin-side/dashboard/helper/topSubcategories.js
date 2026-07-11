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

    {
      $unwind: "$items",
    },

    {
      $match: {
        "items.itemStatus": {
          $nin: ["CANCELLED", "RETURN_COMPLETED", "RETURNED"],
        },
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $unwind: {
        path: "$productInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: {
          $ifNull: ["$productInfo.subcategory", "ARCHIVED_SUBCAT"],
        },
        totalSold: { $sum: "$items.quantity" },
      },
    },

    {
      $sort: { totalSold: -1 },
    },

    {
      $limit: 10,
    },

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
