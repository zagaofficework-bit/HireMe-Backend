const User = require('../../models/auth/auth.model');
const Profile = require('../../models/profiles/profile.model');
const Company = require('../../models/company/company.model');
const ApiError = require('../../utils/ApiError');

// ── User Management ───────────────────────────────────────────────

const getAllUsers = async ({ role, status, page = 1, limit = 20, search } = {}) => {
  const filter = {};
  if (role)   filter.role   = role;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
    User.countDocuments(filter),
  ]);

  return { users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

const getUserDetail = async (userId) => {
  const [user, profile, company] = await Promise.all([
    User.findById(userId),
    Profile.findOne({ user: userId }).populate('category', 'name'),
    Company.findOne({ client: userId }),
  ]);
  if (!user) throw new ApiError(404, 'User not found');
  return { user, profile, company };
};

const banUser = async (userId, adminId, banReason) => {
  const user = await User.findById(userId);
  if (!user)                   throw new ApiError(404, 'User not found');
  if (user.role === 'admin')   throw new ApiError(403, 'Cannot ban another admin');
  if (user.status === 'banned') throw new ApiError(400, 'User is already banned');

  user.status    = 'banned';
  user.bannedAt  = new Date();
  user.banReason = banReason;
  await user.save();

  // Hide their profile from search
  await Profile.findOneAndUpdate({ user: userId }, { isVisible: false });

  return user;
};

const unbanUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user)                    throw new ApiError(404, 'User not found');
  if (user.status !== 'banned') throw new ApiError(400, 'User is not banned');

  user.status    = 'active';
  user.bannedAt  = undefined;
  user.banReason = undefined;
  await user.save();

  return user;
};

const suspendUser = async (userId, adminId, reason) => {
  const user = await User.findById(userId);
  if (!user)                 throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot suspend another admin');

  user.status = 'suspended';
  await user.save();

  return user;
};

const unsuspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  user.status = 'active';
  await user.save();
  return user;
};

// ── Profile Management ────────────────────────────────────────────

const featureProfile = async (profileId, isFeatured) => {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { isFeatured },
    { new: true }
  );
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};

const verifyProfile = async (profileId, isVerified) => {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { isVerified },
    { new: true }
  );
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};

const deleteProfile = async (profileId) => {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { isVisible: false },
    { new: true }
  );
  if (!profile) throw new ApiError(404, 'Profile not found');
  return profile;
};

// ── Platform Overview ─────────────────────────────────────────────

const getPlatformOverview = async () => {
  const [
    totalUsers,
    totalClients,
    totalAdmins,
    activeUsers,
    bannedUsers,
    suspendedUsers,
    totalProfiles,
    verifiedProfiles,
    featuredProfiles,
    totalCompanies,
    verifiedCompanies,
    pendingCompanies,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'banned' }),
    User.countDocuments({ status: 'suspended' }),
    Profile.countDocuments(),
    Profile.countDocuments({ isVerified: true }),
    Profile.countDocuments({ isFeatured: true }),
    Company.countDocuments(),
    Company.countDocuments({ verificationStatus: 'verified' }),
    Company.countDocuments({ verificationStatus: 'pending' }),
  ]);

  return {
    users:    { total: totalUsers,   active: activeUsers, banned: bannedUsers, suspended: suspendedUsers },
    clients:  { total: totalClients },
    admins:   { total: totalAdmins },
    profiles: { total: totalProfiles, verified: verifiedProfiles, featured: featuredProfiles },
    companies:{ total: totalCompanies, verified: verifiedCompanies, pending: pendingCompanies },
  };
};

module.exports = {
  getAllUsers,
  getUserDetail,
  banUser,
  unbanUser,
  suspendUser,
  unsuspendUser,
  featureProfile,
  verifyProfile,
  deleteProfile,
  getPlatformOverview,
};