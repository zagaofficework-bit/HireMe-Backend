const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const { adminDashboard, homepageStats } = require('../../controllers/analytics/analytics.controller');

// Public — no auth needed
// GET /api/v1/analytics/homepage
router.get('/homepage', homepageStats);

// Admin only
// GET /api/v1/analytics/admin/dashboard
router.get('/admin/dashboard', protect, authorizeRoles('admin'), adminDashboard);

module.exports = router;