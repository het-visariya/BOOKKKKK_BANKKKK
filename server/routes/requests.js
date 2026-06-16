const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { submitRequest, getMyRequests, getRequestById, updateRequestStatus } = require('../controllers/requestController');

router.post('/', authMiddleware, submitRequest);
router.get('/my', authMiddleware, getMyRequests);
router.get('/:id', authMiddleware, getRequestById);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateRequestStatus);

module.exports = router;
