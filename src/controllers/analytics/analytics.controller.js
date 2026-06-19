const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { getAdminDashboardStats, getHomepageStats } = require('../../services/analytics/analytics.service');

/**
 * GET /api/v1/analytics/admin/dashboard
 * Admin only — full platform stats
 */
const adminDashboard = asyncHandler(async (req, res) => {
  const stats = await getAdminDashboardStats();
  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Dashboard stats fetched'));
});

/**
 * GET /api/v1/analytics/homepage
 * Public — safe stats for landing page
 */
const homepageStats = asyncHandler(async (req, res) => {
  const stats = await getHomepageStats();
  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Homepage stats fetched'));
});

module.exports = { adminDashboard, homepageStats };