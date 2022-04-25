import { Gender } from "@prisma/client";
import Joi from "joi";

export const createDriverSchema = Joi.object({
  firstNameTH: Joi.string(),
  lastNameTH: Joi.string(),
  firstNameEN: Joi.string(),
  lastNameEN: Joi.string(),
  gender: Joi.valid(...Object.values(Gender)),
  birthDate: Joi.date(),
  nationalId: Joi.string(),
  carDrivingLicenseId: Joi.string(),
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const updateDriverSchema = Joi.object({
  firstNameTH: Joi.string(),
  lastNameTH: Joi.string(),
  firstNameEN: Joi.string(),
  lastNameEN: Joi.string(),
  gender: Joi.valid(...Object.values(Gender)),
  birthDate: Joi.date(),
  nationalId: Joi.string(),
  carDrivingLicenseId: Joi.string(),
});
