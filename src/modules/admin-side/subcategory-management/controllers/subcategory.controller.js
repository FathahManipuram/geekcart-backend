import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  createSubcategoryService,
  deleteSubcategoryService,
  fetchSubcategoriesService,
  updateSubcategoryService,
} from "../services/subcategory.service.js";

//Create subcategory
export const createSubcategoryController = async (req, res, next) => {
  try {
    const result = await createSubcategoryService(req.body, req.file);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Get subcategory
export const fetchSubcategoriesController = async (req, res, next) => {
  try {
    const result = await fetchSubcategoriesService(req.query);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Update Subcategory
export const updateSubcategoryController = async (req, res, next) => {
  try {
    const { subcategoryId } = req.params;

    const result = await updateSubcategoryService(
      subcategoryId,
      req.body,
      req.file,
    );
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Soft delete
export const deleteSubcategoryController = async (req, res, next) => {
  try {
    const { subcategoryId } = req.params;
    const result = await deleteSubcategoryService(subcategoryId);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};
