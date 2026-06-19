const ApiError = require('../utils/ApiError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,    // collect ALL errors, not just the first one
      stripUnknown: true,   // remove fields not in schema (security: ignore extra fields)
    });

    if (error) {
      // Map Joi errors into a clean array: [{ field: 'email', message: 'is required' }]
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''), // remove Joi's quote characters
      }));

      return next(new ApiError(400, 'Validation failed', errors));
    }

    next();
  };
};

module.exports = validate;