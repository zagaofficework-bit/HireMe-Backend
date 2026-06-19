const Joi = require('joi');

const banUserSchema = Joi.object({
  banReason: Joi.string().min(10).max(500).required()
});

const suspendUserSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required()
});

const featureProfileSchema = Joi.object({
  isFeatured: Joi.boolean().required()
});

const verifyUserSchema = Joi.object({
  isVerified: Joi.boolean().required()
});

const adminNoteSchema = Joi.object({
  note: Joi.string().min(2).max(1000).required()
});

module.exports = {
  banUserSchema,
  suspendUserSchema,
  featureProfileSchema,
  verifyUserSchema,
  adminNoteSchema,
};