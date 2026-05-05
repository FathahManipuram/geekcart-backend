import Joi from "joi";


//email
export const email = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(100)
  .required();

  //password
  export const password = Joi.string()
  .min(8)
  .max(16)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .pattern(/[@$!%*?&]/)
  .required();

  //confirmPassword
  export const confirmPassword = (ref = "password") =>
  Joi.string().valid(Joi.ref(ref)).required().messages({ "any.only":"Password do not match"});

// Fullname
export const fullName = Joi.string()
  .min(3)
  .max(30)
  .trim()
  .required();

  //Phone number
  export const phoneNumber = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .allow(null, "");

  // gender
  export const gender = Joi.string()
  .valid("male", "female")
  .allow(null, "");

  //Date of birth
  export const dateOfBirth = Joi.date()
  .max("now")
  .allow(null, "");