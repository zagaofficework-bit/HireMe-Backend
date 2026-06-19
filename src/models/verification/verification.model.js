const mongoose = require('mongoose');

/**
 * Verification Model
 *
 * Stores temporary tokens/OTPs for:
 *  - Email verification
 *  - Phone OTP (placeholder — Firebase handles real OTP)
 *
 * Documents auto-delete after expiry using MongoDB TTL index.
 * No manual cleanup needed.
 */
const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['email_verification', 'phone_otp'],
      required: true,
    },

    // Hashed token/OTP — never store plain text
    token: {
      type: String,
      required: true,
    },

    // For phone OTP — store the phone number being verified
    phone: {
      type: String,
      default: null,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    // Token expires at this time
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-deletes document when expired
    },
  },
  { timestamps: true }
);

verificationSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Verification', verificationSchema);