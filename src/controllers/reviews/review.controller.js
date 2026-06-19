const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  createReview,
  getProfileReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} = require('../../services/reviews/review.service');

/**
 * POST /api/v1/reviews
 * Client submits a review for a user profile
 */
const createReviewController = asyncHandler(async (req, res) => {
  const review = await createReview(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { review }, 'Review submitted successfully'));
});

/**
 * GET /api/v1/reviews/profile/:profileId
 * Anyone can see reviews on a profile
 */
const getProfileReviewsController = asyncHandler(async (req, res) => {
  const { page, limit, sortBy } = req.query;
  const result = await getProfileReviews(req.params.profileId, { page, limit, sortBy });
  return res.status(200).json(new ApiResponse(200, result, 'Reviews fetched'));
});

/**
 * GET /api/v1/reviews/my
 * Client sees all reviews they have written
 */
const getMyReviewsController = asyncHandler(async (req, res) => {
  const reviews = await getMyReviews(req.user._id);
  return res.status(200).json(new ApiResponse(200, { reviews }, 'Your reviews fetched'));
});

/**
 * PATCH /api/v1/reviews/:id
 * Client edits their own review
 */
const updateReviewController = asyncHandler(async (req, res) => {
  const review = await updateReview(req.params.id, req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { review }, 'Review updated'));
});

/**
 * DELETE /api/v1/reviews/:id
 * Client deletes their own review
 */
const deleteReviewController = asyncHandler(async (req, res) => {
  await deleteReview(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, {}, 'Review deleted'));
});

/**
 * PATCH /api/v1/reviews/:id/toggle-visibility
 * Admin hides/shows a review
 */
const toggleVisibilityController = asyncHandler(async (req, res) => {
  const review = await toggleReviewVisibility(req.params.id);
  const msg = review.isVisible ? 'Review is now visible' : 'Review hidden';
  return res.status(200).json(new ApiResponse(200, { review }, msg));
});

module.exports = {
  createReviewController,
  getProfileReviewsController,
  getMyReviewsController,
  updateReviewController,
  deleteReviewController,
  toggleVisibilityController,
};