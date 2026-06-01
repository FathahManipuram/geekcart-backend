import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { AppError } from "../../../../common/utils/AppError.js"
import { buildQuery } from "../../../../common/utils/buildQuery.js"
import { deleteImageFromCloudinary } from "../../../../common/utils/cloudinary.delete.js"
import { generateSlug } from "../../../../common/utils/slugify.js"
import { uploadImage } from "../../../../common/utils/uploadImage.js"
import { Category } from "../../category-management/models/category.model.js"
import { Product } from "../../product-management/models/product.model.js"
import { Subcategory } from "../models/subcategory.model.js"


//Create subcategory
export const createSubcategoryService= async(data, file)=>{
	const {name, category}= data
	if(!file){
		throw new AppError("Profile image is required", HTTP_STATUS.BAD_REQUEST)
	}

const imageUrl= await uploadImage(file, "subcategory")
	const normalizedName= name.trim()
	const slug= generateSlug(normalizedName)
	

const existingCategory= await Category.findOne({
	_id: category,
	isDeleted: false,
})

if(!existingCategory){
	throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND)
}

	const isExisting= await Subcategory.findOne({
		category,
		slug,
		isDeleted: false
	})

	if(isExisting){
		throw new AppError("Subcategory already exists", HTTP_STATUS.CONFLICT)
	}

	const subcategory= await Subcategory.create({
		name: normalizedName,
		slug,
		image: imageUrl.secure_url,
		category,
	})

await subcategory.populate(
	"category",
	"name"
);
	return {
		message: "Subcategory created successfully",
		data: subcategory,
	}


}

// fetch all subcategories
export const fetchSubcategoriesService= async(queryParams)=>{
const {
	page= 1,
	limit=5,
	search= "",
	status= "",
	category=""
}= queryParams

const filters={
	isDeleted: false,
}

if(status === "active"){
	filters.isActive=true
}

if(status==="inactive"){
	filters.isActive= false
}

if(category){
	filters.category= category
}

const {items, pagination}= await buildQuery({
	model: Subcategory,
	search,
	searchField:["name"],
	page,
	limit,
	filters,
	populate:{
		path: "category",
		select: "name",
	},
	sort : {createdAt: -1}
})

const activeSubcategories= await Subcategory.countDocuments({
	isActive: true,
	isDeleted: false,
})
const totalCategories = await Category.countDocuments({
	isActive: true,
	isDeleted: false
})

const subcategoriesWithCounts= await Promise.all(items.map(async(subcategory)=>{
	const productCount= await Product.countDocuments({
		subcategory: subcategory._id,
		isDeleted: false,
	})
	return {
		...subcategory.toObject?.() || subcategory,
		productCount,
	}
}))

return {
	message: "Subcategories fetched successfully",
	data: {
		// subcategories: items,
		subcategories: subcategoriesWithCounts,
		pagination,
		activeSubcategories,
		totalCategories,
	}
}
}

//Update subcategory
export const updateSubcategoryService= async(subcategoryId, data, file)=>{
	const {name, category, isActive}= data

	const subcategory = await Subcategory.findOne({_id: subcategoryId});
console.log("subcategory: ", subcategory)
  if (!subcategory || subcategory.isDeleted) {
    throw new AppError("Subcategory not found", HTTP_STATUS.NOT_FOUND);
  }

  if(category && category !== String(subcategory.category)){
	const isExistCategory = await Category.findOne({
    _id: category,
    isDeleted: false,
  });

  if (!isExistCategory) {
    throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
  }
subcategory.category= category

  }

  if(name && name.trim() !== subcategory.name){
	const normalizedName = name.trim();
  const slug = generateSlug(normalizedName);

  const duplicate= await Subcategory.findOne({
	_id: {
		$ne: subcategoryId,
	},
	category: category || subcategory.category,
	slug,
	isDeleted: false,
  })

  if(duplicate){
	throw new AppError("Subcategory already exists in this category", HTTP_STATUS.CONFLICT)
  }

  subcategory.name= normalizedName
  subcategory.slug= slug
  }

	if(typeof isActive=== "boolean"){
		subcategory.isActive= isActive;
	}


	if(file){
		if(subcategory.image){
			await deleteImageFromCloudinary(subcategory.image)
		}
		const imageUrl= await uploadImage(file, "subcategory")
		subcategory.image= imageUrl.secure_url
	}
	await subcategory.save()
	await subcategory.populate(
		"category",
		"name"
	)

return {
	message: "Subcategory updated successfully",
	data: subcategory
}
}

//Soft delete subcategory
export const deleteSubcategoryService= async(subcategoryId)=>{
	const subcategory= await Subcategory.findById(subcategoryId)

	if(!subcategory || subcategory.isDeleted){
		throw new AppError("Subcategory not fount", HTTP_STATUS.NOT_FOUND)
	}

	if(subcategory.image){
		await deleteImageFromCloudinary(subcategory.image)
	}
	subcategory.isDeleted= true
	await subcategory.save()
return{
	message: "Subcategory deleted successfully",
}
}
