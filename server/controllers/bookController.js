const Book = require('../models/Book');

const getBooks = async (req, res) => {
  try {
    const { search, category, course, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (course) filter.category = course;

    const skip = (Number(page) - 1) * Number(limit);
    const [books, total] = await Promise.all([
      Book.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Book.countDocuments(filter),
    ]);

    return res.json({ success: true, books, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[Books] GetBooks error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { course } = req.query;
    const filter = course ? { category: course } : {};
    const books = await Book.find(filter).limit(5);
    return res.json({ success: true, books });
  } catch (err) {
    console.error('[Books] GetRecommendations error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    return res.json({ success: true, book });
  } catch (err) {
    console.error('[Books] GetBookById error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createBook = async (req, res) => {
  try {
    const { title, author, edition, publisher, category, quantity } = req.body;
    if (!title || !author) {
      return res.status(400).json({ success: false, message: 'Title and author are required' });
    }
    const qty = Number(quantity) || 1;
    const book = await Book.create({ title, author, edition, publisher, category, quantity: qty, availableQuantity: qty });
    return res.status(201).json({ success: true, book });
  } catch (err) {
    console.error('[Books] CreateBook error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    return res.json({ success: true, book });
  } catch (err) {
    console.error('[Books] UpdateBook error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    return res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    console.error('[Books] DeleteBook error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBooks, getRecommendations, getBookById, createBook, updateBook, deleteBook };
