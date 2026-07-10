const Request = require('../models/Request');
const User = require('../models/User');
const Book = require('../models/Book');

const createRequest = async (userId, selectedBookIds, requestedBooks) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.membershipStatus !== 'PAID') throw new Error('Membership payment required');

  const issueDate = new Date();
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 30);

  const books = await Book.find({ _id: { $in: selectedBookIds } });

  const selectedBooksData = books.map((book) => ({
    title: book.title,
    author: book.author,
    edition: book.edition || '',
    publisher: book.publisher || '',
    issueDate,
    returnDate,
    returned: false,
  }));

  const request = await Request.create({
    userId,
    studentName: user.name,
    studentEmail: user.email,
    studentCourse: user.course,
    studentId: user.studentId,
    selectedBookIds: books.map((b) => b._id),
    selectedBooks: selectedBooksData,
    requestedBooks: requestedBooks || [],
    status: 'Pending',
    challanGenerated: false,
  });

  // Add issued books to user
  const issuedBooksToAdd = books.map((book) => ({
    bookId: book._id,
    bookTitle: book.title,
    bookAuthor: book.author,
    issueDate,
    returnDate,
    returned: false,
  }));

  await User.findByIdAndUpdate(userId, {
    $push: { issuedBooks: { $each: issuedBooksToAdd } },
  });

  return request;
};

module.exports = { createRequest };
