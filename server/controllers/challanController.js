const { generateChallan } = require('../services/challanService');
const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');

const createChallan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    const {
      requestId,
      collectionDate,
      collectionTime,
      collectionLocation,
      adminName,
    } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }

    const request = await Request.findById(requestId).populate('userId', '-passwordHash');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!isAdmin && String(request.userId?._id ?? request.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (['Rejected', 'Returned', 'Procured'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot generate challan for a request in status ${request.status}`,
      });
    }

    if (request.status !== 'Approved') {
      request.status = 'Approved';
      await request.save();
    }

    const targetUserId = String(request.userId?._id ?? request.userId);
    const result = await generateChallan(requestId, targetUserId, {
      collectionDate,
      collectionTime,
      collectionLocation,
      adminName,
    });

    // create a notification for the student that challan was generated
    try {
      const student = request.userId;
      if (student && student._id) {
        const title = `Challan generated for request ${requestId}`;
        const message = `Your challan for request ${requestId} is ready.`;
        // Make the notification actionable by linking to the challan page
        const actionUrl = `/student/challan/${requestId}`;
        await Notification.create({ studentId: student._id, title, message, type: 'challan', actionUrl });
      }
    } catch (e) {
      console.error('[Notifications] Failed to create challan notification:', e);
    }
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Challan] CreateChallan error:', err);
    const status =
      err.message === 'Unauthorized'
        ? 403
        : err.message === 'Request not found'
        ? 404
        : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const getChallan = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId).populate('userId').populate('selectedBookIds');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    const user = request.userId;
    const challanData = request.challanData
      ? JSON.parse(request.challanData)
      : {
          requestId: String(request._id),
          studentId: user.studentId,
          studentName: user.name,
          course: user.course,
          email: user.email,
          phone: user.phone || '',
          profilePhoto: user.profilePhoto || null,
          membershipStatus: user.membershipStatus,
          selectedBooks: request.selectedBooks,
          requestedBooks: request.requestedBooks,
          status: request.status,
          generatedAt: request.updatedAt,
        };

    return res.json({ success: true, challanData, request });
  } catch (err) {
    console.error('[Challan] GetChallan error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createChallan, getChallan };
