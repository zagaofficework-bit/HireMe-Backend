const router = require('express').Router();

/**
 * Master Router
 * 
 * All module routes are mounted here under /api/v1/
 * Adding a new module = one line here.
 * 
 * Pattern: router.use('/resource', require('../modules/resource/resource.routes'))
 */

router.use('/auth',      require('./auth/auth.routes'));
router.use('/analytics', require('./analytics/analytics.routes'));
router.use('/categories', require('./categories/category.routes'));
router.use('/homepage',   require('./profiles/homepage.routes'));
router.use('/profiles',   require('./profiles/profile.routes'));
router.use('/uploads',    require('./uploads/upload.routes'));
router.use('/company',    require('./company/company.routes'));
router.use('/admin',      require('./admin/admin.routes'));
router.use('/search',     require('./search/search.routes'));
router.use('/verification', require('./verification/verification.routes'));
router.use('/reviews',       require('./reviews/reviews.routes'));
router.use('/bookmarks',     require('./bookmarks/bookmark.routes'));
router.use('/reports',       require('./reports/report.routes'));
router.use('/notifications', require('./notifications/notification.routes'));

module.exports = router;