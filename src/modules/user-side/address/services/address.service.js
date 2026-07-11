import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { AppError } from "../../../../common/utils/AppError.js";
import { Address } from "../models/address.model.js";

//Get Address
export const getAddressesService = async (userId) => {
  const addresses = await Address.find({ userId }).sort({ createdAt: -1 });
  return {
    message: "Addresses fetched",
    data: addresses,
  };
};

//Get addressById
export const getAddressByIdService = async (addressId) => {
  if (!addressId) {
    throw new AppError("Address id is not defined", HTTP_STATUS.BAD_REQUEST);
  }

  const address = await Address.findById(addressId);

  if (!address) {
    throw new AppError("Address not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    message: "Address fetched successfully",
    data: address,
  };
};

//Create address
export const createAddressService = async (userId, data) => {
  if (data.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    ...data,
    userId,
  });

  return {
    message: "Address added successfully",
    data: address,
  };
};

//Update Address
export const updateAddressService = async (userId, addressId, data) => {
  if (data.isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }
  const address = await Address.findOneAndUpdate(
    {
      _id: addressId,
      userId,
    },
    data,
    { new: true },
  );

  if (!address) {
    throw new AppError("Address not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    message: "Address updated succcessfully",
    data: address,
  };
};

export const removeAddressService = async (userId, addressId) => {
  const address = await Address.findOneAndDelete({
    _id: addressId,
    userId,
  });

  if (!address) {
    throw new AppError("Address not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    message: "Address removed successfully",
  };
};
