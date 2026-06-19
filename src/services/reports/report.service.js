const Report = require('../../models/reports/report.model');
const Profile = require('../../models/profiles/profile.model');
const User = require('../../models/auth/auth.model');
const ApiError = require('../../utils/ApiError');

// ── File a report ─────────────────────────────────────────────────

const createReport = async (reporterId, { profileId, reason, description }) => {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new ApiError(404, 'Profile not found');

  // Cannot report yourself
  if (profile.user.toString() === reporterId.toString()) {
    throw new ApiError(400, 'You cannot report your own profile');
  }

  // One report per reporter per profile
  const existing = await Report.findOne({ reporter: reporterId, profile: profileId });
  if (existing) throw new ApiError(409, 'You have already reported this profile');

  const report = await Report.create({
    reporter:     reporterId,
    profile:      profileId,
    reportedUser: profile.user,
    reason,
    description,
  });

  return report;
};

// ── User: get own reports ─────────────────────────────────────────

const getMyReports = async (reporterId) => {
  return await Report.find({ reporter: reporterId })
    .populate('profile', 'fullName profileImage')
    .sort({ createdAt: -1 })
    .lean();
};

// ── Admin: get all reports ────────────────────────────────────────

const getAllReports = async ({ status, reason, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (reason) filter.reason = reason;

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(+limit)
      .populate('reporter',     'name email role')
      .populate('reportedUser', 'name email status')
      .populate('profile',      'fullName profileImage isVisible')
      .lean(),
    Report.countDocuments(filter),
  ]);

  return {
    reports,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
  };
};

// ── Admin: get single report detail ──────────────────────────────

const getReportById = async (reportId) => {
  const report = await Report.findById(reportId)
    .populate('reporter',     'name email role')
    .populate('reportedUser', 'name email status role')
    .populate('profile',      'fullName profileImage skills bio isVisible isVerified')
    .populate('resolvedBy',   'name email');

  if (!report) throw new ApiError(404, 'Report not found');
  return report;
};

// ── Admin: resolve a report ───────────────────────────────────────

const resolveReport = async (reportId, adminId, { status, adminNote, adminAction }) => {
  const report = await Report.findById(reportId);
  if (!report) throw new ApiError(404, 'Report not found');
  if (report.status === 'resolved') throw new ApiError(400, 'Report already resolved');

  report.status      = status;
  report.adminNote   = adminNote || null;
  report.adminAction = adminAction || 'none';
  report.resolvedBy  = adminId;
  report.resolvedAt  = new Date();
  await report.save();

  // Apply action automatically based on adminAction
  if (adminAction === 'profile_hidden') {
    await Profile.findOneAndUpdate({ user: report.reportedUser }, { isVisible: false });
  }

  if (adminAction === 'banned') {
    await User.findByIdAndUpdate(report.reportedUser, {
      status:    'banned',
      bannedAt:  new Date(),
      banReason: `Banned via report: ${report.reason}`,
    });
    await Profile.findOneAndUpdate({ user: report.reportedUser }, { isVisible: false });
  }

  if (adminAction === 'suspended') {
    await User.findByIdAndUpdate(report.reportedUser, { status: 'suspended' });
  }

  return report;
};

// ── Admin: report stats ───────────────────────────────────────────

const getReportStats = async () => {
  const [total, pending, reviewing, resolved, dismissed, byReason] = await Promise.all([
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'reviewing' }),
    Report.countDocuments({ status: 'resolved' }),
    Report.countDocuments({ status: 'dismissed' }),
    Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return { total, pending, reviewing, resolved, dismissed, byReason };
};

module.exports = {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  resolveReport,
  getReportStats,
};