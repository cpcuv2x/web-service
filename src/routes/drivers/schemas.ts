import Joi from "joi";

export const createDriverSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  birthDate: Joi.date(),
  nationalId: Joi.string(),
  carDrivingLicenseId: Joi.string(),
});

export const updateDriverSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  birthDate: Joi.date(),
  nationalId: Joi.string(),
  carDrivingLicenseId: Joi.string(),
});
