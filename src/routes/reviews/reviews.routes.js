const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createReviewSchema, updateReviewSchema } = require('../../validations/reviews/review.validation');
const {
  createReviewController,
  getProfileReviewsController,
  getMyReviewsController,
  updateReviewController,
  deleteReviewController,
  toggleVisibilityController,
} = require('../../controllers/reviews/review.controller');

// ── Public ────────────────────────────────────────────────────────
// Anyone can read reviews on a profile
router.get('/profile/:profileId', getProfileReviewsController);

// ── Client only ───────────────────────────────────────────────────
router.post('/',    protect, authorizeRoles('client'), validate(createReviewSchema), createReviewController);
router.get('/my',   protect, authorizeRoles('client'),                               getMyReviewsController);
router.patch('/:id',protect, authorizeRoles('client'), validate(updateReviewSchema), updateReviewController);
router.delete('/:id',protect,authorizeRoles('client'),                               deleteReviewController);

// ── Admin only ────────────────────────────────────────────────────
router.patch('/:id/toggle-visibility', protect, authorizeRoles('admin'), toggleVisibilityController);

module.exports = router;