const router = require('express').Router();
const { optionalAuth } = require('../../middlewares/auth.middleware');
const { searchController, suggestionsController, nearbyController } = require('../../controllers/search/search.controller');

/**
 * Search routes use optionalAuth:
 *  - Guests can search (limited results)
 *  - Logged-in clients can search (full results, contact visible if verified)
 *
 * No strict auth required — search is public.
 * Contact details are stripped inside profile service based on role.
 */

// GET /api/v1/search
router.get('/', optionalAuth, searchController);

// GET /api/v1/search/suggestions?q=rea
router.get('/suggestions', suggestionsController);

// GET /api/v1/search/nearby?lat=19.07&lng=72.87&radiusKm=30
router.get('/nearby', optionalAuth, nearbyController);

module.exports = router;