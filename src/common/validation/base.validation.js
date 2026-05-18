import Joi from "joi";


//email
export const email = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(100)


  //password
  export const password = Joi.string()
  .min(8)
  .max(16)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .pattern(/[@$!%*?&]/)


  //confirmPassword
  export const confirmPassword = (ref = "password") =>
  Joi.string().valid(Joi.ref(ref)).messages({ "any.only":"Password do not match"});

// Fullname
export const fullName = Joi.string()
  .min(3)
  .max(30)
  .trim()

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

  //Otp
  export const otp = Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .message({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must only contain numbers",
    });
  

  //category name
  export const categoryName= Joi.string()
    .trim()
    .min(2)
    .max(100)

  