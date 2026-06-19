const User = require('../../models/auth/auth.model');
const Profile = require('../../models/profiles/profile.model');
const Category = require('../../models/categories/category.model');
const Analytics = require('../../models/analytics/analytics.model');

/**
 * Homepage Service
 * All queries run in parallel via Promise.all for speed.
 */

const formatCount = (num) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M+`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K+`;
  return String(num);
};

const getHomepageData = async () => {
  const [
    totalTalents,
    totalHirers,
    totalVerified,
    totalProfileViews,
    topSkills,
    featuredProfiles,
    topCategories,
  ] = await Promise.all([

    // ── Stat 1: Total active talents ──────────────────────────────
    User.countDocuments({ role: 'user', status: 'active' }),

    // ── Stat 2: Total active clients/hirers ───────────────────────
    User.countDocuments({ role: 'client', status: 'active' }),

    // ── Stat 3: Verified profiles ─────────────────────────────────
    Profile.countDocuments({ isVerified: true, isVisible: true }),

    // ── Stat 4: Total profile views ───────────────────────────────
    Analytics.countDocuments({ event: 'profile_view' }),

    // ── Stat 5: Top 8 skills across all profiles ──────────────────
    Profile.aggregate([
      { $match: { isVisible: true } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { skill: '$_id', count: 1, _id: 0 } },
    ]),

    // ── Featured profiles for homepage ────────────────────────────
    Profile.find({ isFeatured: true, isVisible: true })
      .limit(8)
      .sort({ averageRating: -1 })
      .populate('user', 'name isEmailVerified')       // pull name from User
      .populate('category', 'name slug icon')          // pull category info
      .select('fullName profileImage skills bio location workType availability averageRating totalReviews isVerified totalExperience'),

    // ── Top categories by profile count ───────────────────────────
    Category.find({ isActive: true })
      .sort({ isFeatured: -1, profileCount: -1, order: 1 })
      .limit(10)
      .select('name slug icon description profileCount isFeatured'),
  ]);

  return {
    stats: {
      totalTalents,
      totalHirers,
      totalVerified,
      totalProfileViews,
      // Display-friendly formatted versions
      display: {
        talents:  formatCount(totalTalents),
        hirers:   formatCount(totalHirers),
        verified: formatCount(totalVerified),
        views:    formatCount(totalProfileViews),
      },
    },
    topSkills,
    featuredProfiles,
    topCategories,
  };
};

module.exports = { getHomepageData };