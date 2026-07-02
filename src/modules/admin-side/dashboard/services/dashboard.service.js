import { User } from "../../../user-side/user-profile/models/user.model.js";
import { Category } from "../../category-management/models/category.model.js";
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js";
import { getSalesChart } from "../helper/getSalesChart.js";
import { getDataSample } from "../helper/getSample.js";
import { getTopProduct } from "../helper/topProduct.js";
import { getTopSubcategories } from "../helper/topSubcategories.js";


export const getDashboardService = async ({ type = "monthly" } = {}) => {

  const [
    totalUsers,
    activeUsers,
    totalCategories,
    totalSubcategories,
    subcategoryBreakdown,
    userGrowthData,
    salesChart,
    topProducts,
    topSubcategories,
    sample,
  ] = await Promise.all([
    User.countDocuments({ isVerified: true, role: "user" }),
    User.countDocuments({ isVerified: true, isBlocked: false, role: "user" }),
    Category.countDocuments({ isDeleted: false }),
    Subcategory.countDocuments({ isDeleted: false }),

    Subcategory.aggregate([
      { $match: { isDeleted: false } },
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
          count: { $size: { $ifNull: ["$products1", []] } },
        },
      },
    ]),

    User.aggregate([
      { $match: { isVerified: true, role: "user" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          users: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),


    getSalesChart(type),
    getTopProduct(type),
    getTopSubcategories(type),
    getDataSample(),
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
  const currentYear = new Date().getFullYear();


  const formattedUserGrowth = userGrowthData.map((item) => {
    const monthName = months[item._id.month - 1];

    const label =
      item._id.year === currentYear
        ? monthName
        : `${monthName} ${String(item._id.year).slice(-2)}`;

    return {
      month: label,
      users: item.users,
    };
  });

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
      sample,
    },
  };
};
