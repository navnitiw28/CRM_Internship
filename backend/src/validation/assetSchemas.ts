import Joi from "joi";

export const assetCreateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  type: Joi.string().required(),
  serialNumber: Joi.string().required(),
  notes: Joi.string().optional(),
});

export const assetAssignSchema = Joi.object({
  assignedTo: Joi.string().required(),
  assignedBy: Joi.string().required(),
});
