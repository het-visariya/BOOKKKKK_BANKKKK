const { generateChallan } = require('../services/challanService');
const Request = require('../models/Request');
const User = require('../models/User');

const createChallan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }

    const result = await generateChallan(requestId, userId);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Challan] CreateChallan error:', err);
    const status = err.message === 'Unauthorized' ? 403 : err.message === 'Request not found' ? 404 : 500;
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
