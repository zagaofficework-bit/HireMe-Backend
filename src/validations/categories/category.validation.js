const Joi = require('joi');

const skillsField = Joi.array().items(Joi.string().trim().min(1).max(100)).optional();

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(100).lowercase().optional(),
  description: Joi.string().max(500).optional().allow('', null),
  icon: Joi.string().optional().allow('', null),
  skills: skillsField,
  isFeatured: Joi.boolean().optional(),
  order: Joi.number().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow('', null),
  icon: Joi.string().optional().allow('', null),
  skills: skillsField,
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  order: Joi.number().optional(),
});

module.exports = { createCategorySchema, updateCategorySchema };