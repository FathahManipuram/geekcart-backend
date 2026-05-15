import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { AppError } from "../../../../common/utils/AppError.js"
import { buildQuery } from "../../../../common/utils/buildQuery.js"
import { generateSlug } from "../../../../common/utils/slugify.js"
import { Category } from "../models/category.model.js"

//fatch categories
export const fetchCategoriesService= async({
	page = 1,
	limit = 5,
	search = "",
	status = "",
})=>{
	const filters = {
    isDeleted: false,
  };

	if(status === "active"){
		filters.isActive= true
	}

	if(status === "inactive"){
		filters.isActive= false
	}

	const result= await buildQuery({
		model: Category,
		search,
		searchFields:["name"],
		limit,
		sort: {createdAt: -1},
		filters,
	})

	return {
		message: "Categories fetched successfully",
		data: {
			categories: result.items,
			pagination: result.pagination,
		}
	}
}


//Create categries
export const createCategoryService= async(data)=>{
	const {name}= data

	const normalizedName= name.trim()
	const slug= generateSlug(normalizedName)
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
	slug,
  })

  return {
	message: "Category created successfully",
	data: category,
  }
}

//Update categories
export const updateCategoryService = async (categoryId, data)=>{
	const {name, isActive} =data;

	const category= await Category.findById(categoryId)

	if(!category){
		throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND)
	}

	if(name && name.trim() !== category.name){
		const normalizedName= name.trim()
		const slug= generateSlug(normalizedName)

		const existingCategory= await Category.findOne({
			_id: {$ne: categoryId},
			$or:[
				{
					name: {
						$regex: `^${normalizedName}$`,
						$options: "i",
					},
				},
				{slug},
			]
		})
		if(existingCategory){
			throw new AppError("Category already exists", HTTP_STATUS.CONFLICT)
		}

		category.name= normalizedName
		category.slug= slug
	}	
	if(typeof isActive === "boolean"){
		category.isActive=isActive;
	}
	await category.save()

return {
	message: "Category updated successfully",
	data: category
}
}