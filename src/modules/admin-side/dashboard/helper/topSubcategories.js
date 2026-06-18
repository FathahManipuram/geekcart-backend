import { Order } from "../../../user-side/order/models/order.model.js";

export const getTopSubcategories= async()=>{
	const topSubcategories = await Order.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
      },
    },

    {
      $unwind: "$items",
    },

    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $lookup: {
        from: "subcategories",
        localField: "product.subcategory",
        foreignField: "_id",
        as: "subcategory",
      },
    },

    {
      $unwind: "$subcategory",
    },

    {
      $group: {
        _id: "$subcategory._id",

        name: {
          $first: "$subcategory.name",
        },

        totalSold: {
          $sum: "$items.quantity",
        },
      },
    },

    {
      $sort: {
        totalSold: -1,
      },
    },

    {
      $limit: 10,
    },
  ]);

  return topSubcategories
}