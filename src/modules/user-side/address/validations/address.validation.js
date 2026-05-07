import Joi from "joi";
import { addressLabel, addressLine, city, country, fullName, landmark, phoneNumber, pincode, state } from "../../../../common/validation/address.base.js";


export const createAddressSchema= Joi.object({
  fullName: fullName.required(),
  phoneNumber: phoneNumber.required(),
  addressLine: addressLine.required(),
  landmark: landmark.required(),
  city: city.required(),
  state: state.required(),
  country: country.required(),
  pincode: pincode.required(),
  addressLabel,
  isDefault: Joi.boolean(),
})

export const updateAddressSchema = Joi.object({
  fullName,
  phoneNumber,
  addressLine,
  landmark,
  city,
  state,
  country,
  pincode,
  addressLabel,
  isDefault: Joi.boolean(),
});


export const addressIdParamSchema = Joi.object({
  id: Joi.string().required(),
});
