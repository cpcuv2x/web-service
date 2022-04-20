import Joi from "joi";

export const createCarSchema = Joi.object({
  licensePlate: Joi.string().required(),
  model: Joi.string().required(),
  cameras: Joi.array().items({
    id: Joi.string().required(),
  }),
});

export const updateCarSchema = Joi.object({
  licensePlate: Joi.string(),
  model: Joi.string(),
  cameras: {
    connect: Joi.array().items({
      id: Joi.string().required(),
    }),
    disconnect: Joi.array().items({
      id: Joi.string().required(),
    }),
  },
});
