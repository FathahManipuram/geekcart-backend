import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  createAddressService,
  getAddressByIdService,
  getAddressesService,
  removeAddressService,
  updateAddressService,
} from "../services/address.service.js";

export const getAddressesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await getAddressesService(userId);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

// Get Address by Id
export const getAddressByIdController = async (req, res, next) => {
  try {
    const addressId = req.params.addressId;
    const result = await getAddressByIdService(addressId);

    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Create Address
export const craeteAddressController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await createAddressService(userId, req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Update address
export const updateAddressController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;
    const result = await updateAddressService(userId, addressId, req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

//Remove

export const removeAddressController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.addressId;
    const result = await removeAddressService(userId, addressId);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (err) {
    next(err);
  }
};
