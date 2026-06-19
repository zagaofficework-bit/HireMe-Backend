const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  sendEmailVerification,
  verifyEmail,
  sendPhoneOTP,
  verifyPhone,
  getVerificationStatus,
} = require('../../services/verification/verification.service');

// GET /api/v1/verification/status
const statusController = asyncHandler(async (req, res) => {
  const status = await getVerificationStatus(req.user._id);
  return res.status(200).json(new ApiResponse(200, status, 'Verification status fetched'));
});

// POST /api/v1/verification/send-email
const sendEmailController = asyncHandler(async (req, res) => {
  const result = await sendEmailVerification(req.user._id);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

// POST /api/v1/verification/verify-email
const verifyEmailController = asyncHandler(async (req, res) => {
  const { token, userId } = req.body;
  // userId from query or body — needed because email link includes it
  const targetUserId = userId || req.user._id;
  const result = await verifyEmail(targetUserId, token);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

// POST /api/v1/verification/send-phone-otp
const sendPhoneOtpController = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const result = await sendPhoneOTP(req.user._id, phone);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

// POST /api/v1/verification/verify-phone
const verifyPhoneController = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  const result = await verifyPhone(req.user._id, phone, otp);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = {
  statusController,
  sendEmailController,
  verifyEmailController,
  sendPhoneOtpController,
  verifyPhoneController,
};