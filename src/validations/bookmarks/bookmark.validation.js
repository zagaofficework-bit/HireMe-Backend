const Joi = require('joi');

const addBookmarkSchema = Joi.object({
  profileId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Profile ID is required',
  }),
  tag:  Joi.string().max(50).optional().allow('', null),
  note: Joi.string().max(500).optional().allow('', null),
});

const updateBookmarkSchema = Joi.object({
  tag:  Joi.string().max(50).optional().allow('', null),
  note: Joi.string().max(500).optional().allow('', null),
});

module.exports = { addBookmarkSchema, updateBookmarkSchema };