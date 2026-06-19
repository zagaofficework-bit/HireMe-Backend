const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  resolveReport,
  getReportStats,
} = require('../../services/reports/report.service');

// POST /api/v1/reports
const createReportController = asyncHandler(async (req, res) => {
  const report = await createReport(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, { report }, 'Report submitted successfully'));
});

// GET /api/v1/reports/my
const getMyReportsController = asyncHandler(async (req, res) => {
  const reports = await getMyReports(req.user._id);
  return res.status(200).json(new ApiResponse(200, { reports }, 'Your reports fetched'));
});

// GET /api/v1/reports/admin
const getAllReportsController = asyncHandler(async (req, res) => {
  const { status, reason, page, limit } = req.query;
  const result = await getAllReports({ status, reason, page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Reports fetched'));
});

// GET /api/v1/reports/admin/stats
const getStatsController = asyncHandler(async (req, res) => {
  const stats = await getReportStats();
  return res.status(200).json(new ApiResponse(200, { stats }, 'Report stats fetched'));
});

// GET /api/v1/reports/admin/:id
const getReportController = asyncHandler(async (req, res) => {
  const report = await getReportById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { report }, 'Report fetched'));
});

// PATCH /api/v1/reports/admin/:id/resolve
const resolveReportController = asyncHandler(async (req, res) => {
  const report = await resolveReport(req.params.id, req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, { report }, 'Report resolved'));
});

module.exports = {
  createReportController,
  getMyReportsController,
  getAllReportsController,
  getStatsController,
  getReportController,
  resolveReportController,
};