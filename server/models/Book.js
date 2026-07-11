const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    edition: { type: String, trim: true, default: '' },
    publisher: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    shelf: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
    subjectCode: { type: String, trim: true, default: '' },
    isbn: { type: String, trim: true, sparse: true, unique: true },
    quantity: { type: Number, default: 1, min: 0 },
    availableQuantity: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true }
);

bookSchema.index({ title: 1, author: 1, edition: 1 }, { unique: false });

module.exports = mongoose.model('Book', bookSchema);
