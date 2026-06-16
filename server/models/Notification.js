const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, trim: true, default: 'general' },
    title: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    actionUrl: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Notification', notificationSchema);
