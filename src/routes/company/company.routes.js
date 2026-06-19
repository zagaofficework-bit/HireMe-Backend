const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { uploadLimiter } = require('../../middlewares/rateLimiter.middleware');
const { uploadCompanyLogo } = require('../../middlewares/upload.middleware');
const {
  createCompanySchema,
  updateCompanySchema,
  rejectCompanySchema,
} = require('../../validations/company/company.validation');
const {
  createCompanyController,
  getMyCompanyController,
  getCompanyController,
  updateCompanyController,
  uploadLogoController,
  getAllCompaniesController,
  verifyCompanyController,
  rejectCompanyController,
} = require('../../controllers/company/company.controller');

// ── Client routes ─────────────────────────────────────────────────
router.post( '/',       protect, authorizeRoles('client'), validate(createCompanySchema), createCompanyController);
router.get(  '/me',     protect, authorizeRoles('client'),                                getMyCompanyController);
router.patch('/me',     protect, authorizeRoles('client'), validate(updateCompanySchema), updateCompanyController);
router.post( '/me/logo',protect, authorizeRoles('client'), uploadLimiter, uploadCompanyLogo, uploadLogoController);

// ── Admin routes ──────────────────────────────────────────────────
router.get(  '/admin/all',         protect, authorizeRoles('admin'), getAllCompaniesController);
router.patch('/admin/:id/verify',  protect, authorizeRoles('admin'), verifyCompanyController);
router.patch('/admin/:id/reject',  protect, authorizeRoles('admin'), validate(rejectCompanySchema), rejectCompanyController);

// ── Public ────────────────────────────────────────────────────────
// IMPORTANT: must be last so /me and /admin don't get caught by /:slug
router.get('/:slug', getCompanyController);

module.exports = router;