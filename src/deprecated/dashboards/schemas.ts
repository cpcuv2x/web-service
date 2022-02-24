import Joi from "joi";

export const createDashboardSchema = Joi.object({
  name: Joi.string().required(),
  default: Joi.boolean().strict().required(),
});

export const updateDashboardSchema = Joi.object({
  name: Joi.string().optional(),
  default: Joi.boolean().strict().optional(),
});

const updateDashboardComponentsCreateSchema = Joi.object({
  dashboardComponentId: Joi.string().required(),
  x: Joi.number().strict().required(),
  y: Joi.number().strict().required(),
  w: Joi.number().strict().required(),
  h: Joi.number().strict().required(),
  configuration: Joi.string().required(),
});

const updateDashboardComponentsUpdateSchema = Joi.object({
  dashboardComponentAssociationId: Joi.string().required(),
  x: Joi.number().strict(),
  y: Joi.number().strict(),
  w: Joi.number().strict(),
  h: Joi.number().strict(),
  configuration: Joi.string(),
});

export const updateDashboardComponentsSchema = Joi.object({
  create: Joi.array().items(updateDashboardComponentsCreateSchema),
  update: Joi.array().items(updateDashboardComponentsUpdateSchema),
  delete: Joi.array().items(Joi.string()),
});
