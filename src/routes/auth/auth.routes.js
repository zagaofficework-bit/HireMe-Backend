const router = require('express').Router();
const { protect, verifyFirebaseToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const { registerUserSchema, registerClientSchema } = require('../../validations/auth/auth.validation');
const {
  registerUserController,
  registerClientController,
  googleAuthController,
  getMe,
} = require('../../controllers/auth/auth.controller');

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

/**
 * POST /api/v1/auth/google
 *
 * Single endpoint for Google sign-in — handles both new and returning users.
 * Frontend calls this right after firebase.signInWithPopup() succeeds,
 * sending the Firebase ID token in the Authorization header and
 * optionally { role: 'client' | 'user' } in the body (for new users).
 *
 * Middleware chain:
 *   authLimiter         → rate-limit abuse
 *   verifyFirebaseToken → decode + attach req.firebaseUser (uid, email, name…)
 *   controller          → upsert MongoDB profile, return { user, requiresMobile }
 */
router.post(
  '/google',
  authLimiter,
  verifyFirebaseToken,
  googleAuthController
);

// GET /api/v1/auth/me
router.get('/me', protect, getMe);

module.exports = router;