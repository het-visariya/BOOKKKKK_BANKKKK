const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionUrl: { type: String, default: null },
    type: { type: String, default: 'info' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ studentId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
