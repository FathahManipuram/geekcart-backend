import { User } from "../../../user-side/user-profile/models/user.model.js";
import { Category } from "../../category-management/models/category.model.js";
import { Subcategory } from "../../subcategory-management/models/subcategory.model.js";

export const getDashboardService = async()=>{
	  const [totalUsers, activeUsers, totalCategories, totalSubcategories] =
      await Promise.all([
        User.countDocuments({
          isVerified: true,
		  role: "user",
        }),

        User.countDocuments({
          isVerified: true,
          isBlocked: false,
		  role: "user"
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
					$size: "$products1"
				}
			}
		}
	  ])

	  
	  const userGrowth = await User.aggregate([
		{
			$match: {
				isVerified: true,
				role: "user",
			}
		},

		{
			$group: {
				_id: {
					year: {$year: "$createdAt"},
					month: {$month: "$createdAt"}
				},

				users: {
					$sum: 1,
				}
			},
		},

		{
			$sort:{
				"_id.year": 1,
				"_id.month": 1
			}
		}


	  ])

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
	const formattedUserGrowth= userGrowth.map((item)=>({
		month: months[item._id.month - 1],
		users: item.users,
	  }))

	  console.log(userGrowth)
	  console.log(formattedUserGrowth)

  return {
    message: "Dashboard fetched successfully",
    data: {
		userDetails:{
        totalUsers,
      activeUsers,
      totalCategories,
      totalSubcategories,
		},
      
	  subcategoryBreakdown,
	  userGrowth: formattedUserGrowth
    },
  };
}