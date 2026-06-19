const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../models/auth/auth.model');
const Verification = require('../../models/verification/verification.model');
const ApiError = require('../../utils/ApiError');

/**
 * Verification Service
 *
 * Email verification flow:
 *  1. User calls /send-email-verification
 *  2. We generate a random token, hash it, store in DB
 *  3. We send the plain token via email (link: /verify-email?token=xxx)
 *  4. User clicks link → frontend calls /verify-email with token
 *  5. We hash the received token, compare with DB
 *  6. If match → mark user email as verified
 *
 * Phone OTP:
 *  Since Firebase handles real OTP on frontend,
 *  this is a placeholder for custom SMS OTP if you switch later.
 */

// ── Helpers ───────────────────────────────────────────────────────

// Generate a secure random token
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Email Verification ────────────────────────────────────────────

const sendEmailVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user)                  throw new ApiError(404, 'User not found');
  if (user.isEmailVerified)   throw new ApiError(400, 'Email is already verified');
  if (!user.email)            throw new ApiError(400, 'No email address on your account');

  // Delete any existing unused token for this user
  await Verification.deleteMany({ user: userId, type: 'email_verification' });

  // Generate token
  const plainToken = generateToken();
  const hashedToken = await bcrypt.hash(plainToken, 10);

  // Store hashed token — expires in 24 hours
  await Verification.create({
    user:      userId,
    type:      'email_verification',
    token:     hashedToken,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  /**
   * TODO: Send email via nodemailer
   * The verification link would be:
   * https://yourdomain.com/verify-email?token=<plainToken>&userId=<userId>
   *
   * For now we return the token in development so you can test via Postman.
   * In production: send email, return only a success message.
   */
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${plainToken}&userId=${userId}`;

  // In production remove plainToken from response
  return {
    message: 'Verification email sent',
    ...(process.env.NODE_ENV === 'development' && { devToken: plainToken, devLink: verificationLink }),
  };
};

const verifyEmail = async (userId, plainToken) => {
  const verification = await Verification.findOne({
    user: userId,
    type: 'email_verification',
    isUsed: false,
  });

  if (!verification) throw new ApiError(400, 'Invalid or expired verification token');

  // Compare plain token against stored hash
  const isMatch = await bcrypt.compare(plainToken, verification.token);
  if (!isMatch) throw new ApiError(400, 'Invalid verification token');

  // Mark token as used
  verification.isUsed = true;
  await verification.save();

  // Mark user email as verified
  await User.findByIdAndUpdate(userId, { isEmailVerified: true });

  return { message: 'Email verified successfully' };
};

// ── Phone OTP (Placeholder) ───────────────────────────────────────

/**
 * sendPhoneOTP
 *
 * NOTE: Since this project uses Firebase Auth,
 * phone OTP is handled by Firebase on the frontend.
 * This is a placeholder for if you ever switch to custom SMS OTP.
 *
 * To activate: integrate Twilio or MSG91 here.
 */
const sendPhoneOTP = async (userId, phone) => {
  const user = await User.findById(userId);
  if (!user)               throw new ApiError(404, 'User not found');
  if (user.isPhoneVerified) throw new ApiError(400, 'Phone is already verified');

  // Delete existing OTPs for this user
  await Verification.deleteMany({ user: userId, type: 'phone_otp' });

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // OTP expires in 10 minutes
  await Verification.create({
    user:      userId,
    type:      'phone_otp',
    token:     hashedOtp,
    phone,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  /**
   * TODO: Send SMS via Twilio/MSG91
   * await twilioClient.messages.create({ to: phone, body: `Your OTP is ${otp}` });
   */

  return {
    message: 'OTP sent to phone',
    ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
  };
};

const verifyPhone = async (userId, phone, plainOtp) => {
  const verification = await Verification.findOne({
    user:   userId,
    type:   'phone_otp',
    phone,
    isUsed: false,
  });

  if (!verification) throw new ApiError(400, 'Invalid or expired OTP');

  const isMatch = await bcrypt.compare(plainOtp, verification.token);
  if (!isMatch) throw new ApiError(400, 'Invalid OTP');

  verification.isUsed = true;
  await verification.save();

  await User.findByIdAndUpdate(userId, { isPhoneVerified: true });

  return { message: 'Phone verified successfully' };
};

// ── Verification Status ───────────────────────────────────────────

const getVerificationStatus = async (userId) => {
  const user = await User.findById(userId).select('isEmailVerified isPhoneVerified email phone');
  if (!user) throw new ApiError(404, 'User not found');

  return {
    email: {
      value:      user.email,
      isVerified: user.isEmailVerified,
    },
    phone: {
      value:      user.phone,
      isVerified: user.isPhoneVerified,
    },
  };
};

module.exports = {
  sendEmailVerification,
  verifyEmail,
  sendPhoneOTP,
  verifyPhone,
  getVerificationStatus,
};