const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
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
} = require('../../services/admin/admin.service');

// GET /api/v1/admin/overview
const overviewController = asyncHandler(async (req, res) => {
  const data = await getPlatformOverview();
  return res.status(200).json(new ApiResponse(200, data, 'Platform overview fetched'));
});

// GET /api/v1/admin/users
const getUsersController = asyncHandler(async (req, res) => {
  const { role, status, page, limit, search } = req.query;
  const data = await getAllUsers({ role, status, page: +page || 1, limit: +limit || 20, search });
  return res.status(200).json(new ApiResponse(200, data, 'Users fetched'));
});

// GET /api/v1/admin/users/:id
const getUserDetailController = asyncHandler(async (req, res) => {
  const data = await getUserDetail(req.params.id);
  return res.status(200).json(new ApiResponse(200, data, 'User detail fetched'));
});

// PATCH /api/v1/admin/users/:id/ban
const banUserController = asyncHandler(async (req, res) => {
  const user = await banUser(req.params.id, req.user._id, req.body.banReason);
  return res.status(200).json(new ApiResponse(200, { user }, 'User banned'));
});

// PATCH /api/v1/admin/users/:id/unban
const unbanUserController = asyncHandler(async (req, res) => {
  const user = await unbanUser(req.params.id);
  return res.status(200).json(new ApiResponse(200, { user }, 'User unbanned'));
});

// PATCH /api/v1/admin/users/:id/suspend
const suspendUserController = asyncHandler(async (req, res) => {
  const user = await suspendUser(req.params.id, req.user._id, req.body.reason);
  return res.status(200).json(new ApiResponse(200, { user }, 'User suspended'));
});

// PATCH /api/v1/admin/users/:id/unsuspend
const unsuspendUserController = asyncHandler(async (req, res) => {
  const user = await unsuspendUser(req.params.id);
  return res.status(200).json(new ApiResponse(200, { user }, 'User unsuspended'));
});

// PATCH /api/v1/admin/profiles/:id/feature
const featureProfileController = asyncHandler(async (req, res) => {
  const profile = await featureProfile(req.params.id, req.body.isFeatured);
  const msg = req.body.isFeatured ? 'Profile featured on homepage' : 'Profile removed from homepage';
  return res.status(200).json(new ApiResponse(200, { profile }, msg));
});

// PATCH /api/v1/admin/profiles/:id/verify
const verifyProfileController = asyncHandler(async (req, res) => {
  const profile = await verifyProfile(req.params.id, req.body.isVerified);
  const msg = req.body.isVerified ? 'Profile verified' : 'Profile verification removed';
  return res.status(200).json(new ApiResponse(200, { profile }, msg));
});

// DELETE /api/v1/admin/profiles/:id
const deleteProfileController = asyncHandler(async (req, res) => {
  await deleteProfile(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Profile hidden by admin'));
});

module.exports = {
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
};