const Joi = require('joi');

/**
 * Validation Schemas
 * 
 * Joi is a data validation library.
 * These schemas define exactly what shape the request body must be.
 * Used with the validate middleware in routes.
 */

// When a new user registers after Firebase signup
const registerUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),
});

// Client-specific registration (same as user but role will be set to 'client')
const registerClientSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required for client registration',
  }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .optional()
    .allow('', null),
  companyName: Joi.string().min(2).max(200).optional().allow('', null),
});

module.exports = { registerUserSchema, registerClientSchema };