const Joi = require('joi');

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Verification token is required',
  }),
});

const verifyPhoneSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .required()
    .messages({
      'any.required': 'Phone number is required',
      'string.pattern.base': 'Invalid phone number format',
    }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'any.required': 'OTP is required',
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
});

module.exports = { verifyEmailSchema, verifyPhoneSchema };