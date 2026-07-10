const mongoose = require('mongoose');

const selectedBookSchema = new mongoose.Schema(
  {
    title: String,
    author: String,
    edition: String,
    publisher: String,
    issueDate: Date,
    returnDate: Date,
    returned: { type: Boolean, default: false },
    decision: { type: String, default: null }, // Track per-book decision: 'approved', 'rejected', 'reserved', etc.
  },
  { _id: false }
);

const requestedBookSchema = new mongoose.Schema(
  {
    title: String,
    author: String,
    edition: String,
    publisher: String,
    note: String,
    decision: { type: String, default: null }, // Track per-book decision for manual requests
    isPurchased: { type: Boolean, default: false }, // Track procurement completion
    purchasedAt: Date, // Timestamp when included in procurement batch
    purchaseBatchId: String, // Reference to PurchaseBatch
    purchasePdfUrl: String, // URL/path to generated PDF
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String },
    studentEmail: { type: String },
    studentCourse: { type: String },
    studentId: { type: String },
    selectedBookIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    selectedBooks: [selectedBookSchema],
    requestedBooks: [requestedBookSchema],
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Procured', 'Rejected', 'Returned'],
      default: 'Pending',
    },
    challanGenerated: { type: Boolean, default: false },
    challanData: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);
