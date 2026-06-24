const Notification = require('../models/Notification');
const Request = require('../models/Request');

const getStudentNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifs = await Notification.find({ studentId: userId }).sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, notifications: notifs });
  } catch (err) {
    console.error('[Notifications] GetStudentNotifications error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifId = req.params.id;
    const notif = await Notification.findOneAndUpdate({ _id: notifId, studentId: userId }, { isRead: true }, { new: true });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    return res.json({ success: true, notification: notif });
  } catch (err) {
    console.error('[Notifications] MarkRead error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createAdminNotification = async (req, res) => {
  try {
    const { studentId, title, message, type, actionUrl } = req.body;
    if (!studentId || !title || !message) return res.status(400).json({ success: false, message: 'studentId, title, message required' });
    const notif = await Notification.create({ studentId, title, message, type: type || 'info', actionUrl: actionUrl ?? null });
    return res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    console.error('[Notifications] CreateAdminNotification error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStudentNotifications, markNotificationRead, createAdminNotification };
