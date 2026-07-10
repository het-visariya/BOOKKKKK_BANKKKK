const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getStudentNotifications, markNotificationRead, createAdminNotification } = require('../controllers/notificationController');

const studentRouter = express.Router();
studentRouter.use(authMiddleware);
studentRouter.get('/', getStudentNotifications);
studentRouter.patch('/:id/read', markNotificationRead);

const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware);
adminRouter.post('/', createAdminNotification);

module.exports = { studentRouter, adminRouter };
