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
    paymentStatus: "PAID",
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
        $group: {
          _id: null,

          overallSalesCount: { $sum: 1 },
          grossSales: { $sum: "$subtotal" },
          offerDiscount: { $sum: "$discount" },
          couponDiscount: { $sum: "$coupon.discountAmount" },
          netSales: { $sum: "$totalAmount" },
          totalOderedItems: {
            $sum: {
              $size: "$items",
            },
          },
          itemsSold: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $cond: [
                        {
                          $in: ["$$this.itemStatus", SUCCESSFUL_ITEM_STATUSES],
                        },
                        "$$this.quantity",
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },

          cancelledItems: {
            $sum: {
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
          },

          returnedItems: {
            $sum: {
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
          },

          refundedAmount: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: {
                  $add: ["$$value", { $ifNull: ["$$this.refundAmount", 0] }],
                },
              },
            },
          },
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
        totalPages: Math.ceil(totalOrders / limit),
        totalItems: totalOrders,
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