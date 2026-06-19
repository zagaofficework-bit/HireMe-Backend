const router = require('express').Router();
const { protect } = require('../../middlewares/auth.middleware');
const {
  getNotificationsController,
  unreadCountController,
  markReadController,
  markAllReadController,
  deleteNotificationController,
} = require('../../controllers/notifications/notification.controller');

// All routes require login
router.use(protect);

router.get('/',                  getNotificationsController);
router.get('/unread-count',      unreadCountController);
router.patch('/mark-all-read',   markAllReadController);
router.patch('/:id/read',        markReadController);
router.delete('/:id',            deleteNotificationController);

module.exports = router;