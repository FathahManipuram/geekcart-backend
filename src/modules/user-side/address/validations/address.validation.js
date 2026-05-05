import Joi from "joi";
import { addressLabel, addressLine, city, country, fullName, phoneNumber, pincode, state } from "../../../../common/validation/address.base";


export const createAddressSchema= Joi.object({
  fullName: fullName.required(),
  phoneNumber: phoneNumber.required(),
  addressLine: addressLine.required(),
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
