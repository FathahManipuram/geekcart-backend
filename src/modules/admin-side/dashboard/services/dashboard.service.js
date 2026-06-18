import { Order } from "../../../user-side/order/models/order.model.js";
import { User } from "../../../user-side/user-profile/models/user.model.js";
import { Category } from "../../category-management/models/category.model.js";
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js";
import { getSalesChart } from "../helper/salesChart.js";
import { getTopProduct } from "../helper/topProduct.js";
import { getTopSubcategories } from "../helper/topSubcategories.js";
import ExcelJS from "exceljs";


export const getDashboardService = async () => {
  const [totalUsers, activeUsers, totalCategories, totalSubcategories] =
    await Promise.all([
      User.countDocuments({
        isVerified: true,
        role: "user",
      }),

      User.countDocuments({
        isVerified: true,
        isBlocked: false,
        role: "user",
      }),

      Category.countDocuments({
        isDeleted: false,
      }),

      Subcategory.countDocuments({
        isDeleted: false,
      }),
    ]);

  const subcategoryBreakdown = await Subcategory.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "subcategory",
        as: "products1",
      },
    },
    {
      $project: {
        name: 1,
        count: {
          $size: "$products1",
        },
      },
    },
  ]);

  const userGrowth = await User.aggregate([
    {
      $match: {
        isVerified: true,
        role: "user",
      },
    },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },

        users: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const months = [
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
  const formattedUserGrowth = userGrowth.map((item) => ({
    month: months[item._id.month - 1],
    users: item.users,
  }));

  const salesChart = await getSalesChart();
  const topProducts = await getTopProduct();
  const topSubcategories = await getTopSubcategories();

  return {
    message: "Dashboard fetched successfully",
    data: {
      userDetails: {
        totalUsers,
        activeUsers,
        totalCategories,
        totalSubcategories,
      },

      subcategoryBreakdown,
      userGrowth: formattedUserGrowth,
      salesChart,
      topProducts,
      topSubcategories,
    },
  };
};


export const exportSalesReportExcelService = async ({
  reportType,
  startDate,
  endDate,
}) => {
  const query = {
    orderStatus: "DELIVERED",
  };

  const now = new Date();

  if (reportType === "daily") {
    query.createdAt = {
      $gte: new Date(now.setHours(0, 0, 0, 0)),
    };
  }

  if (reportType === "weekly") {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    query.createdAt = {
      $gte: lastWeek,
    };
  }

  if (reportType === "yearly") {
    query.createdAt = {
      $gte: new Date(now.getFullYear(), 0, 1),
    };
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    {
      header: "Order Number",
      key: "orderNumber",
      width: 25,
    },
    {
      header: "Date",
      key: "date",
      width: 18,
    },
    {
      header: "Customer",
      key: "customer",
      width: 25,
    },
    {
      header: "Sales Amount",
      key: "amount",
      width: 15,
    },
    {
      header: "Offer Discount",
      key: "discount",
      width: 15,
    },
    {
      header: "Coupon Discount",
      key: "couponDiscount",
      width: 18,
    },
    {
      header: "Final Amount",
      key: "finalAmount",
      width: 15,
    },
    {
      header: "Payment Method",
      key: "paymentMethod",
      width: 18,
    },
  ];

  let totalSales = 0;
  let totalDiscount = 0;
  let totalCouponDiscount = 0;

  orders.forEach((order) => {
    const couponDiscount = order?.coupon?.discountAmount || 0;

    worksheet.addRow({
      orderNumber: order.orderNumber,

      date: new Date(order.createdAt).toLocaleDateString(),

      customer: order.shippingAddress?.fullName,

      amount: order.subtotal,

      discount: order.discount || 0,

      couponDiscount,

      finalAmount: order.totalAmount,

      paymentMethod: order.paymentMethod,
    });

    totalSales += order.totalAmount;
    totalDiscount += order.discount || 0;
    totalCouponDiscount += couponDiscount;
  });

  worksheet.addRow([]);

  worksheet.addRow({
    orderNumber: "SUMMARY",
    amount: totalSales,
    discount: totalDiscount,
    couponDiscount: totalCouponDiscount,
  });

  worksheet.getRow(1).font = {
    bold: true,
  };

  const summaryRow = worksheet.lastRow;

  summaryRow.font = {
    bold: true,
  };

  return {
    workbook,
    fileName: `sales-report-${Date.now()}.xlsx`,
  };
};