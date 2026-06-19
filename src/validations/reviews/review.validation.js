const Joi = require('joi');

const createReviewSchema = Joi.object({
  profileId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Profile ID is required',
  }),
  rating: Joi.number().min(1).max(5).required().messages({
    'any.required': 'Rating is required',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
  }),
  comment: Joi.string().max(1000).optional().allow('', null),
});

const updateReviewSchema = Joi.object({
  rating:  Joi.number().min(1).max(5).optional(),
  comment: Joi.string().max(1000).optional().allow('', null),
});

module.exports = { createReviewSchema, updateReviewSchema };