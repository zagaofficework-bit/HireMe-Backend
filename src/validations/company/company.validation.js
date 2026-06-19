const Joi = require('joi');

const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).optional().allow('', null),
  industry: Joi.string().optional().allow('', null),
  size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+').optional(),
  foundedYear: Joi.number().min(1800).max(new Date().getFullYear()).optional(),
  website: Joi.string().uri().optional().allow('', null),
  location: Joi.object({
    country: Joi.string().optional(),
    state:   Joi.string().optional(),
    city:    Joi.string().optional(),
    address: Joi.string().optional().allow('', null),
  }).optional(),
  contact: Joi.object({
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).optional().allow('', null),
  }).optional(),
  social: Joi.object({
    linkedin: Joi.string().uri().optional().allow('', null),
    twitter:  Joi.string().uri().optional().allow('', null),
  }).optional(),
});

const updateCompanySchema = Joi.object({
  name:        Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  industry:    Joi.string().optional().allow('', null),
  size:        Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+').optional(),
  foundedYear: Joi.number().min(1800).max(new Date().getFullYear()).optional(),
  website:     Joi.string().uri().optional().allow('', null),
  location: Joi.object({
    country: Joi.string().optional(),
    state:   Joi.string().optional(),
    city:    Joi.string().optional(),
    address: Joi.string().optional().allow('', null),
  }).optional(),
  contact: Joi.object({
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).optional().allow('', null),
  }).optional(),
  social: Joi.object({
    linkedin: Joi.string().uri().optional().allow('', null),
    twitter:  Joi.string().uri().optional().allow('', null),
  }).optional(),
});

// Admin rejecting a company verification
const rejectCompanySchema = Joi.object({
  rejectionReason: Joi.string().min(10).max(500).required(),
});

module.exports = { createCompanySchema, updateCompanySchema, rejectCompanySchema };