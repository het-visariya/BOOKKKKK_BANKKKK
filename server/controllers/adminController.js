const User = require('../models/User');
const Request = require('../models/Request');
const Book = require('../models/Book');

const getUsers = async (req, res) => {
  try {
    const { search, membershipStatus, course } = req.query;
    const filter = { role: 'student' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    if (membershipStatus) filter.membershipStatus = membershipStatus;
    if (course) filter.course = course;

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.json({ success: true, users });
  } catch (err) {
    console.error('[Admin] GetUsers error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const { status, search, course } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (course) filter.studentCourse = course;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const requests = await Request.find(filter)
      .populate('userId', '-passwordHash')
      .populate('selectedBookIds')
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests });
  } catch (err) {
    console.error('[Admin] GetRequests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const canonicalizeDecision = (decision) => {
  const raw = String(decision ?? '').trim();
  const normalized = raw.toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'requested':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'reserved':
    case 'acceptreservation':
    case 'accept_reservation':
      return 'Reserved';
    case 'ordered':
      return 'Ordered';
    case 'arrived':
    case 'reachedoffice':
    case 'reached office':
      return 'Arrived';
    case 'readyforcollection':
    case 'ready_for_collection':
      return 'ReadyForCollection';
    case 'issued':
    case 'collected':
      return 'Issued';
    case 'returned':
      return 'Returned';
    case 'procured':
      return 'Procured';
    case 'specialorder':
      return 'SpecialOrder';
    default:
      return raw || 'Pending';
  }
};

const getManualBooksToPurchase = async (req, res) => {
  try {
    const requests = await Request.find({ 'requestedBooks.0': { $exists: true } })
      .populate('userId', '-passwordHash')
      .sort({ createdAt: -1 });

    const manualBooks = [];

    for (const request of requests) {
      const student = request.userId || {};
      const base = {
        requestId: String(request._id),
        studentId: String(request.studentId ?? student.studentId ?? ''),
        studentName: String(request.studentName ?? student.name ?? ''),
        studentCourse: String(request.studentCourse ?? student.course ?? ''),
        studentYear: String(request.studentYear ?? ''),
        studentPhone: String(request.studentPhone ?? student.phone ?? ''),
        collectionDate: '',
        collectionTime: '',
        collectionLocation: '',
        requestNumber: String(request._id),
      };

      if (Array.isArray(request.requestedBooks)) {
        request.requestedBooks.forEach((book, index) => {
          const status = canonicalizeDecision(book.decision);
          if (!status || status === 'Rejected' || status === 'Pending') return;
          manualBooks.push({
            ...base,
            manualIndex: index,
            procurement: {
              id: `${String(request._id)}:${index}`,
              bookTitle: String(book.title ?? ''),
              author: String(book.author ?? ''),
              edition: String(book.edition ?? ''),
              publisher: String(book.publisher ?? ''),
              status,
              isPurchased: Boolean(book.isPurchased),
              purchaseBatchId: String(book.purchaseBatchId ?? ''),
              purchasePdfUrl: String(book.purchasePdfUrl ?? ''),
            },
          });
        });
      }
    }

    return res.json({ success: true, manualBooks });
  } catch (err) {
    console.error('[Admin] GetManualBooksToPurchase error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const [totalStudents, totalPaidStudents, totalBooks, totalRequests, pendingRequests, approvedRequests] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'student', membershipStatus: 'PAID' }),
        Book.countDocuments(),
        Request.countDocuments(),
        Request.countDocuments({ status: 'Pending' }),
        Request.countDocuments({ status: { $in: ['Approved', 'Procured'] } }),
      ]);

    // Count total issued books across all users
    const usersWithBooks = await User.find({ 'issuedBooks.0': { $exists: true } }, 'issuedBooks');
    const totalBooksIssued = usersWithBooks.reduce((sum, u) => sum + u.issuedBooks.length, 0);

    return res.json({
      success: true,
      analytics: {
        totalStudents,
        totalPaidStudents,
        totalBooks,
        totalRequests,
        pendingRequests,
        approvedRequests,
        totalBooksIssued,
      },
    });
  } catch (err) {
    console.error('[Admin] GetAnalytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getReturnTimeline = async (req, res) => {
  try {
    const requests = await Request.find({ status: { $in: ['Approved', 'Procured'] } })
      .populate('userId', 'name email studentId course profilePhoto')
      .sort({ createdAt: -1 });

    const now = new Date();
    const timeline = [];

    for (const req of requests) {
      for (const book of req.selectedBooks) {
        if (!book.returned && book.returnDate) {
          const daysRemaining = Math.ceil((new Date(book.returnDate) - now) / (1000 * 60 * 60 * 24));
          let urgency = 'green';
          if (daysRemaining <= 2) urgency = 'red';
          else if (daysRemaining <= 5) urgency = 'yellow';

          const student = req.userId;
          timeline.push({
            requestId: String(req._id),
            bookId: String(book.bookId || ''),
            studentName: student ? student.name : 'Unknown',
            studentId: student ? (student.studentId || String(student._id)) : '',
            studentEmail: student ? student.email : '',
            bookTitle: book.title,
            bookAuthor: book.author,
            issueDate: book.issueDate,
            returnDate: book.returnDate,
            daysRemaining,
            urgency,
          });
        }
      }
    }

    timeline.sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));

    return res.json({ success: true, timeline });
  } catch (err) {
    console.error('[Admin] GetReturnTimeline error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, getRequests, getAnalytics, getReturnTimeline, getManualBooksToPurchase };
