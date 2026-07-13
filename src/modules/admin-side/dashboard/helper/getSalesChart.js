import { Order } from "../../../user-side/order/models/order.model.js";
import { buildDateFilter } from "../../sales-report/helper/buildDateFilter.helper.js";

export const getSalesChart = async (type = "monthly") => {
  const filters = {
    paymentStatus: { $in: ["PAID", "PARTIALLY_REFUNDED", "FULLY_REFUNDED"] },
  };

  Object.assign(filters, buildDateFilter({ type }));

  let groupExpression;
  let sortExpression;

  if (type === "daily" || type === "today") {
    groupExpression = {
      label: {
        $dateToString: {
          format: "%H:00",
          date: "$createdAt",
          timezone: "Asia/Kolkata",
        },
      },
    };
    sortExpression = { "_id.label": 1 };
  } else if (type === "weekly") {
    groupExpression = {
      label: {
        $dateToString: {
          format: "Week %U",
          date: "$createdAt",
          timezone: "Asia/Kolkata",
        },
      },
    };
    sortExpression = { "_id.label": 1 };
  } else if (type === "yearly") {
    groupExpression = {
      label: { $dateToString: { format: "%Y", date: "$createdAt" } },
    };
    sortExpression = { "_id.label": 1 };
  } else {
    groupExpression = {
      monthNum: { $month: "$createdAt" },
      label: { $dateToString: { format: "%b", date: "$createdAt" } },
    };
    sortExpression = { "_id.monthNum": 1 };
  }

  const salesChart = await Order.aggregate([
    { $match: filters },
    {
      $project: {
        createdAt: 1,
        subtotal: { $ifNull: ["$subtotal", 0] },
        deliveryCharge: { $ifNull: ["$deliveryCharge", 0] },
        couponDiscount: { $ifNull: ["$coupon.discountAmount", 0] },

        offerDiscountInOrder: {
          $reduce: {
            input: { $ifNull: ["$items", []] },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$$this.itemStatus", "CANCELLED"] },
                        { $ifNull: ["$$this.appliedOffer", false] },
                        {
                          $gt: [
                            {
                              $ifNull: [
                                "$$this.appliedOffer.discountAmount",
                                0,
                              ],
                            },
                            0,
                          ],
                        },
                      ],
                    },
                    {
                      $multiply: [
                        "$$this.appliedOffer.discountAmount",
                        { $ifNull: ["$$this.quantity", 1] },
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },

        totalRefundedAmountInOrder: {
          $reduce: {
            input: { $ifNull: ["$items", []] },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $cond: [
                    {
                      $in: [
                        "$$this.itemStatus",
                        ["CANCELLED", "RETURN_COMPLETED"],
                      ],
                    },
                    { $ifNull: ["$$this.refundAmount", 0] },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        createdAt: 1,
        netSalesInOrder: {
          $max: [
            0,
            {
              $subtract: [
                { $add: ["$subtotal", "$deliveryCharge"] },
                {
                  $add: [
                    "$couponDiscount",
                    "$offerDiscountInOrder",
                    "$totalRefundedAmountInOrder",
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: groupExpression,
        sales: { $sum: "$netSalesInOrder" },
      },
    },
    { $sort: sortExpression },
    {
      $project: {
        _id: 0,
        label: "$_id.label",
        sales: { $round: ["$sales", 2] },
      },
    },
  ]);

  if (type === "monthly") {
    const monthNames = [
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
    const salesMap = Object.fromEntries(monthNames.map((m) => [m, 0]));
    salesChart.forEach((item) => {
      if (item.label) salesMap[item.label] = item.sales;
    });
    return monthNames.map((month) => ({
      label: month,
      sales: salesMap[month],
    }));
  }

  if (type === "daily" || type === "today") {
    const hours = Array.from(
      { length: 24 },
      (_, i) => `${String(i).padStart(2, "0")}:00`,
    );
    const salesMap = Object.fromEntries(hours.map((h) => [h, 0]));
    salesChart.forEach((item) => {
      if (item.label) salesMap[item.label] = item.sales;
    });
    return hours.map((hour) => ({ label: hour, sales: salesMap[hour] }));
  }

  if (type === "weekly") {
    if (salesChart.length === 0) {
      const currentWeekNum = Math.ceil(new Date().getDate() / 7);
      return [
        { label: `Week ${String(currentWeekNum).padStart(2, "0")}`, sales: 0 },
      ];
    }
    return salesChart;
  }

  return salesChart;
};
