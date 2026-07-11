import Joi from "joi";
import { RETURN_REQUEST_STATUSES } from "../../../../common/constants/adminReturn/returnStatusList";

export const updateReturnStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RETURN_REQUEST_STATUSES))
    .required(),
});
