const Joi = require('joi');

/**
 * Profile Validations
 * Split into sections so users can update one section at a time
 * instead of sending the entire profile every time.
 */

// ── Create profile (initial setup after registration) ─────────────
const createProfileSchema = Joi.object({
  fullName:    Joi.string().min(2).max(100).required(),
  age:         Joi.number().min(16).max(80).optional(),
  gender:      Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  bio:         Joi.string().max(1000).optional().allow('', null),
  category:    Joi.string().hex().length(24).optional().allow(null), // MongoDB ObjectId
});

// ── Basic info update ─────────────────────────────────────────────
const updateBasicSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  age:      Joi.number().min(16).max(80).optional(),
  gender:   Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  bio:      Joi.string().max(1000).optional().allow('', null),
  category: Joi.string().hex().length(24).optional().allow(null),
});

// ── Skills ────────────────────────────────────────────────────────
const updateSkillsSchema = Joi.object({
  skills: Joi.array().items(
    Joi.object({
      name:  Joi.string().max(50).required(),
      level: Joi.string().valid('beginner', 'intermediate', 'expert').default('intermediate'),
    })
  ).max(30).required(),
});

// ── Experience ────────────────────────────────────────────────────
const updateExperienceSchema = Joi.object({
  experience: Joi.array().items(
    Joi.object({
      title:       Joi.string().required(),
      company:     Joi.string().required(),
      startDate:   Joi.date().required(),
      endDate:     Joi.date().optional().allow(null),
      isCurrent:   Joi.boolean().default(false),
      description: Joi.string().max(500).optional().allow('', null),
    })
  ).max(20).required(),
});

// ── Education ─────────────────────────────────────────────────────
const updateEducationSchema = Joi.object({
  education: Joi.array().items(
    Joi.object({
      degree:      Joi.string().required(),
      institution: Joi.string().required(),
      year:        Joi.number().min(1970).max(new Date().getFullYear()).optional(),
    })
  ).max(10).required(),
});

// ── Work preferences ──────────────────────────────────────────────
const updatePreferencesSchema = Joi.object({
  workType:     Joi.string().valid('remote', 'onsite', 'hybrid').optional(),
  jobType:      Joi.string().valid('fulltime', 'parttime', 'freelance', 'internship').optional(),
  availability: Joi.string().valid('immediate', 'one_week', 'two_weeks', 'one_month', 'not_available').optional(),
  expectedSalary: Joi.object({
    min:      Joi.number().min(0).optional(),
    max:      Joi.number().min(0).optional(),
    currency: Joi.string().default('INR').optional(),
  }).optional(),
  hourlyRate: Joi.object({
    amount:   Joi.number().min(0).optional(),
    currency: Joi.string().default('INR').optional(),
  }).optional(),
});

// ── Location ──────────────────────────────────────────────────────
const updateLocationSchema = Joi.object({
  location: Joi.object({
    country: Joi.string().optional(),
    state:   Joi.string().optional(),
    city:    Joi.string().optional(),
    coordinates: Joi.object({
      type:        Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).length(2).optional(),
    }).optional(),
  }).required(),
});

// ── Social links ──────────────────────────────────────────────────
const updateSocialSchema = Joi.object({
  social: Joi.object({
    linkedin: Joi.string().uri().optional().allow('', null),
    github:   Joi.string().uri().optional().allow('', null),
    website:  Joi.string().uri().optional().allow('', null),
  }).required(),
});

// ── Contact details ───────────────────────────────────────────────
const updateContactSchema = Joi.object({
  contact: Joi.object({
    email: Joi.string().email().optional().allow('', null),
    phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).optional().allow('', null),
  }).required(),
});

// ── Languages ─────────────────────────────────────────────────────
const updateLanguagesSchema = Joi.object({
  languages: Joi.array().items(
    Joi.object({
      name:        Joi.string().required(),
      proficiency: Joi.string().valid('basic', 'conversational', 'fluent', 'native').default('fluent'),
    })
  ).max(10).required(),
});

module.exports = {
  createProfileSchema,
  updateBasicSchema,
  updateSkillsSchema,
  updateExperienceSchema,
  updateEducationSchema,
  updatePreferencesSchema,
  updateLocationSchema,
  updateSocialSchema,
  updateContactSchema,
  updateLanguagesSchema,
};