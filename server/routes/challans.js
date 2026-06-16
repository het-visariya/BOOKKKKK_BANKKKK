const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createChallan, getChallan } = require('../controllers/challanController');

router.post('/create', authMiddleware, createChallan);
router.get('/:requestId', getChallan); // Public — for QR code scan

module.exports = router;
