import { DriverStatus } from "@prisma/client";
import Joi from "joi";

export const createDriverSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  birthDate: Joi.date(),
  nationalId: Joi.string(),
  carDrivingLicenseId: Joi.string(),
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const updateDriverSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  birthDate: Joi.date(),
  nationalId: Joi.string(),
  carDrivingLicenseId: Joi.string(),
  status: Joi.valid(...Object.values(DriverStatus)),
});
