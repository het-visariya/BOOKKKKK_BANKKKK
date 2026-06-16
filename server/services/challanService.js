const QRCode = require('qrcode');
const Request = require('../models/Request');
const User = require('../models/User');

const generateChallan = async (requestId, userId) => {
  const request = await Request.findById(requestId);
  if (!request) throw new Error('Request not found');
  if (String(request.userId) !== String(userId)) throw new Error('Unauthorized');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const challanData = {
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
    generatedAt: new Date().toISOString(),
  };

  // QR code encodes the challan URL (frontend route)
  const qrUrl = `/challan/${requestId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 256, margin: 2 });

  request.challanData = JSON.stringify(challanData);
  request.challanGenerated = true;
  await request.save();

  return { challanData, qrCodeDataUrl, requestId: String(request._id) };
};

module.exports = { generateChallan };
