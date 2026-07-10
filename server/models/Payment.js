const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, default: 200 },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING'],
      default: 'PENDING',
    },
    transactionId: { type: String },
    paymentMethod: { type: String, default: 'demo' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
