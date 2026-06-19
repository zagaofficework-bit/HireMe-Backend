const mongoose = require('mongoose');

/**
 * Review Model
 *
 * WHO can review:  client only
 * WHO gets reviewed: user only
 *
 * One client can leave ONE review per user — enforced
 * by the unique compound index below.
 *
 * After every create/update/delete we recalculate
 * averageRating and totalReviews on the Profile document.
 */
const reviewSchema = new mongoose.Schema(
  {
    // Client who wrote the review
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User who received the review
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Profile being reviewed
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Admin can hide inappropriate reviews
    isVisible: {
      type: Boolean,
      default: true,
    },

    // Admin flag
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────

// Prevents one client reviewing same user twice
reviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true });
reviewSchema.index({ profile: 1, isVisible: 1 });
reviewSchema.index({ reviewee: 1, isVisible: 1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);