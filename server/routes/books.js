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
        const title = String(row.title ?? '').trim();
        const author = String(row.author ?? '').trim();
        const edition = String(row.edition ?? '').trim();
        const publisher = String(row.publisher ?? '').trim();
        const category = String(row.category ?? 'General').trim() || 'General';
        const shelf = String(row.shelf ?? '').trim();
        const grade = String(row.grade ?? '').trim();
        const subject = String(row.subject ?? '').trim();
        const subjectCode = String(row.subjectCode ?? '').trim();
        const isbn = String(row.isbn ?? '').trim();
        const quantity = Number(row.totalCopies ?? row.quantity ?? 0);
        const available = Number(row.availableCopies ?? row.available ?? quantity);

        if (!title || !author || quantity <= 0) {
          skipped++;
          continue;
        }

        const normalizedQuantity = Math.max(0, quantity);
        const normalizedAvailable = Math.min(Math.max(0, available), normalizedQuantity);
        const query = isbn
          ? { isbn }
          : { title, author, edition };

        const existing = isbn
          ? await Book.findOne(query)
          : await Book.findOne(query);

        if (existing) {
          existing.title = title;
          existing.author = author;
          existing.edition = edition;
          existing.publisher = publisher;
          existing.category = category;
          existing.shelf = shelf;
          existing.grade = grade;
          existing.subject = subject;
          existing.subjectCode = subjectCode;
          existing.isbn = isbn || existing.isbn;
          existing.quantity = normalizedQuantity;
          existing.availableQuantity = normalizedAvailable;
          await existing.save();
        } else {
          await Book.create({
            title,
            author,
            edition,
            publisher,
            category,
            shelf,
            grade,
            subject,
            subjectCode,
            isbn: isbn || undefined,
            quantity: normalizedQuantity,
            availableQuantity: normalizedAvailable,
          });
          inserted++;
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
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
