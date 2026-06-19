const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  banUserSchema,
  suspendUserSchema,
  featureProfileSchema,
  verifyUserSchema,
} = require('../../validations/admin/admin.validation');
const {
  overviewController,
  getUsersController,
  getUserDetailController,
  banUserController,
  unbanUserController,
  suspendUserController,
  unsuspendUserController,
  featureProfileController,
  verifyProfileController,
  deleteProfileController,
} = require('../../controllers/admin/admin.controller');

// All admin routes — must be logged in AND role=admin
router.use(protect, authorizeRoles('admin'));

// ── Platform ──────────────────────────────────────────────────────
router.get('/overview', overviewController);

// ── User Management ───────────────────────────────────────────────
router.get('/users',               getUsersController);
router.get('/users/:id',           getUserDetailController);
router.patch('/users/:id/ban',     validate(banUserSchema),     banUserController);
router.patch('/users/:id/unban',                                unbanUserController);
router.patch('/users/:id/suspend', validate(suspendUserSchema), suspendUserController);
router.patch('/users/:id/unsuspend',                            unsuspendUserController);

// ── Profile Management ────────────────────────────────────────────
router.patch('/profiles/:id/feature', validate(featureProfileSchema), featureProfileController);
router.patch('/profiles/:id/verify',  validate(verifyUserSchema),     verifyProfileController);
router.delete('/profiles/:id',                                         deleteProfileController);

module.exports = router;