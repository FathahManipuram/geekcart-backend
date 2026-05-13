import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { Category } from "../models/category.model.js"

export const createCategoryService= async(data)=>{
	const {name}= data

	const normalizedName= name.trim()
	const existingCategory= await Category.findOne({
		name: {
			$regex: `^${normalizedName}`,
			$options:"i",
		}
	})

	if (existingCategory) {
    throw new AppError("Category already exists", HTTP_STATUS.CONFLICT);
  }

  const category= await Category.create({
	name: normalizedName,
  })

  return {
	message: "Category created successfully",
	data: category,
  }
}