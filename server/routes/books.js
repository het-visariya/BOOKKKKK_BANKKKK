const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const Book = require('../models/Book');
const { getBooks, getRecommendations, getBookById, createBook, updateBook, deleteBook } = require('../controllers/bookController');

router.get('/', getBooks);
router.get('/recommendations', getRecommendations);
router.get('/:id', getBookById);

router.post('/', authMiddleware, adminMiddleware, createBook);
router.patch('/:id', authMiddleware, adminMiddleware, updateBook);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBook);

// Bulk seed books (admin only)
router.post('/seed', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: 'books array required' });
    }
    const inserted = await Book.insertMany(books, { ordered: false });
    return res.json({ success: true, inserted: inserted.length });
  } catch (err) {
    console.error('[Books] Seed error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// CSV import (admin only)
router.post('/import-csv', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: 'rows array required' });
    }
    let inserted = 0;
    let skipped = 0;
    const errors = [];
    for (const row of rows) {
      try {
        if (!row.title || !row.author) { skipped++; continue; }
        await Book.create({
          title: row.title,
          author: row.author,
          edition: row.edition || '',
          publisher: row.publisher || '',
          category: row.category || 'General',
          quantity: Number(row.quantity) || 1,
          availableQuantity: Number(row.availableQuantity) || Number(row.quantity) || 1,
        });
        inserted++;
      } catch (e) {
        errors.push(e.message);
        skipped++;
      }
    }
    return res.json({ success: true, inserted, skipped, errors });
  } catch (err) {
    console.error('[Books] ImportCsv error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
