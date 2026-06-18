import { Order } from "../../../user-side/order/models/order.model.js";

export const getTopProduct= async()=>{
	const topProducts = await Order.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
      },
    },

    {
      $unwind: "$items",
    },

    {
      $group: {
        _id: "$items.product",

        totalSold: {
          $sum: "$items.quantity",
        },

        name: {
          $first: "$items.name",
        },

        image: {
          $first: "$items.image",
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


return topProducts
}