import { Order } from "../../../user-side/order/models/order.model.js";

export const getSalesChart = async () => {
  const salesChart = await Order.aggregate([
    {
      $match: {
        orderStatus: "DELIVERED",
      },
    },

    {
      $group: {
        _id: {
          month: {
            $month: "$createdAt",
          },
        },

        sales: {
          $sum: "$totalAmount",
        },
      },
    },

    {
      $sort: {
        "_id.month": 1,
      },
    },
  ]);

  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formattedSalesChart = salesChart.map((item) => ({
    month: monthNames[item._id.month],
    sales: item.sales,
  }));

  return formattedSalesChart;
};
