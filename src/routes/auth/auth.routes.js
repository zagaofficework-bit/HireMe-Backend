const router = require('express').Router();
const { protect, verifyFirebaseToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const { registerUserSchema, registerClientSchema } = require('../../validations/auth/auth.validation');
const {
  registerUserController,
  registerClientController,
  getMe,
} = require('../../controllers/auth/auth.controller');

/**
 * Auth Routes
 * 
 * Middleware chain explained:
 *   authLimiter      → max 20 requests per 15 min (prevent abuse)
 *   verifyFirebaseToken → check Firebase token is valid
 *   validate(schema) → check request body shape
 *   controller       → do the work
 * 
 * verifyFirebaseToken is a lighter version of protect:
 * it only verifies the Firebase token without requiring
 * the user to already exist in our DB (they're registering!)
 */

// POST /api/v1/auth/register/user
router.post(
  '/register/user',
  authLimiter,
  verifyFirebaseToken,
  validate(registerUserSchema),
  registerUserController
);

// POST /api/v1/auth/register/client
router.post(
  '/register/client',
  authLimiter,
  verifyFirebaseToken,
  validate(registerClientSchema),
  registerClientController
);

// GET /api/v1/auth/me  (requires full protect — user must exist in DB)
router.get('/me', protect, getMe);

module.exports = router;