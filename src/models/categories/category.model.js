const mongoose = require('mongoose');

/**
 * Category Model
 * Admin creates these. Users pick one when building their profile.
 * Examples: Web Development, Graphic Design, Data Science, etc.
 *
 * `skills` holds the specific job-titles/roles under this category
 * (e.g. Category "Software & IT" -> skills: ["React Developer", "DevOps Engineer", ...]).
 * Used to populate the skills dropdown on profile creation, scoped to the
 * category the user selects.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // e.g. "web-development", "graphic-design"
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    icon: {
      type: String, // emoji or icon name e.g. "💻" or "code"
      default: '💼',
    },

    // Specific roles/professions under this category.
    // Powers the skills dropdown in profile creation + skill-based search.
    skills: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))]
          : arr,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // How many profiles are in this category
    // Updated via aggregation — cached for fast homepage queries
    profileCount: {
      type: Number,
      default: 0,
    },

    // Admin can pin top categories to always appear on homepage
    isFeatured: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0, // for manual sorting on homepage
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, isFeatured: -1, order: 1 });
categorySchema.index({ skills: 1 }); // supports skill-based search/filtering

module.exports = mongoose.model('Category', categorySchema);