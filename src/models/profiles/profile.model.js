const mongoose = require('mongoose');

/**
 * Profile Model
 *
 * Separate from auth model intentionally:
 *  - Auth model = who are you + account status
 *  - Profile model = your professional presence
 *
 * One profile per user. Created after registration.
 */
const profileSchema = new mongoose.Schema(
  {
    // Link to auth/user document
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ── Basic ─────────────────────────────────────────────────────
    fullName: { type: String, trim: true, maxlength: 100 },
    age:      { type: Number, min: 16, max: 80 },
    gender:   { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    bio:      { type: String, trim: true, maxlength: 1000 },

    profileImage: {
      url:       { type: String },
      publicId:  { type: String }, // Cloudinary public_id for deletion
    },

    // ── Category ──────────────────────────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    // ── Professional ──────────────────────────────────────────────
    skills: [
      {
        name:  { type: String, trim: true, maxlength: 50 },
        level: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'intermediate' },
      },
    ],

    experience: [
      {
        title:       { type: String, trim: true },
        company:     { type: String, trim: true },
        startDate:   { type: Date },
        endDate:     { type: Date }, // null = current
        isCurrent:   { type: Boolean, default: false },
        description: { type: String, trim: true, maxlength: 500 },
      },
    ],

    education: [
      {
        degree:      { type: String, trim: true },
        institution: { type: String, trim: true },
        year:        { type: Number },
      },
    ],

    languages: [
      {
        name:        { type: String, trim: true },
        proficiency: { type: String, enum: ['basic', 'conversational', 'fluent', 'native'], default: 'fluent' },
      },
    ],

    certifications: [
      {
        name:   { type: String, trim: true },
        issuer: { type: String, trim: true },
        year:   { type: Number },
        url:    { type: String },
      },
    ],

    portfolio: [
      {
        title:       { type: String, trim: true },
        description: { type: String, trim: true },
        url:         { type: String },
        image: {
          url:      { type: String },
          publicId: { type: String },
        },
      },
    ],

    resume: {
      url:       { type: String }, // Cloudinary PDF URL
      publicId:  { type: String },
      updatedAt: { type: Date },
    },

    // ── Work Preferences ──────────────────────────────────────────
    workType:     { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote' },
    jobType:      { type: String, enum: ['fulltime', 'parttime', 'freelance', 'internship'] },
    availability: { type: String, enum: ['immediate', 'one_week', 'two_weeks', 'one_month', 'not_available'], default: 'immediate' },

    expectedSalary: {
      min:      { type: Number },
      max:      { type: Number },
      currency: { type: String, default: 'INR' },
    },

    hourlyRate: {
      amount:   { type: Number },
      currency: { type: String, default: 'INR' },
    },

    // ── Location ──────────────────────────────────────────────────
    location: {
      country: { type: String, default: 'India' },
      state:   { type: String },
      city:    { type: String },
      // GeoJSON for nearby search
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
    },

    // ── Social Links ──────────────────────────────────────────────
    social: {
      linkedin: { type: String },
      github:   { type: String },
      website:  { type: String },
    },

    // ── Contact (only visible to verified clients) ─────────────────
    contact: {
      email: { type: String },
      phone: { type: String },
    },

    // ── Visibility & Status ───────────────────────────────────────
    isVisible:  { type: Boolean, default: true },  // user can hide profile
    isFeatured: { type: Boolean, default: false }, // admin can feature profile on homepage
    isVerified: { type: Boolean, default: false }, // admin verified badge

    // ── Approval workflow ───────────────────────────────────────────
    // 'draft' = never submitted, 'pending' = awaiting admin review,
    // 'approved' / 'rejected' = admin decision.
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },
    submittedForApprovalAt: { type: Date, default: null },
    approvalDecisionAt:     { type: Date, default: null },
    rejectionReason:        { type: String, trim: true, maxlength: 500, default: null },

    // ── Stats (denormalized for fast queries) ─────────────────────
    totalViews:   { type: Number, default: 0 },
    averageRating:{ type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    // Profile completion 0–100
    completionPercentage: { type: Number, default: 0 },

    // ── Years of experience (computed / manually set) ─────────────
    totalExperience: { type: Number, default: 0 }, // in years
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────
profileSchema.index({ user: 1 });
profileSchema.index({ category: 1, isVisible: 1 });
profileSchema.index({ isVisible: 1, isFeatured: -1 });
profileSchema.index({ 'location.city': 1, 'location.state': 1 });
profileSchema.index({ averageRating: -1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ 'skills.name': 1 });
// Geo index for nearby search
profileSchema.index({ 'location.coordinates': '2dsphere' });
// Text index for keyword search
profileSchema.index(
  { fullName: 'text', bio: 'text', 'skills.name': 'text' },
  { weights: { fullName: 3, 'skills.name': 2, bio: 1 } }
);

module.exports = mongoose.model('Profile', profileSchema);