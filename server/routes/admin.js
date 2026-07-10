const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getUsers,
  getRequests,
  getAnalytics,
  getReturnTimeline,
  getManualBooksToPurchase,
} = require('../controllers/adminController');
const Request = require('../models/Request');
const Book = require('../models/Book');
const Notification = require('../models/Notification');

router.use(authMiddleware, adminMiddleware);

router.get('/users', getUsers);
router.get('/requests', getRequests);
router.get('/manual-books', getManualBooksToPurchase);
router.get('/analytics', getAnalytics);
router.get('/return-timeline', getReturnTimeline);

// Admin: update request status (used by useMarkBookReturned and useUpdateRequestStatus)
router.patch('/requests/:id/status', async (req, res) => {
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
    ).populate('userId', '-passwordHash').populate('selectedBookIds');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // create notification for the student about status change
    try {
      const student = request.userId;
      const title = `Request ${String(request._id)} — ${status}`;
      const message = `Your request ${String(request._id)} status changed to ${status}.`;
      if (student && student._id) {
        const actionUrl = `/student/challan/${String(request._id)}`;
        await Notification.create({ studentId: student._id, title, message, type: 'request', actionUrl });
      }
    } catch (e) {
      console.error('[Notifications] Failed to create notification on admin status update:', e);
    }

    return res.json({ success: true, request });
  } catch (err) {
    console.error('[Admin] UpdateRequestStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update per-book decision (approve/reject/etc. for individual books)
router.patch('/requests/:id/book-decision', async (req, res) => {
  try {
    const { bookId, decision, isManualBook, bookIndex } = req.body;
    const rawDecision = String(decision ?? '').trim();
    const normalizedDecision = rawDecision.toLowerCase();
    const decisionMap = {
      pending: 'Pending',
      requested: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      reserved: 'Reserved',
      acceptreservation: 'Reserved',
      accept_reservation: 'Reserved',
      ordered: 'Ordered',
      arrived: 'Arrived',
      'reached office': 'Arrived',
      reachedoffice: 'Arrived',
      readyforcollection: 'ReadyForCollection',
      ready_for_collection: 'ReadyForCollection',
      issued: 'Issued',
      collected: 'Issued',
      returned: 'Returned',
      procured: 'Procured',
      specialorder: 'SpecialOrder',
    };
    const canonicalDecision = decisionMap[normalizedDecision];
    if (!canonicalDecision) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (isManualBook && typeof bookIndex === 'number') {
      // Update decision for manual/requested book
      if (request.requestedBooks[bookIndex]) {
        request.requestedBooks[bookIndex].decision = canonicalDecision;
      }
    } else if (typeof bookId === 'string' && bookId.trim() !== '') {
      // Update decision for inventory book (selectedBooks)
      const idx = Array.isArray(request.selectedBookIds)
        ? request.selectedBookIds.findIndex((id) => String(id) === String(bookId))
        : -1;
      if (idx >= 0 && request.selectedBooks[idx]) {
        request.selectedBooks[idx].decision = canonicalDecision;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Missing bookId or manual book index' });
    }

    await request.save();
    // create notification to student about per-book decision
    try {
      const student = request.userId;
      const title = `Request ${String(request._id)} — Book decision updated`;
      const message = `A decision was made on one of the books in your request ${String(request._id)}.`;
      if (student && student._id) {
        const actionUrl = `/student/challan/${String(request._id)}`;
        await Notification.create({ studentId: student._id, title, message, type: 'request', actionUrl });
      }
    } catch (e) {
      console.error('[Notifications] Failed to create notification for book decision:', e);
    }
    return res.json({ success: true, request: await request.populate('selectedBookIds') });
  } catch (err) {
    console.error('[Admin] UpdateBookDecision error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: set return date for a request
router.patch('/requests/:id/return-date', async (req, res) => {
  try {
    const { returnDate } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    // Update returnDate on all selectedBooks in the request
    request.selectedBooks = request.selectedBooks.map(b => ({ ...b, returnDate: new Date(returnDate) }));
    await request.save();
    return res.json({ success: true, request });
  } catch (err) {
    console.error('[Admin] SetReturnDate error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: seed/bulk books
router.post('/books/seed', async (req, res) => {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: 'books array required' });
    }
    const inserted = await Book.insertMany(books, { ordered: false });
    return res.json({ success: true, inserted: inserted.length });
  } catch (err) {
    console.error('[Admin] SeedBooks error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
