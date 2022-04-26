import { Gender } from "@prisma/client";
import Joi from "joi";

export const createDriverSchema = Joi.object({
  firstNameTH: Joi.string().required(),
  lastNameTH: Joi.string().required(),
  firstNameEN: Joi.string().required(),
  lastNameEN: Joi.string().required(),
  gender: Joi.valid(...Object.values(Gender)).required(),
  birthDate: Joi.date().required(),
  nationalId: Joi.string().required(),
  carDrivingLicenseId: Joi.string().required(),
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
