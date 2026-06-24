const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const purchaseBatchSchema = new mongoose.Schema(
  {
    purchaseBatchId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: String, // Admin ID or name
      required: true,
    },
    totalBooks: {
      type: Number,
      required: true,
      min: 1,
    },
    // Array of book references: [{ requestId, bookIndex, bookTitle }]
    books: [
      {
        requestId: mongoose.Schema.Types.ObjectId,
        bookIndex: Number, // Index in requestedBooks array
        bookTitle: String,
        author: String,
        publisher: String,
        edition: String,
        studentId: String,
        studentName: String,
      },
    ],
    pdfUrl: {
      type: String, // Path or URL to the generated PDF
      required: true,
    },
    pdfFileName: {
      type: String, // e.g., "PROCUREMENT_2026_06_18.pdf"
      required: true,
    },
    // Array of affected request IDs for tracking
    requestIds: [mongoose.Schema.Types.ObjectId],
    status: {
      type: String,
      enum: ['completed', 'failed', 'archived'],
      default: 'completed',
    },
    notes: String,
  },
  { timestamps: true } // createdAt, updatedAt
);

// Index for efficient querying by date
purchaseBatchSchema.index({ generatedDate: -1 });
purchaseBatchSchema.index({ generatedBy: 1, generatedDate: -1 });

module.exports = mongoose.model('PurchaseBatch', purchaseBatchSchema);
