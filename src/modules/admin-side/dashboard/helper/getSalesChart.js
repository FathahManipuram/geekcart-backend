import { Order } from "../../../user-side/order/models/order.model.js";
import { SUCCESSFUL_ITEM_STATUSES } from "../../sales-report/constants/sales.constants.js";
import { buildDateFilter } from "../../sales-report/helper/buildDateFilter.helper.js";


export const getSalesChart = async (type = "monthly") => {
  const filters = {
    paymentStatus: { $in: ["PAID", "PARTIALLY_REFUNDED", "FULLY_REFUNDED"] },
  };

  // 1. Inject appropriate date filtering scopes
  Object.assign(filters, buildDateFilter({ type }));

  // 2. Define dynamic grouping and sorting contexts
  let groupExpression = {};
  let sortExpression = {};

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
      label: { $dateToString: { format: "W%U", date: "$createdAt" } },
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
      // 3. Project safe arrays and clean item-level reductions
      $project: {
        createdAt: 1,
        // Only apply coupon discount if the order actually contains successful item elements
        couponDiscount: {
          $cond: [
            {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: { $ifNull: ["$items", []] },
                      as: "item",
                      cond: {
                        $in: ["$$item.itemStatus", SUCCESSFUL_ITEM_STATUSES],
                      },
                    },
                  },
                },
                0,
              ],
            },
            { $ifNull: ["$coupon.discountAmount", 0] },
            0,
          ],
        },

        grossSalesInOrder: {
          $reduce: {
            input: { $ifNull: ["$items", []] },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $cond: [
                    { $in: ["$$this.itemStatus", SUCCESSFUL_ITEM_STATUSES] },
                    {
                      $multiply: [
                        { $ifNull: ["$$this.salePrice", "$$this.price"] },
                        "$$this.quantity",
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },

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
                        {
                          $in: ["$$this.itemStatus", SUCCESSFUL_ITEM_STATUSES],
                        },
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
                    // FIX: Multiply offer discount by quantity
                    {
                      $multiply: [
                        "$$this.appliedOffer.discountAmount",
                        "$$this.quantity",
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },

        refundedInOrder: {
          $reduce: {
            input: { $ifNull: ["$items", []] },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $cond: [
                    { $eq: ["$$this.itemStatus", "RETURN_COMPLETED"] },
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
      // 4. Compute realistic Net Sales per order (Ensuring it never drops below 0)
      $project: {
        createdAt: 1,
        netSalesInOrder: {
          $max: [
            0,
            {
              $subtract: [
                "$grossSalesInOrder",
                {
                  $add: [
                    "$couponDiscount",
                    "$offerDiscountInOrder",
                    "$refundedInOrder",
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
      // 5. Output clean semantic property names
      $project: {
        _id: 0,
        label: "$_id.label",
        sales: { $round: ["$sales", 2] },
      },
    },
  ]);

  // 6. Complete zero-fill layouts for all filter timelines
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
    // Generate full 24-hour cycle map [00:00 to 23:00]
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

  return salesChart;
};
