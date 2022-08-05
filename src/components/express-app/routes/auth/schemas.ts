import { UserRole } from "@prisma/client";
import Joi from "joi";

export const RegisterSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.valid(...Object.values(UserRole)).required(),
});

export const LoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.valid(...Object.values(UserRole)).required(),
  carID: Joi.string().optional(),
});
