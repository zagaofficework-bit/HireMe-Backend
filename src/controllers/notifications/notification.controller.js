const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../../services/notifications/notification.service');

// GET /api/v1/notifications
const getNotificationsController = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  const result = await getMyNotifications(req.user._id, { page, limit, unreadOnly });
  return res.status(200).json(new ApiResponse(200, result, 'Notifications fetched'));
});

// GET /api/v1/notifications/unread-count
const unreadCountController = asyncHandler(async (req, res) => {
  const result = await getUnreadCount(req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'Unread count fetched'));
});

// PATCH /api/v1/notifications/:id/read
const markReadController = asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, { notification }, 'Marked as read'));
});

// PATCH /api/v1/notifications/mark-all-read
const markAllReadController = asyncHandler(async (req, res) => {
  const result = await markAllAsRead(req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read'));
});

// DELETE /api/v1/notifications/:id
const deleteNotificationController = asyncHandler(async (req, res) => {
  await deleteNotification(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted'));
});

module.exports = {
  getNotificationsController,
  unreadCountController,
  markReadController,
  markAllReadController,
  deleteNotificationController,
};