import { CameraRole, CameraStatus } from "@prisma/client";
import Joi from "joi";

export const createCameraSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  streamUrl: Joi.string(),
  carId: Joi.string().allow(null),
  role: Joi.valid(...Object.values(CameraRole)).required(),
});

export const updateCameraSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  streamUrl: Joi.string(),
  carId: Joi.string().allow(null),
  status: Joi.valid(...Object.values(CameraStatus)),
  role: Joi.valid(...Object.values(CameraRole)),
});
