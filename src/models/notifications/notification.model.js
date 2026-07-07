const mongoose = require("mongoose");

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
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "profile_viewed",
        "profile_shortlisted",
        "review_received",
        "account_banned",
        "account_suspended",
        "account_unbanned",
        "verification_approved",
        "verification_rejected",
        "company_verified",
        "company_rejected",
        "report_resolved",
        "admin_warning",
        "hire_request", // ← added
        "hire_accepted", // ← added
        "hire_rejected", // ← added
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

    refModel: {
      type: String,
      enum: [
        "User",
        "Profile",
        "Review",
        "Report",
        "Company",
        "HireRequest",
        null,
      ], // ← added
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
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
