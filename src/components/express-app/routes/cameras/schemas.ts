import Joi from "joi";

export const createCameraSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  streamUrl: Joi.string(),
});

export const updateCameraSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  streamUrl: Joi.string(),
});