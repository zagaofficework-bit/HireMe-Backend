const mongoose = require('mongoose');

/**
 * Analytics Model
 * 
 * Tracks events on the platform.
 * Kept separate from user data so analytics queries
 * don't slow down core user queries.
 * 
 * Designed to scale — you can add more event types later
 * without changing the schema structure.
 */
const analyticsSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: [
        'profile_view',
        'profile_click',
        'search',
        'bookmark_add',
        'contact_reveal', // client viewed user's phone/email
        'shortlist_add',
      ],
      required: true,
      index: true,
    },

    // Who triggered the event (null = anonymous/guest)
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    actorRole: {
      type: String,
      enum: ['user', 'client', 'admin', 'guest'],
      default: 'guest',
    },

    // Who/what was the event about
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // For search events — what was searched
    searchQuery: { type: String, default: null },
    searchSkill: { type: String, default: null },

    // For future segmentation
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Auto-delete analytics older than 6 months to save storage
    // Remove this line if you want to keep all data
    // expireAfterSeconds: 60 * 60 * 24 * 180
  }
);

// Indexes for fast analytics aggregation queries
analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ targetId: 1, event: 1 });
analyticsSchema.index({ actorId: 1, event: 1 });
analyticsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);