const Profile = require('../../models/profiles/profile.model');
const User = require('../../models/auth/auth.model');
const ApiError = require('../../utils/ApiError');
const { refreshProfileCount } = require('../categories/category.service');

const calculateCompletion = (profile) => {
  const checks = [
    !!profile.fullName,
    !!profile.bio,
    !!profile.profileImage?.url,
    profile.skills?.length > 0,
    profile.experience?.length > 0,
    profile.education?.length > 0,
    profile.languages?.length > 0,
    !!profile.workType,
    !!profile.jobType,
    !!profile.location?.city,
    !!profile.contact?.email || !!profile.contact?.phone,
    !!profile.resume?.url,
    !!profile.category,
    !!profile.social?.linkedin || !!profile.social?.github,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const createProfile = async (userId, data) => {
  const existing = await Profile.findOne({ user: userId });
  if (existing) throw new ApiError(409, 'Profile already exists');

  const profile = await Profile.create({ user: userId, ...data });
  profile.completionPercentage = calculateCompletion(profile);
  await profile.save();

  if (profile.category) await refreshProfileCount(profile.category);
  await User.findByIdAndUpdate(userId, { isProfileComplete: profile.completionPercentage === 100 });

  return profile;
};

const getMyProfile = async (userId) => {
  const profile = await Profile.findOne({ user: userId })
    .populate('user', 'name email phone role status isEmailVerified isPhoneVerified')
    .populate('category', 'name slug icon');
  if (!profile) throw new ApiError(404, 'Profile not found. Please create your profile first.');
  return profile;
};

const getPublicProfile = async (profileId, viewerUser) => {
  const profile = await Profile.findById(profileId)
    .populate('user', 'name createdAt')
    .populate('category', 'name slug icon');

  if (!profile)           throw new ApiError(404, 'Profile not found');
  if (!profile.isVisible) throw new ApiError(403, 'This profile is not public');

  const profileObj = profile.toObject();

  // Check if viewer is a verified client
  let canSeeContact = false;
  if (viewerUser?.role === 'admin') {
    canSeeContact = true;
  } else if (viewerUser?.role === 'client' && viewerUser?.status === 'active') {
    // Lazy-load to avoid circular dependency
    const { isClientVerified } = require('../company/company.service');
    canSeeContact = await isClientVerified(viewerUser._id);
  }

  if (!canSeeContact) delete profileObj.contact;

  return { ...profileObj, canSeeContact };
};

const updateSection = async (userId, sectionData) => {
  const profile = await Profile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Profile not found. Create your profile first.');

  const oldCategory = profile.category?.toString();
  Object.assign(profile, sectionData);
  profile.completionPercentage = calculateCompletion(profile);
  await profile.save();

  const newCategory = profile.category?.toString();
  if (oldCategory && oldCategory !== newCategory) await refreshProfileCount(oldCategory);
  if (newCategory) await refreshProfileCount(newCategory);

  await User.findByIdAndUpdate(userId, { isProfileComplete: profile.completionPercentage === 100 });

  return profile;
};

const toggleVisibility = async (userId) => {
  const profile = await Profile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Profile not found');
  profile.isVisible = !profile.isVisible;
  await profile.save();
  return { isVisible: profile.isVisible };
};

const incrementProfileView = async (profileId) => {
  await Profile.findByIdAndUpdate(profileId, { $inc: { totalViews: 1 } });
};

const deleteProfile = async (userId) => {
  const profile = await Profile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Profile not found');
  profile.isVisible = false;
  await profile.save();
  await User.findByIdAndUpdate(userId, { isProfileComplete: false });
};

module.exports = {
  createProfile,
  getMyProfile,
  getPublicProfile,
  updateSection,
  toggleVisibility,
  incrementProfileView,
  deleteProfile,
  calculateCompletion,
};