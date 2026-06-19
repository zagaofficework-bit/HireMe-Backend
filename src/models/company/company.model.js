const mongoose = require('mongoose');

/**
 * Company Model
 *
 * One company per client account.
 * Admin verifies it — only then client can see contact details of users.
 */
const companySchema = new mongoose.Schema(
  {
    // Which client owns this company profile
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Basic Info ────────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    industry: {
      type: String,
      trim: true,
    },

    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    },

    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    website: {
      type: String,
      trim: true,
    },

    // ── Logo ──────────────────────────────────────────────────────
    logo: {
      url:      { type: String },
      publicId: { type: String },
    },

    // ── Location ──────────────────────────────────────────────────
    location: {
      country: { type: String, default: 'India' },
      state:   { type: String },
      city:    { type: String },
      address: { type: String },
    },

    // ── Contact ───────────────────────────────────────────────────
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },

    // ── Social ────────────────────────────────────────────────────
    social: {
      linkedin: { type: String },
      twitter:  { type: String },
    },

    // ── Verification ──────────────────────────────────────────────
    // pending → submitted but not reviewed
    // verified → admin approved
    // rejected → admin rejected
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },

    verifiedAt:     { type: Date },
    verifiedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
    rejectionReason:{ type: String },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────
companySchema.index({ slug: 1 });
companySchema.index({ verificationStatus: 1 });
companySchema.index({ client: 1 });

// Auto-generate slug from company name
companySchema.pre('save', function () {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

module.exports = mongoose.model('Company', companySchema);