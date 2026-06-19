const mongoose = require('mongoose');

/**
 * Notification Model
 *
 * Stores in-app notifications for users and clients.
 * Designed for future realtime expansion (Socket.io).
 *
 * Current: poll-based (frontend calls GET /notifications)
 * Future:  push via Socket.io on create
 */
const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        'profile_viewed',      // someone viewed your profile
        'profile_shortlisted', // client bookmarked you
        'review_received',     // client left you a review
        'account_banned',      // admin banned your account
        'account_suspended',   // admin suspended your account
        'account_unbanned',    // admin unbanned your account
        'verification_approved', // admin verified your profile
        'verification_rejected', // admin rejected verification
        'company_verified',    // admin verified client's company
        'company_rejected',    // admin rejected client's company
        'report_resolved',     // admin resolved your report
        'admin_warning',       // admin sent a warning
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional link to relevant resource
    link: {
      type: String,
      default: null,
    },

    // Optional reference to related document
    refModel: {
      type: String,
      enum: ['User', 'Profile', 'Review', 'Report', 'Company', null],
      default: null,
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);