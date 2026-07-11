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
    name: { type: String, trim: true },
    firstName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    grandfatherName: { type: String, trim: true },
    surname: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: 'otp_login' },
    phone: { type: String, trim: true },
    aadhaarNumber: { type: String, trim: true, sparse: true },
    frozenAadhaar: { type: Boolean, default: false },
    frozenPhone: { type: Boolean, default: false },
    stream: { type: String, trim: true },
    educationSpecialization: { type: String, trim: true },
    course: {
      type: String,
      trim: true,
    },
    college: { type: String, trim: true },
    village: { type: String, trim: true },
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
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    photoUploaded: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    issuedBooks: [issuedBookSchema],
  },
  { timestamps: true }
);

userSchema.index({ aadhaarNumber: 1, phone: 1 }, { unique: true, sparse: true, name: 'aadhaar_phone_unique' });

userSchema.statics.generateStudentId = async function () {
  const count = await this.countDocuments({ role: 'student' });
  const num = count + 1;
  // Use S00001-style student IDs
  return 'S' + String(num).padStart(5, '0');
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
