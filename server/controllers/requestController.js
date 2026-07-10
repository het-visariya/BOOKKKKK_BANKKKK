const { createRequest } = require('../services/requestService');
const Request = require('../models/Request');
const Notification = require('../models/Notification');

const submitRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { selectedBookIds = [], requestedBooks = [] } = req.body;

    const request = await createRequest(userId, selectedBookIds, requestedBooks);
    return res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('[Requests] SubmitRequest error:', err);
    const status = err.message === 'Membership payment required' ? 403 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await Request.find({ userId })
      .populate('selectedBookIds')
      .sort({ createdAt: -1 });
    return res.json({ success: true, requests });
  } catch (err) {
    console.error('[Requests] GetMyRequests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('selectedBookIds');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Only owner or admin can view
    if (req.user.role !== 'admin' && String(request.userId) !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({ success: true, request });
  } catch (err) {
    console.error('[Requests] GetRequestById error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Approved', 'Procured', 'Rejected', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', '-passwordHash');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Create notification for the student
    try {
      const student = request.userId;
      const title = `Request ${String(request._id)} — ${status}`;
      const message = `Your request ${String(request._id)} status changed to ${status}.`;
      if (student && student._id) {
        const actionUrl = `/student/challan/${String(request._id)}`;
        await Notification.create({ studentId: student._id, title, message, type: 'request', actionUrl });
      }
    } catch (e) {
      console.error('[Notifications] Failed to create notification for status change:', e);
    }

    return res.json({ success: true, request });
  } catch (err) {
    console.error('[Requests] UpdateRequestStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { submitRequest, getMyRequests, getRequestById, updateRequestStatus };
