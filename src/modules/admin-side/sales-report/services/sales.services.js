import { Order } from "../../../user-side/order/models/order.model.js";
import { SUCCESSFUL_ITEM_STATUSES } from "../constants/sales.constants.js";
import { buildDateFilter } from "../helper/buildDateFilter.helper.js";
import { exportSalesExcel } from "../helper/exportSalesExcel.helper.js";
import { exportSalesPdf } from "../helper/exportSalesPdf.helper.js";

export const getSalesReportService = async ({
  page = 1,
  limit = 10,
  type,
  startDate,
  endDate,
  search = "",
}) => {
  page = Number(page);
  limit = Number(limit);

  const filters = {
    paymentStatus: { $in: ["PAID", "PARTIALLY_REFUNDED", "FULLY_REFUNDED"] },
  };

  Object.assign(
    filters,
    buildDateFilter({
      type,
      startDate,
      endDate,
    }),
  );

  if (search.trim()) {
    filters.orderNumber = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  const skip = (page - 1) * limit;

  const [orders, summaryResult, totalOrders] = await Promise.all([
    Order.find(filters)
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Order.aggregate([
      {
        $match: filters,
      },
      {
        $project: {
          subtotal: { $ifNull: ["$subtotal", 0] },
          totalAmount: { $ifNull: ["$totalAmount", 0] },
          deliveryCharge: { $ifNull: ["$deliveryCharge", 0] },
          couponDiscount: { $ifNull: ["$coupon.discountAmount", 0] },
          itemsCount: { $size: { $ifNull: ["$items", []] } },

          itemsSoldInOrder: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $in: ["$$this.itemStatus", SUCCESSFUL_ITEM_STATUSES] },
                      "$$this.quantity",
                      0,
                    ],
                  },
                ],
              },
            },
          },

          offerDiscountInOrder: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      {
                        $and: [
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

          cancelledInOrder: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $eq: ["$$this.itemStatus", "CANCELLED"] },
                      "$$this.quantity",
                      0,
                    ],
                  },
                ],
              },
            },
          },

          returnedInOrder: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $eq: ["$$this.itemStatus", "RETURN_COMPLETED"] },
                      "$$this.quantity",
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

          returnedRefundAmountInOrder: {
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
        $project: {
          subtotal: 1,
          deliveryCharge: 1,
          couponDiscount: 1,
          itemsCount: 1,
          itemsSoldInOrder: 1,
          offerDiscountInOrder: 1,
          cancelledInOrder: 1,
          returnedInOrder: 1,
          totalRefundedAmountInOrder: 1,
          returnedRefundAmountInOrder: 1,

          grossSalesInOrder: {
            $max: [
              0,
              {
                $subtract: [
                  { $add: ["$subtotal", "$deliveryCharge"] },
                  "$totalRefundedAmountInOrder",
                ],
              },
            ],
          },

          orderNetCalculated: {
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
          _id: null,
          overallSalesCount: { $sum: 1 },
          grossItemSubtotal: { $sum: "$subtotal" },
          totalDeliveryCharges: { $sum: "$deliveryCharge" },

          grossSales: { $sum: "$grossSalesInOrder" },
          offerDiscount: { $sum: "$offerDiscountInOrder" },
          couponDiscount: { $sum: "$couponDiscount" },
          netSales: { $sum: "$orderNetCalculated" },
          totalOderedItems: { $sum: "$itemsCount" },
          itemsSold: { $sum: "$itemsSoldInOrder" },
          cancelledItems: { $sum: "$cancelledInOrder" },
          returnedItems: { $sum: "$returnedInOrder" },
          refundedAmount: { $sum: "$returnedRefundAmountInOrder" },
        },
      },
    ]),
    Order.countDocuments(filters),
  ]);

  const summary = summaryResult[0] || {
    overallSalesCount: 0,
    grossSales: 0,
    offerDiscount: 0,
    couponDiscount: 0,
    netSales: 0,
    totalOderedItems: 0,
    itemsSold: 0,
    cancelledItems: 0,
    returnedItems: 0,
    refundedAmount: 0,
  };

  return {
    message: "Sales report fetched successfully",
    data: {
      summary,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit) || 1,
        totalItems: totalOrders || 0,
        limit,
      },
    },
  };
};

export const exportSalesExcelService = async (filters) => {
  const report = await getSalesReportService({
    ...filters,
    page: 1,
    limit: 1000,
  });

  const buffer = await exportSalesExcel(report.data, filters);

  return {
    message: "Sales report exported successfully",
    data: {
      fileName: `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`,
      buffer,
    },
  };
};

export const exportSalesPdfService = async (filters) => {
  const report = await getSalesReportService({
    ...filters,
    page: 1,
    limit: 1000,
    //Number.MAX_SAFE_INTEGER,
  });

  const buffer = await exportSalesPdf(report.data, filters);

  return {
    message: "Sales report exported successfully",
    data: {
      fileName: `sales-report-${new Date().toISOString().split("T")[0]}.pdf`,
      buffer,
    },
  };
};
