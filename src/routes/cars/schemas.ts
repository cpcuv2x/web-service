import Joi from "joi";

export const createCarSchema = Joi.object({
  licensePlate: Joi.string().required(),
  model: Joi.string().required(),
});
export const updateCarSchema = Joi.object({});
