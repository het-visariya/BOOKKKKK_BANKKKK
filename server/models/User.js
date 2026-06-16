const mongoose = require('mongoose');

const issuedBookSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  bookTitle: { type: String },
  bookAuthor: { type: String },
  issueDate: { type: Date, default: Date.now },
  returnDate: { type: Date },
  returned: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    aadhaarNumber: { type: String, trim: true, sparse: true },
    course: {
      type: String,
      trim: true,
    },
    college: { type: String, trim: true },
    profilePhoto: { type: String, default: null },
    studentId: { type: String, unique: true, sparse: true },
    membershipStatus: {
      type: String,
      enum: ['PAID', 'NOT_PAID'],
      default: 'NOT_PAID',
    },
    paymentStatus: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED'],
      default: 'PENDING',
    },
    paymentId: { type: String },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    issuedBooks: [issuedBookSchema],
  },
  { timestamps: true }
);

userSchema.statics.generateStudentId = async function () {
  const count = await this.countDocuments({ role: 'student' });
  const num = count + 1;
  return 'SVGA' + String(num).padStart(3, '0');
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
