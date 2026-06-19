const Profile = require('../../models/profiles/profile.model');
const Analytics = require('../../models/analytics/analytics.model');

/**
 * Search Service
 *
 * Supports:
 *  - Keyword search (name, bio, skills) via MongoDB text index
 *  - Filter by skills, category, location, workType, jobType
 *  - Filter by salary range, hourly rate
 *  - Filter by availability, verified, rating
 *  - Sort by newest, top rated, most viewed
 *  - Pagination
 *  - Tracks search events for analytics
 */

const searchProfiles = async (queryParams, viewerUser) => {
  const {
    q,             // keyword search
    skills,        // comma-separated: "React,Node.js"
    category,      // category ObjectId
    city,
    state,
    workType,      // remote | onsite | hybrid
    jobType,       // fulltime | parttime | freelance | internship
    availability,
    minSalary,
    maxSalary,
    minRate,
    maxRate,
    verified,      // true/false
    minRating,     // 1-5
    sortBy,        // newest | top_rated | most_viewed
    page  = 1,
    limit = 20,
  } = queryParams;

  // ── Build filter object ───────────────────────────────────────
  const filter = {
    isVisible: true, // never show hidden profiles
  };

  // Keyword search — uses MongoDB text index
  // Text index is on: fullName, bio, skills.name
  if (q) {
    filter.$text = { $search: q };
  }

  // Skills filter — match ANY of the provided skills
  if (skills) {
    const skillArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (skillArray.length > 0) {
      filter['skills.name'] = {
        $in: skillArray.map((s) => new RegExp(s, 'i')), // case-insensitive
      };
    }
  }

  // Category filter
  if (category) filter.category = category;

  // Location filters
  if (city)  filter['location.city']  = new RegExp(city, 'i');
  if (state) filter['location.state'] = new RegExp(state, 'i');

  // Work type
  if (workType)     filter.workType     = workType;
  if (jobType)      filter.jobType      = jobType;
  if (availability) filter.availability = availability;

  // Salary range
  if (minSalary) filter['expectedSalary.min'] = { $gte: +minSalary };
  if (maxSalary) filter['expectedSalary.max'] = { $lte: +maxSalary };

  // Hourly rate
  if (minRate) filter['hourlyRate.amount'] = { $gte: +minRate };
  if (maxRate) {
    filter['hourlyRate.amount'] = {
      ...filter['hourlyRate.amount'],
      $lte: +maxRate,
    };
  }

  // Verified badge
  if (verified === 'true') filter.isVerified = true;

  // Minimum rating
  if (minRating) filter.averageRating = { $gte: +minRating };

  // ── Build sort object ─────────────────────────────────────────
  let sort = {};

  if (q) {
    // When keyword search — sort by text score relevance first
    sort = { score: { $meta: 'textScore' }, ...sort };
  }

  switch (sortBy) {
    case 'top_rated':  sort = { averageRating: -1, totalReviews: -1 }; break;
    case 'most_viewed':sort = { totalViews: -1 };                       break;
    case 'newest':
    default:           sort = { ...sort, createdAt: -1 };               break;
  }

  // ── Pagination ────────────────────────────────────────────────
  const skip = (page - 1) * limit;
  const limitNum = Math.min(+limit, 50); // max 50 per page

  // ── Execute query ─────────────────────────────────────────────
  /**
   * Why lean()?
   * lean() returns plain JS objects instead of Mongoose documents.
   * Much faster for read-only operations — no getters, virtuals, or methods.
   * We use it here because search results are read-only.
   */
  const [profiles, total] = await Promise.all([
    Profile.find(filter, q ? { score: { $meta: 'textScore' } } : {})
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name slug icon')
      .select(
        'fullName profileImage skills bio location workType jobType availability ' +
        'expectedSalary hourlyRate averageRating totalReviews isVerified ' +
        'totalExperience completionPercentage createdAt'
        // contact NOT included — never expose in search results
      )
      .lean(),
    Profile.countDocuments(filter),
  ]);

  return {
    profiles,
    pagination: {
      total,
      page:  +page,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
    appliedFilters: {
      q, skills, category, city, state,
      workType, jobType, availability,
      minSalary, maxSalary, minRate, maxRate,
      verified, minRating, sortBy,
    },
  };
};

/**
 * getSkillSuggestions
 * Autocomplete for skill search input.
 * Returns top matching skills from all profiles.
 */
const getSkillSuggestions = async (query) => {
  if (!query || query.length < 2) return [];

  const results = await Profile.aggregate([
    { $match: { isVisible: true } },
    { $unwind: '$skills' },
    {
      $match: {
        'skills.name': { $regex: query, $options: 'i' },
      },
    },
    {
      $group: {
        _id: '$skills.name',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { skill: '$_id', count: 1, _id: 0 } },
  ]);

  return results;
};

/**
 * getNearbyProfiles
 * Find profiles within X km of given coordinates.
 * Uses MongoDB 2dsphere index on location.coordinates.
 */
const getNearbyProfiles = async ({ lng, lat, radiusKm = 50, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [profiles, total] = await Promise.all([
    Profile.find({
      isVisible: true,
      'location.coordinates': {
        $near: {
          $geometry:    { type: 'Point', coordinates: [+lng, +lat] },
          $maxDistance: radiusKm * 1000, // convert km to meters
        },
      },
    })
      .skip(skip)
      .limit(+limit)
      .select('fullName profileImage skills location averageRating isVerified')
      .lean(),
    Profile.countDocuments({ isVisible: true }),
  ]);

  return {
    profiles,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
  };
};

module.exports = { searchProfiles, getSkillSuggestions, getNearbyProfiles };