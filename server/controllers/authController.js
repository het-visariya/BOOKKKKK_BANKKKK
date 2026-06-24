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

// --- MSG91 OTP Integration ---
const sendOtp = async (req, res) => {
  try {
    const { aadhaarNumber, phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Validate phone format (10 digits)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const msg91ApiKey = process.env.MSG91_API_KEY;
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
    const countryCode = process.env.MSG91_COUNTRY_CODE || '91';

    // DEMO MODE: If MSG91 is not configured, use in-memory OTP store with 4-digit OTP
    if (!msg91ApiKey || !msg91TemplateId) {
      const demoOtp = String(Math.floor(1000 + Math.random() * 9000));
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      global.otpStore.set(cleanPhone, {
        otp: demoOtp,
        expiresAt,
        attempts: 0,
      });

      console.log(`[Auth] DEMO OTP sent to +${countryCode}${cleanPhone}: ${demoOtp}`);
      return res.json({
        success: true,
        message: `OTP sent to +${countryCode}${cleanPhone}`,
        requestId: `demo_${Date.now()}`,
      });
    }

    // PRODUCTION MODE: Use MSG91 API
    const msg91Url = `https://api.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=${countryCode}${cleanPhone}&authkey=${msg91ApiKey}`;

    try {
      const response = await fetch(msg91Url, { method: 'GET' });
      const data = await response.json();

      // Treat both "success" and "already verified" as valid
      if (
        !response.ok ||
        (
          data.type !== 'success' &&
          data.message !== 'Mobile no. already verified'
        )
      ) {
        console.error('[Auth] MSG91 verification failed:', data);

        return res.status(401).json({
          success: false,
          message: data.message || 'Invalid or expired OTP. Please try again.',
        });
      }

      console.log('[Auth] OTP verified successfully for:', cleanPhone);
      return res.json({
        success: true,
        message: 'OTP sent to your registered mobile number',
        requestId: data.request_id,
      });
    } catch (apiError) {
      console.error('[Auth] MSG91 API request failed:', apiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please check your phone number and try again.',
      });
    }
  } catch (err) {
    console.error('[Auth] SendOtp error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const {
      aadhaarNumber,
      otp,
      phone,
    } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    // Validate phone format (10 digits)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const cleanOtp = otp.replace(/\D/g, '');
    const msg91ApiKey = process.env.MSG91_API_KEY;
    const countryCode = process.env.MSG91_COUNTRY_CODE || '91';

    // DEMO MODE: Check in-memory OTP store (4-digit OTP)
    if (!msg91ApiKey) {
      const storedOtpData = global.otpStore.get(cleanPhone);

      if (!storedOtpData) {
        return res.status(401).json({
          success: false,
          message: 'No OTP sent to this number. Please request a new OTP.',
        });
      }

      if (Date.now() > storedOtpData.expiresAt) {
        global.otpStore.delete(cleanPhone);
        return res.status(401).json({
          success: false,
          message: 'OTP has expired. Please request a new OTP.',
        });
      }

      if (storedOtpData.attempts >= 3) {
        global.otpStore.delete(cleanPhone);
        return res.status(401).json({
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.',
        });
      }

      if (cleanOtp !== storedOtpData.otp) {
        storedOtpData.attempts += 1;
        return res.status(401).json({
          success: false,
          message: 'Invalid OTP. Please try again.',
        });
      }

      // OTP is valid, clean up
      global.otpStore.delete(cleanPhone);
      console.log(`[Auth] OTP verified successfully for +${countryCode}${cleanPhone}`);

      // Find or create user
      let user = await User.findOne({ phone: cleanPhone });
      let isNewUser = false;

      if (!user && aadhaarNumber) {
        user = await User.findOne({ aadhaarNumber });
      }

      if (!user) {
        // Create new temporary user with minimal data
        const studentId = await User.generateStudentId();
        isNewUser = true;

        user = await User.create({
          phone: cleanPhone,
          aadhaarNumber: aadhaarNumber || '',
          studentId,
          role: 'student',
          profileCompleted: false,
          paymentStatus: 'PENDING',
          membershipStatus: 'NOT_PAID',
          passwordHash: 'otp_login',
        });

        console.log(`[Auth] New temporary user created: phone=${cleanPhone} (ID: ${user.studentId})`);
      }

      const token = generateToken(String(user._id), user.role);
      return res.json({
        success: true,
        token,
        user: user.toPublic(),
        isNewUser,
        profileCompleted: user.profileCompleted,
        paymentStatus: user.paymentStatus,
        message: 'OTP verified successfully',
      });
    }

    // PRODUCTION MODE: Use MSG91 API (4-digit OTP)
    if (cleanOtp.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 4 digits',
      });
    }

    console.log('[Auth] Verifying OTP:', cleanOtp, 'for phone:', cleanPhone);

    const msg91VerifyUrl = `https://api.msg91.com/api/v5/otp/verify?authkey=${process.env.MSG91_API_KEY}&mobile=91${cleanPhone}&otp=${cleanOtp}`;

    try {
      const response = await fetch(msg91VerifyUrl, { method: 'GET' });
      const data = await response.json();

      console.log('MSG91 URL:', msg91VerifyUrl);
      console.log('MSG91 Status:', response.status);
      console.log('MSG91 Data:', data);

      // Treat both "success" and "already verified" as valid verification
      const isVerified = response.ok && (data.type === 'success' || data.message === 'Mobile no. already verified');

      if (!isVerified) {
        console.error('[Auth] MSG91 verification failed:', data);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP. Please try again.',
        });
      }

      console.log(`[Auth] OTP verified successfully for +${countryCode}${cleanPhone}`);

      // Find or create user
      let user = await User.findOne({ phone: cleanPhone });
      let isNewUser = false;

      if (!user && aadhaarNumber) {
        user = await User.findOne({ aadhaarNumber });
      }

      if (!user) {
        // Create new temporary user with minimal data
        const studentId = await User.generateStudentId();
        isNewUser = true;

        user = await User.create({
          phone: cleanPhone,
          aadhaarNumber: aadhaarNumber || '',
          studentId,
          role: 'student',
          profileCompleted: false,
          paymentStatus: 'PENDING',
          membershipStatus: 'NOT_PAID',
          passwordHash: 'otp_login',
        });

        console.log(`[Auth] New temporary user created: phone=${cleanPhone} (ID: ${user.studentId})`);
      }

      const token = generateToken(String(user._id), user.role);
      return res.json({
        success: true,
        token,
        user: user.toPublic(),
        isNewUser,
        profileCompleted: user.profileCompleted,
        paymentStatus: user.paymentStatus,
        message: 'OTP verified successfully',
      });
    } catch (apiError) {
      console.error('[Auth] MSG91 verification request failed:', apiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      });
    }
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
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
