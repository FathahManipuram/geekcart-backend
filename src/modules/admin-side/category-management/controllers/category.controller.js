import { HTTP_STATUS } from "../../../../common/constants/statusCode.js"
import { successResponse } from "../../../../common/helpers/response.js"
import * as categoryService from "../services/category.service.js"

//fetch categories
export const fetchCategoriesController= async(req, res, next)=>{
	try{
		const result= await categoryService.fetchCategoriesService(req.query)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data
		)
	}catch(err){
		next(err)
	}
}

// Create categories
export const createCategoryController= async(req, res, next)=>{
	try{
		const result= await categoryService.createCategoryService(req.body)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data
		)
	}catch (err){
		next(err)
	}
}


//Update categories
export const updateCategoriesController= async(req, res, next)=>{
	try{
		const categoryId= req.params.categoryId
		console.log(categoryId, req.body)
		const result= await categoryService.updateCategoryService(categoryId, req.body)

		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message,
			result.data
		)
	}catch(err){
		next(err)
	}
}

// Soft delete
export const deleteCategoryController= async(req, res, next)=>{
	try{
		const categoryId= req.params.categoryId
		const result= await categoryService.deleteCategoryService(categoryId)
		return successResponse(
			res,
			HTTP_STATUS.OK,
			result.message
		)
	}catch(err){
		next(err)
	}
}
