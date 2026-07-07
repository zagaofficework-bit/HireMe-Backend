const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { trackEvent } = require('../../services/analytics/analytics.service');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../middlewares/upload.middleware');
const {
  createProfile,
  getMyProfile,
  getPublicProfile,
  updateSection,
  toggleVisibility,
  incrementProfileView,
  deleteProfile,
  submitForApproval,
} = require('../../services/profiles/profile.service');

/**
 * POST /api/v1/profiles
 * User creates their profile (first time, after registration)
 */
const createProfileController = asyncHandler(async (req, res) => {
  const profile = await createProfile(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { profile }, 'Profile created successfully'));
});

/**
 * GET /api/v1/profiles/me
 * Logged-in user sees their own full profile
 */
const getMyProfileController = asyncHandler(async (req, res) => {
  const profile = await getMyProfile(req.user._id);
  return res.status(200).json(new ApiResponse(200, { profile }, 'Profile fetched'));
});

/**
 * GET /api/v1/profiles/:id
 * Public profile view — contact hidden unless verified client
 */
const getPublicProfileController = asyncHandler(async (req, res) => {
  const profile = await getPublicProfile(req.params.id, req.user);

  // Track the view
  await trackEvent({
    event: 'profile_view',
    actorId:   req.user?._id || null,
    actorRole: req.user?.role || 'guest',
    targetId:  profile._id,
  });

  // Increment view counter on profile
  await incrementProfileView(req.params.id);

  return res.status(200).json(new ApiResponse(200, { profile }, 'Profile fetched'));
});

/**
 * PATCH /api/v1/profiles/me/basic
 * Update basic info — name, bio, age, gender, category
 */
const updateBasicController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Basic info updated'));
});

/**
 * PATCH /api/v1/profiles/me/skills
 */
const updateSkillsController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { skills: req.body.skills });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Skills updated'));
});

/**
 * PATCH /api/v1/profiles/me/experience
 */
const updateExperienceController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { experience: req.body.experience });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Experience updated'));
});

/**
 * PATCH /api/v1/profiles/me/education
 */
const updateEducationController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { education: req.body.education });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Education updated'));
});

/**
 * PATCH /api/v1/profiles/me/preferences
 */
const updatePreferencesController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Preferences updated'));
});

/**
 * PATCH /api/v1/profiles/me/location
 */
const updateLocationController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { location: req.body.location });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Location updated'));
});

/**
 * PATCH /api/v1/profiles/me/social
 */
const updateSocialController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { social: req.body.social });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Social links updated'));
});

/**
 * PATCH /api/v1/profiles/me/contact
 */
const updateContactController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { contact: req.body.contact });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Contact details updated'));
});

/**
 * PATCH /api/v1/profiles/me/languages
 */
const updateLanguagesController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { languages: req.body.languages });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Languages updated'));
});

/**
 * PATCH /api/v1/profiles/me/photo
 * Upload/replace profile photo — multipart, handled by uploadProfileImage middleware (req.file)
 */
const updateProfileImageController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  // Need the existing profile to know if there's an old image to delete
  const existingProfile = await getMyProfile(req.user._id);
  const oldPublicId = existingProfile.profileImage?.publicId;

  // Upload new image first, so we never lose the old one if this fails
  const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'hireme/profiles');

  const profile = await updateSection(req.user._id, {
    profileImage: { url, publicId },
  });

  // Delete old image from Cloudinary (best-effort, after the new one is safely saved)
  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId, 'image');
  }

  return res.status(200).json(
    new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Profile photo updated successfully')
  );
});

/**
 * PATCH /api/v1/profiles/me/visibility
 * Toggle profile on/off from public search
 */
const toggleVisibilityController = asyncHandler(async (req, res) => {
  const result = await toggleVisibility(req.user._id);
  return res.status(200).json(new ApiResponse(200, result, `Profile is now ${result.isVisible ? 'visible' : 'hidden'}`));
});

/**
 * PATCH /api/v1/profiles/me/certifications
 */
const updateCertificationsController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { certifications: req.body.certifications });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Certifications updated'));
});

/**
 * PATCH /api/v1/profiles/me/portfolio
 * "Projects" in the UI — stored as `portfolio` on the backend model.
 */
const updatePortfolioController = asyncHandler(async (req, res) => {
  const profile = await updateSection(req.user._id, { portfolio: req.body.portfolio });
  return res.status(200).json(new ApiResponse(200, { profile, completion: profile.completionPercentage }, 'Projects updated'));
});

/**
 * POST /api/v1/profiles/me/submit-for-approval
 * Moves profile.approvalStatus from draft/rejected → pending.
 */
const submitForApprovalController = asyncHandler(async (req, res) => {
  const profile = await submitForApproval(req.user._id);
  return res.status(200).json(new ApiResponse(200, { profile }, 'Profile submitted for admin approval'));
});

/**
 * DELETE /api/v1/profiles/me
 * Hides the profile (soft delete)
 */
const deleteProfileController = asyncHandler(async (req, res) => {
  await deleteProfile(req.user._id);
  return res.status(200).json(new ApiResponse(200, {}, 'Profile hidden successfully'));
});

module.exports = {
  createProfileController,
  getMyProfileController,
  getPublicProfileController,
  updateBasicController,
  updateSkillsController,
  updateExperienceController,
  updateEducationController,
  updatePreferencesController,
  updateLocationController,
  updateSocialController,
  updateContactController,
  updateLanguagesController,
  updateCertificationsController,
  updatePortfolioController,
  updateProfileImageController,
  toggleVisibilityController,
  submitForApprovalController,
  deleteProfileController
};