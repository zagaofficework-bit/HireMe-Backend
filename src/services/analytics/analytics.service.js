const Analytics = require('../../models/analytics/analytics.model');
const User = require('../../models/auth/auth.model');

/**
 * Analytics Service
 * 
 * Uses MongoDB aggregation pipelines for dashboard stats.
 * 
 * Aggregation pipeline = a series of steps that transform data.
 * Think of it like: filter → group → count → sort → return.
 * 
 * All queries run in parallel using Promise.all() 
 * so the dashboard loads in one round-trip.
 */

/**
 * Track an analytics event
 * Called from various controllers when events happen
 */
const trackEvent = async ({ event, actorId, actorRole, targetId, searchQuery, searchSkill, metadata }) => {
  try {
    await Analytics.create({
      event,
      actorId: actorId || null,
      actorRole: actorRole || 'guest',
      targetId: targetId || null,
      searchQuery,
      searchSkill,
      metadata: metadata || {},
    });
  } catch (err) {
    // Never let analytics errors break the main request
    console.error('Analytics tracking error:', err.message);
  }
};

/**
 * Admin Dashboard Stats
 * Returns all key platform metrics in one call
 */
const getAdminDashboardStats = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

  // Run all queries simultaneously for speed
  const [
    userCounts,
    newUsersLast30Days,
    newUsersLast7Days,
    profileViews30Days,
    topSearchedSkills,
    recentActivity,
  ] = await Promise.all([

    // ── User counts by role and status ────────────────────────────
    User.aggregate([
      {
        $group: {
          _id: { role: '$role', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]),

    // ── New registrations last 30 days ────────────────────────────
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

    // ── New registrations last 7 days ─────────────────────────────
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

    // ── Profile views in last 30 days ─────────────────────────────
    Analytics.countDocuments({
      event: 'profile_view',
      createdAt: { $gte: thirtyDaysAgo },
    }),

    // ── Top 10 most searched skills ───────────────────────────────
    Analytics.aggregate([
      { $match: { event: 'search', searchSkill: { $ne: null } } },
      { $group: { _id: '$searchSkill', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { skill: '$_id', count: 1, _id: 0 } },
    ]),

    // ── Registrations per day (last 7 days) ───────────────────────
    User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // ── Process userCounts into readable format ────────────────────
  const counts = {
    totalUsers: 0,
    totalClients: 0,
    totalAdmins: 0,
    activeUsers: 0,
    bannedUsers: 0,
    suspendedUsers: 0,
    pendingUsers: 0,
  };

  userCounts.forEach(({ _id, count }) => {
    if (_id.role === 'user')   counts.totalUsers   += count;
    if (_id.role === 'client') counts.totalClients += count;
    if (_id.role === 'admin')  counts.totalAdmins  += count;
    if (_id.status === 'active')    counts.activeUsers    += count;
    if (_id.status === 'banned')    counts.bannedUsers    += count;
    if (_id.status === 'suspended') counts.suspendedUsers += count;
    if (_id.status === 'pending')   counts.pendingUsers   += count;
  });

  counts.totalAccounts = counts.totalUsers + counts.totalClients + counts.totalAdmins;

  return {
    accounts: counts,
    growth: {
      newLast30Days: newUsersLast30Days,
      newLast7Days: newUsersLast7Days,
      dailyBreakdown: recentActivity,
    },
    engagement: {
      profileViews30Days,
      topSearchedSkills,
    },
  };
};

/**
 * Public Homepage Stats
 * Shown to visitors — no sensitive data
 */
const getHomepageStats = async () => {
  const [totalUsers, totalClients, totalProfileViews] = await Promise.all([
    User.countDocuments({ role: 'user', status: 'active' }),
    User.countDocuments({ role: 'client', status: 'active' }),
    Analytics.countDocuments({ event: 'profile_view' }),
  ]);

  return {
    totalTalents: totalUsers,
    totalHirers: totalClients,
    totalProfileViews,
    // Display-friendly rounded numbers
    displayStats: {
      talents: formatCount(totalUsers),
      hirers: formatCount(totalClients),
      views: formatCount(totalProfileViews),
    },
  };
};

// Helper: format 1234 → "1.2K", 1200000 → "1.2M"
const formatCount = (num) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M+`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K+`;
  return String(num);
};

module.exports = {
  trackEvent,
  getAdminDashboardStats,
  getHomepageStats,
};