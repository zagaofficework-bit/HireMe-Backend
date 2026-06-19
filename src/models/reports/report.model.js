const mongoose = require('mongoose');

/**
 * Report Model
 *
 * Anyone (user or client) can report a profile.
 * Admin reviews and resolves reports.
 *
 * One reporter can only report same profile once.
 */
const reportSchema = new mongoose.Schema(
  {
    // Who filed the report
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Which profile is being reported
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true,
    },

    // The user who owns that profile
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: [
        'fake_profile',
        'spam',
        'abusive_content',
        'misleading_info',
        'inappropriate_image',
        'other',
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Admin workflow status
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },

    // Admin who handled this report
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    resolvedAt: { type: Date, default: null },

    // What action admin took
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    adminAction: {
      type: String,
      enum: ['none', 'warned', 'suspended', 'banned', 'profile_hidden', 'dismissed'],
      default: 'none',
    },
  },
  { timestamps: true }
);

// One reporter per profile — no duplicate reports
reportSchema.index({ reporter: 1, profile: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1 });

module.exports = mongoose.model('Report', reportSchema);