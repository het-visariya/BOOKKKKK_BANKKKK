const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { register, login, getCurrentUser, adminLogin, demoPayment, getPaymentStatus, registerAndPay, sendOtp, verifyOtp } = require('../controllers/authController');

// Student auth
router.post('/register', register);
router.post('/login', login);
router.get('/current-user', authMiddleware, getCurrentUser);

// Admin auth
router.post('/admin/login', adminLogin);

// Demo OTP (local development)
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// Demo payment (simulates ₹200 membership payment)
router.post('/payment/demo', authMiddleware, demoPayment);

// Combined register + pay endpoint — registers user AND sets PAID in one call
// Returns a real JWT immediately so frontend never needs a fake/pending token
router.post('/register-and-pay', registerAndPay);

// Payment status check
router.get('/payment-status', authMiddleware, getPaymentStatus);

module.exports = router;
