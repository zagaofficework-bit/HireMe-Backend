const Joi = require('joi');

const createReportSchema = Joi.object({
  profileId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Profile ID is required',
  }),
  reason: Joi.string()
    .valid('fake_profile', 'spam', 'abusive_content', 'misleading_info', 'inappropriate_image', 'other')
    .required()
    .messages({
      'any.required': 'Reason is required',
      'any.only': 'Invalid reason. Choose from: fake_profile, spam, abusive_content, misleading_info, inappropriate_image, other',
    }),
  description: Joi.string().max(1000).optional().allow('', null),
});

const resolveReportSchema = Joi.object({
  status: Joi.string().valid('resolved', 'dismissed', 'reviewing').required(),
  adminNote: Joi.string().max(500).optional().allow('', null),
  adminAction: Joi.string()
    .valid('none', 'warned', 'suspended', 'banned', 'profile_hidden', 'dismissed')
    .optional(),
});

module.exports = { createReportSchema, resolveReportSchema };