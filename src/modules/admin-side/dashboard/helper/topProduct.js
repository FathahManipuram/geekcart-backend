import { Order } from "../../../user-side/order/models/order.model.js";
import { buildDateFilter } from "../../sales-report/helper/buildDateFilter.helper.js";

export const getTopProduct = async (type) => {
  const dateFilter = buildDateFilter({ type });

  const topProducts = await Order.aggregate([
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
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" },
        snapshotName: { $first: "$items.name" },
        snapshotImage: { $first: "$items.image" },
      },
    },

    // Sort by sales
    {
      $sort: {
        totalSold: -1,
      },
    },

    {
      $limit: 10,
    },

    // product
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "liveProduct",
      },
    },

    {
      $project: {
        _id: 1,
        totalSold: 1,
        name: {
          $ifNull: [
            { $arrayElemAt: ["$liveProduct.name", 0] },
            "$snapshotName",
            "Unknown Product",
          ],
        },
        image: {
          $ifNull: [
            { $arrayElemAt: ["$liveProduct.coverImage", 0] },
            { $arrayElemAt: ["$liveProduct.image", 0] },
            "$snapshotImage",
            "/placeholder-product.png",
          ],
        },
      },
    },
  ]);

  return topProducts;
};
