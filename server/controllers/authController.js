const User = require('../models/User');
const Payment = require('../models/Payment');
const { hashPassword, comparePassword, generateToken } = require('../services/authService');
const { v4: uuidv4 } = require('uuid');

const normalizeIdentityValue = (value = '') => String(value).replace(/\D/g, '').trim();

const demoOtpStore = new Map();

const generateDemoOtp = () => Math.floor(1000 + (Math.random() * 9000)).toString();

const saveDemoOtp = (phone, otp) => {
  demoOtpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
};

const getStoredDemoOtp = (phone) => {
  const entry = demoOtpStore.get(phone);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    demoOtpStore.delete(phone);
    return null;
  }
  return entry.otp;
};

const findStudentByIdentity = async ({ aadhaarNumber, phone }) => {
  const cleanAadhaar = normalizeIdentityValue(aadhaarNumber);
  const cleanPhone = normalizeIdentityValue(phone);

  if (cleanAadhaar && cleanPhone) {
    const compoundUser = await User.findOne({ aadhaarNumber: cleanAadhaar, phone: cleanPhone });
    if (compoundUser) {
      return { user: compoundUser, cleanAadhaar, cleanPhone };
    }
  }

  if (cleanAadhaar && cleanPhone) {
    const fallbackUser = await User.findOne({
      $or: [{ aadhaarNumber: cleanAadhaar }, { phone: cleanPhone }],
    });
    if (fallbackUser) {
      return { user: fallbackUser, cleanAadhaar, cleanPhone };
    }
  }

  return { user: null, cleanAadhaar, cleanPhone };
};

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
      amount: 500,
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
    const cleanPhone = normalizeIdentityValue(phone);
    const cleanAadhaar = normalizeIdentityValue(aadhaarNumber);
    const paymentId = 'DEMO_' + uuidv4().slice(0, 8).toUpperCase();

    const { user: existingUser } = await findStudentByIdentity({ aadhaarNumber: cleanAadhaar, phone: cleanPhone });
    if (existingUser) {
      existingUser.name = existingUser.name || name;
      existingUser.email = normalizedEmail;
      existingUser.phone = cleanPhone || existingUser.phone;
      if (cleanAadhaar) existingUser.aadhaarNumber = cleanAadhaar;
      existingUser.course = course || existingUser.course || 'Other';
      existingUser.college = college || existingUser.college || '';
      existingUser.profilePhoto = profilePhoto || existingUser.profilePhoto || null;
      existingUser.membershipStatus = 'PAID';
      existingUser.paymentStatus = 'SUCCESS';
      existingUser.paymentId = existingUser.paymentId || paymentId;
      existingUser.frozenAadhaar = true;
      existingUser.frozenPhone = true;
      existingUser.profileCompleted = true;
      await existingUser.save();

      const existingPayment = await Payment.findOne({ userId: existingUser._id }).sort({ createdAt: -1 });
      if (!existingPayment) {
        await Payment.create({ userId: existingUser._id, amount: 500, status: 'SUCCESS', transactionId: existingUser.paymentId, paymentMethod: 'demo' });
      }

      const token = generateToken(String(existingUser._id), existingUser.role);
      return res.json({ success: true, token, user: existingUser.toPublic(), alreadyExists: true });
    }

    const passwordHash = await hashPassword(password);
    const studentId = await User.generateStudentId();

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone: cleanPhone || '',
      aadhaarNumber: cleanAadhaar || '',
      course: course || 'Other',
      college: college || '',
      profilePhoto: profilePhoto || null,
      studentId,
      membershipStatus: 'PAID',
      paymentStatus: 'SUCCESS',
      paymentId,
      role: 'student',
      frozenAadhaar: true,
      frozenPhone: true,
      profileCompleted: true,
    });

    await Payment.create({
      userId: user._id,
      amount: 500,
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
const MSG91_BASE_URL = 'https://api.msg91.com/api/v5';

const sendOtp = async (req, res) => {
  try {
    const { aadhaarNumber, phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const msg91ApiKey = process.env.MSG91_API_KEY?.trim();
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID?.trim();
    const countryCode = process.env.MSG91_COUNTRY_CODE?.trim() || '91';

    if (!msg91ApiKey || !msg91TemplateId) {
      const demoOtp = generateDemoOtp();
      saveDemoOtp(cleanPhone, demoOtp);
      console.log('[Auth] MSG91 is not configured. Using demo OTP:', demoOtp);
      return res.json({
        success: true,
        message: `Demo OTP generated for +${countryCode}${cleanPhone}`,
        demoOtp,
      });
    }

    const msg91Url = `${MSG91_BASE_URL}/otp?template_id=${encodeURIComponent(msg91TemplateId)}&mobile=${countryCode}${cleanPhone}&authkey=${encodeURIComponent(msg91ApiKey)}`;

    try {
      const response = await fetch(msg91Url, { method: 'GET' });
      const data = await response.json().catch(() => ({}));

      const isSuccess = response.ok && (data.type === 'success' || data.message === 'Mobile no. already verified' || /sent|success/i.test(String(data.message || data.type || '')));

      if (!isSuccess) {
        console.error('[Auth] MSG91 send OTP failed:', data);
        return res.status(502).json({
          success: false,
          message: data.message || 'Failed to send OTP via SMS provider',
        });
      }

      console.log('[Auth] OTP request sent successfully for:', cleanPhone);
      return res.json({
        success: true,
        message: `OTP sent to +${countryCode}${cleanPhone}`,
        requestId: data.request_id || null,
      });
    } catch (err) {
      console.error('[Auth] MSG91 send OTP request crashed:', err);
      return res.status(502).json({
        success: false,
        message: 'Failed to send OTP via SMS provider',
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

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const cleanOtp = otp.replace(/\D/g, '');
    const msg91ApiKey = process.env.MSG91_API_KEY?.trim();
    const countryCode = process.env.MSG91_COUNTRY_CODE?.trim() || '91';

    if (!msg91ApiKey) {
      const storedOtp = getStoredDemoOtp(cleanPhone);
      if (storedOtp && storedOtp === cleanOtp) {
        demoOtpStore.delete(cleanPhone);
        console.log('[Auth] Demo OTP verified successfully for:', cleanPhone);
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP. Please try again.',
        });
      }
    } else if (cleanOtp.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 4 digits',
      });
    }

    const cleanAadhaar = normalizeIdentityValue(aadhaarNumber);

    console.log('[Auth] Verifying OTP:', cleanOtp, 'for phone:', cleanPhone);

    const msg91VerifyUrl = `${MSG91_BASE_URL}/otp/verify?authkey=${encodeURIComponent(msg91ApiKey)}&mobile=${countryCode}${cleanPhone}&otp=${cleanOtp}`;

    try {
      const response = await fetch(msg91VerifyUrl, { method: 'GET' });
      const data = await response.json().catch(() => ({}));

      const isVerified = response.ok && (data.type === 'success' || data.message === 'Mobile no. already verified' || /success|verified/i.test(String(data.message || data.type || '')));

      if (!isVerified) {
        const storedOtp = getStoredDemoOtp(cleanPhone);
        if (storedOtp && storedOtp === cleanOtp) {
          demoOtpStore.delete(cleanPhone);
          console.log('[Auth] Demo OTP verified successfully for:', cleanPhone);
        } else {
          console.error('[Auth] MSG91 verification failed:', data);
          return res.status(401).json({
            success: false,
            message: data.message || 'Invalid or expired OTP. Please try again.',
          });
        }
      }
    } catch (err) {
      const storedOtp = getStoredDemoOtp(cleanPhone);
      if (storedOtp && storedOtp === cleanOtp) {
        demoOtpStore.delete(cleanPhone);
        console.log('[Auth] Demo OTP verified successfully for:', cleanPhone);
      } else {
        console.error('[Auth] MSG91 verification request crashed:', err);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP. Please try again.',
        });
      }
    }

    console.log(`[Auth] OTP verified successfully for +${countryCode}${cleanPhone}`);

    const { user, cleanAadhaar: verifiedAadhaar, cleanPhone: verifiedPhone } = await findStudentByIdentity({
      aadhaarNumber: cleanAadhaar,
      phone: cleanPhone,
    });

    if (user) {
      user.phone = verifiedPhone;
      if (verifiedAadhaar) user.aadhaarNumber = verifiedAadhaar;
      user.frozenAadhaar = true;
      user.frozenPhone = true;
      await user.save();

      const token = generateToken(String(user._id), user.role);
      return res.json({
        success: true,
        token,
        user: user.toPublic(),
        needsRegistration: false,
        isExistingUser: true,
        profileCompleted: user.profileCompleted,
        paymentStatus: user.paymentStatus,
        membershipStatus: user.membershipStatus,
        message: 'OTP verified successfully',
      });
    }

    const pendingToken = generateToken(`otp:${verifiedAadhaar || 'unknown'}:${verifiedPhone}`, 'student');
    return res.json({
      success: true,
      token: pendingToken,
      user: {
        aadhaarNumber: verifiedAadhaar,
        phone: verifiedPhone,
        frozenAadhaar: true,
        frozenPhone: true,
        profileCompleted: false,
        paymentStatus: 'PENDING',
        membershipStatus: 'NOT_PAID',
      },
      needsRegistration: true,
      isNewUser: true,
      profileCompleted: false,
      paymentStatus: 'PENDING',
      membershipStatus: 'NOT_PAID',
      message: 'No existing student found. Please complete registration.',
    });
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
