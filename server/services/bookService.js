const Book = require('../models/Book');

const DEMO_BOOKS = [
  // FYJC Science
  { title: 'Physics Part 1', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'FYJC', quantity: 5, availableQuantity: 5 },
  { title: 'Chemistry Part 1', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'FYJC', quantity: 4, availableQuantity: 4 },
  { title: 'Biology Part 1', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'FYJC', quantity: 3, availableQuantity: 3 },
  { title: 'Mathematics Part 1', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'FYJC', quantity: 6, availableQuantity: 6 },
  { title: 'English Yuvakbharati', author: 'Maharashtra Board', edition: '2023', publisher: 'Maharashtra Board', category: 'FYJC', quantity: 5, availableQuantity: 5 },
  // SYJC Science
  { title: 'Physics Part 2', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'SYJC', quantity: 5, availableQuantity: 5 },
  { title: 'Chemistry Part 2', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'SYJC', quantity: 4, availableQuantity: 4 },
  { title: 'Biology Part 2', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'SYJC', quantity: 3, availableQuantity: 3 },
  { title: 'Mathematics Part 2', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'SYJC', quantity: 6, availableQuantity: 6 },
  { title: 'Information Technology', author: 'Maharashtra Board', edition: '2023', publisher: 'Maharashtra Board', category: 'SYJC', quantity: 4, availableQuantity: 4 },
  // Commerce
  { title: 'Accountancy Part 1', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'Commerce', quantity: 4, availableQuantity: 4 },
  { title: 'Accountancy Part 2', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'Commerce', quantity: 4, availableQuantity: 4 },
  { title: 'Business Studies', author: 'NCERT', edition: '2023', publisher: 'NCERT', category: 'Commerce', quantity: 4, availableQuantity: 4 },
  { title: 'Economics', author: 'T.R. Jain', edition: '2023', publisher: 'VK Global', category: 'Commerce', quantity: 3, availableQuantity: 3 },
  { title: 'Organisation of Commerce', author: 'Maharashtra Board', edition: '2023', publisher: 'Maharashtra Board', category: 'Commerce', quantity: 3, availableQuantity: 3 },
  // Medical
  { title: 'Human Anatomy & Physiology', author: 'Waugh & Grant', edition: '14th', publisher: 'Elsevier', category: 'Medical', quantity: 2, availableQuantity: 2 },
  { title: 'Pathology Quick Review', author: 'Gobind Rai Garg', edition: '5th', publisher: 'Avichal', category: 'Medical', quantity: 2, availableQuantity: 2 },
  { title: 'Biochemistry', author: 'U. Satyanarayana', edition: '5th', publisher: 'Elsevier', category: 'Medical', quantity: 2, availableQuantity: 2 },
  { title: 'Pharmacology', author: 'K.D. Tripathi', edition: '8th', publisher: 'Jaypee', category: 'Medical', quantity: 2, availableQuantity: 2 },
  // Engineering
  { title: 'Engineering Mathematics', author: 'B.S. Grewal', edition: '44th', publisher: 'Khanna', category: 'Engineering', quantity: 5, availableQuantity: 5 },
  { title: 'Basic Electrical Engineering', author: 'D.C. Kulshreshtha', edition: '2nd', publisher: 'McGraw Hill', category: 'Engineering', quantity: 3, availableQuantity: 3 },
  { title: 'Data Structures Using C', author: 'Reema Thareja', edition: '3rd', publisher: 'Oxford', category: 'Engineering', quantity: 3, availableQuantity: 3 },
  { title: 'Engineering Drawing', author: 'N.D. Bhatt', edition: '53rd', publisher: 'Charotar', category: 'Engineering', quantity: 4, availableQuantity: 4 },
  // General
  { title: 'Spoken English', author: 'R.K. Bansal', edition: '4th', publisher: 'Orient Longman', category: 'General', quantity: 5, availableQuantity: 5 },
  { title: 'General Knowledge 2024', author: 'Manohar Pandey', edition: '2024', publisher: 'Arihant', category: 'General', quantity: 5, availableQuantity: 5 },
];

const seedBooks = async () => {
  try {
    const count = await Book.countDocuments();
    if (count === 0) {
      await Book.insertMany(DEMO_BOOKS);
      console.log(`[Seed] Inserted ${DEMO_BOOKS.length} demo books`);
    } else {
      console.log(`[Seed] Books already present: ${count} books in DB`);
    }
  } catch (err) {
    console.error('[Seed] Error seeding books:', err.message);
  }
};

module.exports = { seedBooks };
