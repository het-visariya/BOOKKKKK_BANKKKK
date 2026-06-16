const User = require('../models/User');
const Payment = require('../models/Payment');
const { hashPassword, comparePassword, generateToken } = require('../services/authService');
const { v4: uuidv4 } = require('uuid');


const register = async (req, res) => {
  try {
    const { name, email, password, phone, course, college, profilePhoto } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const studentId = await User.generateStudentId();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      course,
      college,
      profilePhoto: profilePhoto || null,
      studentId,
      membershipStatus: 'NOT_PAID',
      paymentStatus: 'PENDING',
      role: 'student',
    });

    const token = generateToken(String(user._id), user.role);

    return res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(String(user._id), user.role);
    return res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    console.error('[Auth] GetCurrentUser error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'svga_admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = generateToken('admin', 'admin');
    // expiresAt in ms — 7 days from now (matches JWT_EXPIRES_IN default of '7d')
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return res.json({
      success: true,
      token,
      expiresAt,
      user: { id: 'admin', role: 'admin', name: 'Admin', username: adminUsername },
    });
  } catch (err) {
    console.error('[Auth] AdminLogin error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const demoPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.membershipStatus = 'PAID';
    user.paymentStatus = 'SUCCESS';
    user.paymentId = 'DEMO_' + uuidv4().slice(0, 8).toUpperCase();
    await user.save();

    await Payment.create({
      userId: user._id,
      amount: 200,
      status: 'SUCCESS',
      transactionId: user.paymentId,
      paymentMethod: 'demo',
    });

    const token = generateToken(String(user._id), user.role);
    return res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    console.error('[Auth] DemoPayment error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const paid = user.membershipStatus === 'PAID';
    let payment = null;
    if (paid) {
      payment = await Payment.findOne({ userId: user._id }).sort({ createdAt: -1 });
    }
    return res.json({
      success: true,
      membershipStatus: user.membershipStatus,
      paymentStatus: user.paymentStatus,
      paid,
      payment: payment
        ? {
            _id: String(payment._id),
            userId: String(payment.userId),
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt,
          }
        : null,
    });
  } catch (err) {
    console.error('[Auth] GetPaymentStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const registerAndPay = async (req, res) => {
  try {
    const { name, email, password, phone, course, college, profilePhoto, aadhaarNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // If user already exists and is PAID, just return their token (idempotent)
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.membershipStatus === 'PAID') {
        const token = generateToken(String(existing._id), existing.role);
        return res.json({ success: true, token, user: existing.toPublic(), alreadyExists: true });
      }
      // Exists but not paid — upgrade them
      existing.membershipStatus = 'PAID';
      existing.paymentStatus = 'SUCCESS';
      existing.paymentId = existing.paymentId || 'DEMO_' + uuidv4().slice(0, 8).toUpperCase();
      await existing.save();
      await Payment.create({ userId: existing._id, amount: 200, status: 'SUCCESS', transactionId: existing.paymentId, paymentMethod: 'demo' });
      const token = generateToken(String(existing._id), existing.role);
      return res.json({ success: true, token, user: existing.toPublic(), alreadyExists: true });
    }

    const passwordHash = await hashPassword(password);
    const studentId = await User.generateStudentId();
    const paymentId = 'DEMO_' + uuidv4().slice(0, 8).toUpperCase();

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone: phone || '',
      aadhaarNumber: aadhaarNumber || '',
      course: course || 'Other',
      college: college || '',
      profilePhoto: profilePhoto || null,
      studentId,
      membershipStatus: 'PAID',
      paymentStatus: 'SUCCESS',
      paymentId,
      role: 'student',
    });

    await Payment.create({
      userId: user._id,
      amount: 200,
      status: 'SUCCESS',
      transactionId: paymentId,
      paymentMethod: 'demo',
    });

    console.log('[Auth] RegisterAndPay: new student created:', user.email, 'ID:', user.studentId);

    const token = generateToken(String(user._id), user.role);
    return res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    console.error('[Auth] RegisterAndPay error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
};

// --- Demo OTP (in-memory store for local development) ---
const otpStore = new Map();

const sendOtp = async (req, res) => {
  try {
    const { aadhaarNumber, phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const key = `${aadhaarNumber || ''}:${phone}`;
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`[Auth] Demo OTP for ${phone}: ${otp}`);
    return res.json({ success: true, otp, demo: true });
  } catch (err) {
    console.error('[Auth] SendOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { aadhaarNumber, otp, name, phone, course, college } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const key = `${aadhaarNumber || ''}:${phone}`;
    const stored = otpStore.get(key);
    if (!stored || stored.expiresAt < Date.now() || stored.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }
    otpStore.delete(key);

    let user = await User.findOne({ phone });
    if (!user && aadhaarNumber) {
      user = await User.findOne({ aadhaarNumber });
    }

    if (!user) {
      const passwordHash = await hashPassword(otp);
      const studentId = await User.generateStudentId();
      const email = `${phone.replace(/\D/g, '')}@svga.local`;
      user = await User.create({
        name: name || `Student ${phone}`,
        email,
        passwordHash,
        phone,
        aadhaarNumber: aadhaarNumber || '',
        course: course || 'Other',
        college: college || '',
        studentId,
        membershipStatus: 'NOT_PAID',
        paymentStatus: 'PENDING',
        role: 'student',
      });
    }

    const token = generateToken(String(user._id), user.role);
    return res.json({ success: true, token, user: user.toPublic() });
  } catch (err) {
    console.error('[Auth] VerifyOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  adminLogin,
  demoPayment,
  getPaymentStatus,
  registerAndPay,
  sendOtp,
  verifyOtp,
};
