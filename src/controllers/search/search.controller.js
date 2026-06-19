const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { trackEvent } = require('../../services/analytics/analytics.service');
const {
  searchProfiles,
  getSkillSuggestions,
  getNearbyProfiles,
} = require('../../services/search/search.service');

/**
 * GET /api/v1/search
 * Main search endpoint — all filters via query params
 *
 * Examples:
 *  /api/v1/search?q=react developer
 *  /api/v1/search?skills=React,Node.js&workType=remote
 *  /api/v1/search?city=Mumbai&minSalary=50000&sortBy=top_rated
 *  /api/v1/search?jobType=internship&verified=true&page=2
 */
const searchController = asyncHandler(async (req, res) => {
  const result = await searchProfiles(req.query, req.user);

  // Track search event for analytics
  await trackEvent({
    event:       'search',
    actorId:     req.user?._id || null,
    actorRole:   req.user?.role || 'guest',
    searchQuery: req.query.q || null,
    searchSkill: req.query.skills || null,
  });

  return res.status(200).json(new ApiResponse(200, result, 'Search results fetched'));
});

/**
 * GET /api/v1/search/suggestions?q=rea
 * Skill autocomplete — returns matching skills as user types
 */
const suggestionsController = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(200).json(new ApiResponse(200, { suggestions: [] }, 'Type at least 2 characters'));
  }

  const suggestions = await getSkillSuggestions(q);
  return res.status(200).json(new ApiResponse(200, { suggestions }, 'Suggestions fetched'));
});

/**
 * GET /api/v1/search/nearby?lat=19.07&lng=72.87&radiusKm=30
 * Find talent near a location
 */
const nearbyController = asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm, page, limit } = req.query;

  if (!lat || !lng) throw new ApiError(400, 'lat and lng query params are required');

  const result = await getNearbyProfiles({ lat, lng, radiusKm, page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Nearby profiles fetched'));
});

module.exports = { searchController, suggestionsController, nearbyController };