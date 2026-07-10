const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    edition: { type: String, trim: true },
    publisher: { type: String, trim: true },
    category: {
      type: String,
      enum: ['FYJC', 'SYJC', 'Medical', 'Commerce', 'Engineering', 'General'],
    },
    quantity: { type: Number, default: 1, min: 0 },
    availableQuantity: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
