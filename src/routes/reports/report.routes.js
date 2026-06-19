const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createReportSchema, resolveReportSchema } = require('../../validations/reports/report.validation');
const {
  createReportController,
  getMyReportsController,
  getAllReportsController,
  getStatsController,
  getReportController,
  resolveReportController,
} = require('../../controllers/reports/report.controller');

// ── Any logged-in user/client ─────────────────────────────────────
router.post('/',    protect,                          validate(createReportSchema), createReportController);
router.get('/my',   protect,                                                        getMyReportsController);

// ── Admin only ────────────────────────────────────────────────────
router.get( '/admin',          protect, authorizeRoles('admin'), getAllReportsController);
router.get( '/admin/stats',    protect, authorizeRoles('admin'), getStatsController);
router.get( '/admin/:id',      protect, authorizeRoles('admin'), getReportController);
router.patch('/admin/:id/resolve', protect, authorizeRoles('admin'), validate(resolveReportSchema), resolveReportController);

module.exports = router;