import { Order } from "../../../user-side/order/models/order.model.js";
import { buildDateFilter } from "../../sales-report/helper/buildDateFilter.helper.js";

export const getTopProduct = async (type) => {
  const dateFilter = buildDateFilter({ type })

  const topProducts = await Order.aggregate([
    // 1. Snag active orders (exclude initial pending states)
    {
      $match: {
        orderStatus: { $in: ["PLACED", "SHIPPED", "DELIVERED"] },
        ...dateFilter,
      },
    },

    // 2. Unpack individual item rows from the embedded items array
    {
      $unwind: "$items",
    },

    // 3. Ignore failed, cancelled, or returned individual items
    {
      $match: {
        "items.itemStatus": {
          $nin: ["CANCELLED", "RETURN_COMPLETED", "RETURNED"],
        },
      },
    },

    // 4. Group by Product ID, tally velocity, and capture order snapshots as fallback layers
    {
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" },
        // FIX: Capture historical snapshots before the data gets lost
        snapshotName: { $first: "$items.name" },
        snapshotImage: { $first: "$items.image" },
      },
    },

    // 5. Sort by sales volume high-to-low
    {
      $sort: {
        totalSold: -1,
      },
    },

    // 6. Restrict output to Top 10 before performing database joins
    {
      $limit: 10,
    },

    // 7. Pull live product data from the database
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "liveProduct",
      },
    },

    // 8. Shape final projection with live values or safe historical fallbacks
    {
      $project: {
        _id: 1,
        totalSold: 1,
        name: {
          $ifNull: [
            { $arrayElemAt: ["$liveProduct.name", 0] },
            "$snapshotName", // Resolves to the snapshot name if the live product was deleted
            "Unknown Product",
          ],
        },
        image: {
          $ifNull: [
            { $arrayElemAt: ["$liveProduct.coverImage", 0] }, // Tries your live array property
            { $arrayElemAt: ["$liveProduct.image", 0] }, // Tries your live fallback string property
            "$snapshotImage", // Resolves to Cloudinary snapshot URL from the order
            "/placeholder-product.png", // Emergency fallback assets
          ],
        },
      },
    },
  ]);

  return topProducts;
};
