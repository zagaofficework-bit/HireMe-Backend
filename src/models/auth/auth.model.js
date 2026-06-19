const mongoose = require('mongoose');

/**
 * User Model
 * 
 * This is the central user document stored in MongoDB.
 * Every person on HireMe has ONE document here, regardless of role.
 * 
 * Role is permanent — set at registration, never changed.
 * 
 * Why separate from Profile model?
 *  - Auth model = identity (who are you? are you banned? what role?)
 *  - Profile model = professional data (skills, bio, portfolio)
 * Separation keeps auth fast and lean.
 */
const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      sparse: true,   // allows null/undefined but enforces unique if present
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      sparse: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ── Role ──────────────────────────────────────────────────────
    // PERMANENT — set once at registration
    role: {
      type: String,
      enum: ['user', 'client', 'admin'],
      required: true,
      default: 'user',
    },

    // ── Account Status ────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'banned'],
      default: 'active',
    },

    // ── Verification Flags ────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Has the user completed their profile setup after registration?
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    // ── Admin Controls ────────────────────────────────────────────
    // When and why was this account banned?
    bannedAt: { type: Date },
    banReason: { type: String },

    // ── Timestamps for last activity ──────────────────────────────
    lastLoginAt: { type: Date },

    // ── Future-proofing ───────────────────────────────────────────
    // Subscription tier — for when you add paid features
    subscriptionTier: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ── Indexes ──────────────────────────────────────────────────────
// These speed up the most common queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// ── Virtual ───────────────────────────────────────────────────────
// A computed property — not stored in DB, calculated on the fly
// Usage: user.isActive → true/false
userSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

module.exports = mongoose.model('User', userSchema);