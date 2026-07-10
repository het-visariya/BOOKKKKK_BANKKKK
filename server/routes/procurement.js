const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const adminMiddleware = require('../middleware/adminMiddleware');
const ProcurementService = require('../services/procurementService');

/**
 * POST /procurement/generate
 * Generate procurement PDF and mark books as purchased
 */
router.post(
  '/generate',
  adminMiddleware,
  [body('selectedBooks').isArray().notEmpty().withMessage('Selected books array is required')],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { selectedBooks } = req.body;
      const adminName = req.admin?.email || req.admin?.name || 'Admin';

      // Validate selected books
      if (selectedBooks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Select at least one book',
        });
      }

      // Verify all books are not already purchased
      const hasPurchased = selectedBooks.some((b) => b.isPurchased);
      if (hasPurchased) {
        return res.status(400).json({
          success: false,
          message: 'Cannot include already purchased books',
        });
      }

      // Generate PDF
      const pdfData = await ProcurementService.generateProcurementPDF(
        selectedBooks,
        adminName
      );

      // Create batch and update requests
      const batch = await ProcurementService.createProcurementBatch(
        selectedBooks,
        pdfData.pdfPath,
        pdfData.pdfFileName,
        pdfData.pdfUrl,
        pdfData.batchId,
        adminName
      );

      res.status(200).json({
        success: true,
        message: 'PDF generated and books marked as purchased',
        data: {
          batchId: batch.purchaseBatchId,
          pdfUrl: batch.pdfUrl,
          pdfFileName: batch.pdfFileName,
          totalBooks: batch.totalBooks,
          generatedAt: batch.generatedDate,
        },
      });
    } catch (error) {
      console.error('Error in /generate:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate PDF',
      });
    }
  }
);

/**
 * GET /procurement/history
 * Get procurement batch history with pagination
 */
router.get('/history', adminMiddleware, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const adminName = req.admin?.email || req.admin?.name;

    const history = await ProcurementService.getProcurementHistory({
      limit: parseInt(limit),
      skip: parseInt(skip),
      adminName,
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error in /history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch history',
    });
  }
});

/**
 * GET /procurement/batch/:batchId
 * Get specific procurement batch details
 */
router.get('/batch/:batchId', adminMiddleware, async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await ProcurementService.getProcurementBatchDetails(batchId);

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error('Error in /batch/:batchId:', error);
    res.status(error.message === 'Batch not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch batch',
    });
  }
});

/**
 * GET /procurement/pending
 * Get pending books for procurement (Approved but not yet purchased)
 */
router.get('/pending', adminMiddleware, async (req, res) => {
  try {
    const pendingBooks = await ProcurementService.getBooksPendingPurchase();

    res.status(200).json({
      success: true,
      data: pendingBooks,
      count: pendingBooks.length,
    });
  } catch (error) {
    console.error('Error in /pending:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending books',
    });
  }
});

/**
 * GET /procurement/download/:fileName
 * Download procurement PDF (serves static files from uploads directory)
 */
router.get('/download/:fileName', adminMiddleware, (req, res) => {
  try {
    const { fileName } = req.params;
    // Security: validate filename to prevent directory traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file name',
      });
    }

    const filePath = require('path').join(
      __dirname,
      '../uploads/procurement',
      fileName
    );
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            message: 'File not found',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error in /download:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download file',
    });
  }
});

module.exports = router;
