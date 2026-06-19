const mongoose = require('mongoose');

/**
 * Bookmark Model
 *
 * Clients save/shortlist user profiles.
 * One client can bookmark same profile only once.
 * Enforced by unique compound index.
 */
const bookmarkSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true,
    },

    // Client can tag bookmarks for organization
    // e.g. "React Developers", "For Project X"
    tag: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    // Client's private note about this profile
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true }
);

// One client can bookmark a profile only once
bookmarkSchema.index({ client: 1, profile: 1 }, { unique: true });
bookmarkSchema.index({ client: 1, createdAt: -1 });
bookmarkSchema.index({ client: 1, tag: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);