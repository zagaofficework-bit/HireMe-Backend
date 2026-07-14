const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createCategorySchema, updateCategorySchema } = require('../../validations/categories/category.validation');
const {
  listCategories,
  getCategory,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  backfillProfileCategoriesController, // ← add
} = require('../../controllers/categories/category.controller');

// ── Public ────────────────────────────────────────────────────────
router.get('/',      listCategories);
router.get('/:slug', getCategory);

// ── Admin only ────────────────────────────────────────────────────
router.post(  '/',    protect, authorizeRoles('admin'), validate(createCategorySchema), createCategoryController);
router.patch( '/:id', protect, authorizeRoles('admin'), validate(updateCategorySchema), updateCategoryController);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCategoryController);

// One-off maintenance job — run once after deploying the skills→category
// auto-derive fix in profile.controller.js, to backfill profiles that
// were saved before that fix existed. Safe to re-run.
router.post('/admin/backfill-profiles', protect, authorizeRoles('admin'), backfillProfileCategoriesController);

module.exports = router;