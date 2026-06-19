const Review = require('../../models/reviews/review.model');
const Profile = require('../../models/profiles/profile.model');
const User = require('../../models/auth/auth.model');
const ApiError = require('../../utils/ApiError');

/**
 * Review Service
 *
 * Key rules enforced here:
 *  1. Only clients can review
 *  2. Only users can be reviewed
 *  3. One review per client per user (enforced by DB index + service check)
 *  4. Client cannot review themselves
 *  5. After every change → recalculate average rating on Profile
 */

// ── Helper: recalculate average rating on Profile ─────────────────
/**
 * Called after every create / update / delete.
 * Uses MongoDB aggregation to compute the true average
 * from all visible reviews, then saves it to the Profile.
 *
 * Why not just +1/-1 manually?
 * Aggregation is accurate even if data gets inconsistent.
 * Manual increment can drift over time.
 */
const recalculateRating = async (profileId) => {
  const result = await Review.aggregate([
    { $match: { profile: profileId, isVisible: true } },
    {
      $group: {
        _id: '$profile',
        averageRating: { $avg: '$rating' },
        totalReviews:  { $sum: 1 },
      },
    },
  ]);

  const averageRating = result[0] ? parseFloat(result[0].averageRating.toFixed(1)) : 0;
  const totalReviews  = result[0] ? result[0].totalReviews : 0;

  await Profile.findByIdAndUpdate(profileId, { averageRating, totalReviews });
};

// ── Create Review ─────────────────────────────────────────────────

const createReview = async (reviewerId, { profileId, rating, comment }) => {
  // Fetch the profile to get the user (reviewee)
  const profile = await Profile.findById(profileId);
  if (!profile)           throw new ApiError(404, 'Profile not found');
  if (!profile.isVisible) throw new ApiError(404, 'Profile not found');

  const revieweeId = profile.user;

  // Prevent self-review
  if (reviewerId.toString() === revieweeId.toString()) {
    throw new ApiError(400, 'You cannot review yourself');
  }

  // Check reviewee is actually a 'user' role
  const reviewee = await User.findById(revieweeId);
  if (!reviewee || reviewee.role !== 'user') {
    throw new ApiError(400, 'You can only review talent profiles');
  }

  // Check duplicate — one review per client per user
  const existing = await Review.findOne({ reviewer: reviewerId, reviewee: revieweeId });
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this profile. You can edit your existing review.');
  }

  const review = await Review.create({
    reviewer: reviewerId,
    reviewee: revieweeId,
    profile:  profileId,
    rating,
    comment,
  });

  // Recalculate profile rating
  await recalculateRating(profile._id);

  // Notify user of new review
try {
  const { createNotification } = require('../notifications/notification.service');
  const reviewer = await User.findById(reviewerId).select('name');
  await createNotification({
    recipientId:  revieweeId,
    type:         'review_received',
    templateArgs: [reviewer?.name || 'A client', rating],
    refModel:     'Review',
    refId:        review._id,
  });
} catch(e) { console.error('Notification error:', e.message); }

  return review;
};

// ── Get Reviews for a Profile ─────────────────────────────────────

const getProfileReviews = async (profileId, { page = 1, limit = 10, sortBy = 'newest' } = {}) => {
  const sort = sortBy === 'top_rated' ? { rating: -1 } : { createdAt: -1 };
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ profile: profileId, isVisible: true })
      .sort(sort)
      .skip(skip)
      .limit(+limit)
      .populate('reviewer', 'name') // show reviewer name
      .lean(),
    Review.countDocuments({ profile: profileId, isVisible: true }),
  ]);

  return {
    reviews,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
  };
};

// ── Get My Reviews (reviews I wrote as a client) ──────────────────

const getMyReviews = async (reviewerId) => {
  return await Review.find({ reviewer: reviewerId })
    .populate('reviewee', 'name')
    .populate('profile', 'fullName profileImage')
    .sort({ createdAt: -1 })
    .lean();
};

// ── Update Review ─────────────────────────────────────────────────

const updateReview = async (reviewId, reviewerId, { rating, comment }) => {
  const review = await Review.findOne({ _id: reviewId, reviewer: reviewerId });
  if (!review) throw new ApiError(404, 'Review not found or you do not own this review');

  if (rating !== undefined)  review.rating  = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  // Recalculate
  await recalculateRating(review.profile);

  return review;
};

// ── Delete Review ─────────────────────────────────────────────────

const deleteReview = async (reviewId, reviewerId) => {
  const review = await Review.findOne({ _id: reviewId, reviewer: reviewerId });
  if (!review) throw new ApiError(404, 'Review not found or you do not own this review');

  const profileId = review.profile;
  await review.deleteOne();

  // Recalculate
  await recalculateRating(profileId);
};

// ── Admin: hide/flag review ───────────────────────────────────────

const toggleReviewVisibility = async (reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  review.isVisible = !review.isVisible;
  await review.save();

  // Recalculate after hiding/showing
  await recalculateRating(review.profile);

  return review;
};

module.exports = {
  createReview,
  getProfileReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
};