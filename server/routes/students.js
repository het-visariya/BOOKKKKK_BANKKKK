const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Request = require('../models/Request');

// GET /api/students/:userId — Public route for QR scan page
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Try by studentId first, then by MongoDB _id
    let user = await User.findOne({ studentId: userId }).select('-passwordHash');
    if (!user) {
      user = await User.findById(userId).select('-passwordHash').catch(() => null);
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch issued requests to populate book details
    const requests = await Request.find({
      userId: user._id,
      status: { $in: ['Approved', 'Procured', 'Returned'] },
    }).populate('selectedBookIds', 'title author edition publisher category');

    const issuedBooks = requests.flatMap((r) =>
      (r.selectedBooks || []).map((book) => ({
        bookTitle: book.title,
        bookAuthor: book.author || '',
        issueDate: book.issueDate || r.createdAt,
        returnDate: book.returnDate || null,
        returned: book.returned || r.status === 'Returned',
        status: r.status,
      }))
    );

    const publicUser = {
      _id: String(user._id),
      name: user.name,
      studentId: user.studentId,
      course: user.course,
      college: user.college,
      membershipStatus: user.membershipStatus,
      profilePhoto: user.profilePhoto || null,
      issuedBooks,
    };

    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('[Students] GetStudent error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
