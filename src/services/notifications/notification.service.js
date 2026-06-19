const Notification = require('../../models/notifications/notification.model');
const ApiError = require('../../utils/ApiError');

/**
 * Notification Service
 *
 * createNotification() is called from other services:
 *  - profile.service    → profile_viewed
 *  - bookmark.service   → profile_shortlisted
 *  - review.service     → review_received
 *  - admin.service      → account_banned, account_suspended, admin_warning
 *  - company.service    → company_verified, company_rejected
 *  - verification.service → verification_approved
 *
 * Never throws errors — notifications failing should never
 * break the main request.
 */

// ── Notification templates ────────────────────────────────────────
const TEMPLATES = {
  profile_viewed: (actorName) => ({
    title:   'Profile Viewed',
    message: `${actorName} viewed your profile`,
  }),
  profile_shortlisted: (actorName) => ({
    title:   'Profile Shortlisted',
    message: `${actorName} shortlisted your profile`,
  }),
  review_received: (actorName, rating) => ({
    title:   'New Review Received',
    message: `${actorName} gave you a ${rating}★ review`,
  }),
  account_banned: (reason) => ({
    title:   'Account Banned',
    message: `Your account has been banned. Reason: ${reason}`,
  }),
  account_suspended: () => ({
    title:   'Account Suspended',
    message: 'Your account has been suspended. Contact support.',
  }),
  account_unbanned: () => ({
    title:   'Account Restored',
    message: 'Your account has been restored. Welcome back!',
  }),
  verification_approved: () => ({
    title:   'Profile Verified ✓',
    message: 'Congratulations! Your profile has been verified.',
  }),
  verification_rejected: () => ({
    title:   'Verification Rejected',
    message: 'Your profile verification was rejected. Update your profile and try again.',
  }),
  company_verified: () => ({
    title:   'Company Verified ✓',
    message: 'Your company has been verified. You can now view contact details.',
  }),
  company_rejected: (reason) => ({
    title:   'Company Verification Rejected',
    message: `Your company verification was rejected. Reason: ${reason}`,
  }),
  report_resolved: () => ({
    title:   'Report Resolved',
    message: 'A report you filed has been reviewed and resolved by admin.',
  }),
  admin_warning: (message) => ({
    title:   'Admin Warning',
    message,
  }),
};

// ── Core create function ──────────────────────────────────────────

const createNotification = async ({
  recipientId,
  type,
  templateArgs = [],
  link = null,
  refModel = null,
  refId = null,
}) => {
  try {
    const template = TEMPLATES[type];
    if (!template) return;

    const { title, message } = template(...templateArgs);

    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link,
      refModel,
      refId,
    });
  } catch (err) {
    // Never crash main request for notification failure
    console.error('Notification creation failed:', err.message);
  }
};

// ── Query functions ───────────────────────────────────────────────

const getMyNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { recipient: userId };
  if (unreadOnly === 'true') filter.isRead = false;

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(+limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
  };
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id:       notificationId,
    recipient: userId,
  });
  if (!notification) throw new ApiError(404, 'Notification not found');

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  return { message: 'All notifications marked as read' };
};

const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOneAndDelete({
    _id:       notificationId,
    recipient: userId,
  });
  if (!notification) throw new ApiError(404, 'Notification not found');
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return { count };
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};