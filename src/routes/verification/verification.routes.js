const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');
const { verifyEmailSchema, verifyPhoneSchema } = require('../../validations/verification/verification.validation');
const {
  statusController,
  sendEmailController,
  verifyEmailController,
  sendPhoneOtpController,
  verifyPhoneController,
} = require('../../controllers/verification/verification.controller');

// All routes require login
router.use(protect);

// GET  /api/v1/verification/status
router.get('/status', statusController);

// POST /api/v1/verification/send-email
router.post('/send-email', authLimiter, sendEmailController);

// POST /api/v1/verification/verify-email
router.post('/verify-email', validate(verifyEmailSchema), verifyEmailController);

// POST /api/v1/verification/send-phone-otp  (placeholder)
router.post('/send-phone-otp', authLimiter, sendPhoneOtpController);

// POST /api/v1/verification/verify-phone  (placeholder)
router.post('/verify-phone', validate(verifyPhoneSchema), verifyPhoneController);

module.exports = router;