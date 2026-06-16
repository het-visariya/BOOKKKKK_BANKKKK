import BookTypes "../types/book";

module {
  /// Returns the comprehensive Indian books seed dataset.
  public func getSeedData() : [BookTypes.BookInput] {
    [
      // ── FYJC (Class 11 HSC) ──────────────────────────────────────────────
      { title = "Mathematics Part 1"; author = "Maharashtra Board"; edition = "2023"; publisher = "Navneet Publications"; category = "FYJC"; quantity = 10 },
      { title = "Mathematics Part 2"; author = "Maharashtra Board"; edition = "2023"; publisher = "Navneet Publications"; category = "FYJC"; quantity = 10 },
      { title = "Concepts of Physics Vol 1"; author = "H.C. Verma"; edition = "2nd"; publisher = "Bharati Bhawan"; category = "FYJC"; quantity = 8 },
      { title = "Chemistry Part 1"; author = "NCERT"; edition = "2023"; publisher = "NCERT"; category = "FYJC"; quantity = 8 },
      { title = "Trueman's Elementary Biology Vol 1"; author = "M.P. Tyagi"; edition = "10th"; publisher = "Trueman Book Co."; category = "FYJC"; quantity = 6 },
      { title = "Yuvakbharati English"; author = "Maharashtra Board"; edition = "2023"; publisher = "Maharashtra State Board"; category = "FYJC"; quantity = 10 },
      { title = "Our Pasts – III (History)"; author = "Arjun Dev"; edition = "2023"; publisher = "NCERT"; category = "FYJC"; quantity = 8 },
      { title = "Indian Constitution at Work (Political Science)"; author = "Sudha Mahajan"; edition = "2023"; publisher = "NCERT"; category = "FYJC"; quantity = 7 },
      { title = "Physical Geography"; author = "Savindra Singh"; edition = "5th"; publisher = "Prayag Pustak Bhawan"; category = "FYJC"; quantity = 6 },

      // ── SYJC (Class 12 HSC) ──────────────────────────────────────────────
      { title = "Mathematics Part 1 (Std XII)"; author = "Maharashtra Board"; edition = "2023"; publisher = "Navneet Publications"; category = "SYJC"; quantity = 10 },
      { title = "Mathematics Part 2 (Std XII)"; author = "Maharashtra Board"; edition = "2023"; publisher = "Navneet Publications"; category = "SYJC"; quantity = 10 },
      { title = "Concepts of Physics Vol 2"; author = "H.C. Verma"; edition = "2nd"; publisher = "Bharati Bhawan"; category = "SYJC"; quantity = 8 },
      { title = "Chemistry Part 2"; author = "NCERT"; edition = "2023"; publisher = "NCERT"; category = "SYJC"; quantity = 8 },
      { title = "Trueman's Elementary Biology Vol 2"; author = "M.P. Tyagi"; edition = "10th"; publisher = "Trueman Book Co."; category = "SYJC"; quantity = 6 },
      { title = "Double Entry Book Keeping – Accountancy Part 1"; author = "T.S. Grewal"; edition = "2023"; publisher = "Sultan Chand & Sons"; category = "SYJC"; quantity = 9 },
      { title = "Business Studies"; author = "NCERT"; edition = "2023"; publisher = "NCERT"; category = "SYJC"; quantity = 8 },
      { title = "Introductory Microeconomics"; author = "Sandeep Garg"; edition = "2023"; publisher = "Dhanpat Rai Publications"; category = "SYJC"; quantity = 7 },
      { title = "English Literature (Std XII)"; author = "Maharashtra State Board"; edition = "2023"; publisher = "Maharashtra State Board"; category = "SYJC"; quantity = 10 },

      // ── Engineering (BTech / BE) ──────────────────────────────────────────
      { title = "Higher Engineering Mathematics"; author = "B.S. Grewal"; edition = "44th"; publisher = "S. Chand & Company"; category = "Engineering"; quantity = 5 },
      { title = "Data Structures Using C"; author = "Reema Thareja"; edition = "3rd"; publisher = "Oxford University Press"; category = "Engineering"; quantity = 4 },
      { title = "Modern Digital Electronics"; author = "R.P. Jain"; edition = "4th"; publisher = "McGraw Hill Education"; category = "Engineering"; quantity = 4 },
      { title = "Electrical Technology Vol 1"; author = "B.L. Theraja"; edition = "24th"; publisher = "S. Chand & Company"; category = "Engineering"; quantity = 4 },
      { title = "Engineering Mechanics"; author = "R.K. Bansal"; edition = "4th"; publisher = "Laxmi Publications"; category = "Engineering"; quantity = 4 },
      { title = "Data Communications and Networking"; author = "Behrouz A. Forouzan"; edition = "5th"; publisher = "McGraw Hill Education India"; category = "Engineering"; quantity = 3 },
      { title = "Operating System Concepts"; author = "Abraham Silberschatz"; edition = "9th"; publisher = "Wiley India"; category = "Engineering"; quantity = 3 },
      { title = "Object Oriented Programming with C++"; author = "E. Balagurusamy"; edition = "8th"; publisher = "McGraw Hill Education India"; category = "Engineering"; quantity = 5 },
      { title = "Database Management Systems"; author = "Raghu Ramakrishnan"; edition = "3rd"; publisher = "McGraw Hill Education India"; category = "Engineering"; quantity = 4 },

      // ── Medical (MBBS) ────────────────────────────────────────────────────
      { title = "Gray's Anatomy"; author = "Henry Gray"; edition = "42nd"; publisher = "Elsevier India"; category = "Medical"; quantity = 3 },
      { title = "Essentials of Medical Pharmacology"; author = "K.D. Tripathi"; edition = "8th"; publisher = "Jaypee Brothers"; category = "Medical"; quantity = 3 },
      { title = "Robbins Basic Pathology"; author = "Vinay Kumar"; edition = "10th"; publisher = "Elsevier India"; category = "Medical"; quantity = 3 },
      { title = "Harrison's Principles of Internal Medicine"; author = "J. Larry Jameson"; edition = "21st"; publisher = "McGraw Hill India"; category = "Medical"; quantity = 2 },
      { title = "Textbook of Biochemistry"; author = "D.M. Vasudevan"; edition = "9th"; publisher = "Jaypee Brothers"; category = "Medical"; quantity = 3 },
      { title = "Clinical Anatomy by Regions"; author = "Richard S. Snell"; edition = "9th"; publisher = "Wolters Kluwer India"; category = "Medical"; quantity = 3 },
      { title = "Review of Physiology"; author = "Soumen Manna"; edition = "5th"; publisher = "Jaypee Brothers"; category = "Medical"; quantity = 4 },
      { title = "Ananthnarayan and Paniker's Textbook of Microbiology"; author = "C.K. Jayaram Paniker"; edition = "10th"; publisher = "Universities Press"; category = "Medical"; quantity = 3 },

      // ── Commerce (BCom) ───────────────────────────────────────────────────
      { title = "Financial Accounting"; author = "R.L. Gupta & V.K. Gupta"; edition = "19th"; publisher = "Sultan Chand & Sons"; category = "Commerce"; quantity = 6 },
      { title = "Mercantile Law (Business Law)"; author = "Avtar Singh"; edition = "13th"; publisher = "Eastern Book Company"; category = "Commerce"; quantity = 5 },
      { title = "Cost Accounting"; author = "S.P. Jain & K.L. Narang"; edition = "20th"; publisher = "Kalyani Publishers"; category = "Commerce"; quantity = 5 },
      { title = "Systematic Approach to Income Tax"; author = "Girish Ahuja & Ravi Gupta"; edition = "2023"; publisher = "Bharat Law House"; category = "Commerce"; quantity = 4 },
      { title = "Financial Management"; author = "I.M. Pandey"; edition = "12th"; publisher = "Vikas Publishing House"; category = "Commerce"; quantity = 4 },
      { title = "Auditing and Assurance"; author = "B.N. Tandon"; edition = "15th"; publisher = "S. Chand & Company"; category = "Commerce"; quantity = 4 },
      { title = "A Handbook of Company Law"; author = "A.K. Majumdar"; edition = "6th"; publisher = "Taxmann Publications"; category = "Commerce"; quantity = 3 },
      { title = "Financial Management"; author = "Prasanna Chandra"; edition = "10th"; publisher = "McGraw Hill Education India"; category = "Commerce"; quantity = 4 },

      // ── Arts (BA) ─────────────────────────────────────────────────────────
      { title = "India's Struggle for Independence"; author = "Bipin Chandra"; edition = "Revised"; publisher = "Penguin Books India"; category = "Arts"; quantity = 6 },
      { title = "Sociology"; author = "Anthony Giddens"; edition = "7th"; publisher = "Wiley India"; category = "Arts"; quantity = 5 },
      { title = "Indian Political Thought"; author = "V.R. Mehta"; edition = "2nd"; publisher = "Manohar Publishers"; category = "Arts"; quantity = 4 },
      { title = "Indian Philosophy Vol 1"; author = "S. Radhakrishnan"; edition = "2nd"; publisher = "Oxford University Press India"; category = "Arts"; quantity = 4 },
      { title = "Psychology"; author = "Robert A. Baron"; edition = "8th"; publisher = "Pearson India"; category = "Arts"; quantity = 4 },
      { title = "A Glossary of Literary Terms"; author = "M.H. Abrams"; edition = "11th"; publisher = "Cengage Learning India"; category = "Arts"; quantity = 5 },

      // ── Science (BSc) ─────────────────────────────────────────────────────
      { title = "Physical Chemistry"; author = "P.W. Atkins"; edition = "11th"; publisher = "Oxford University Press India"; category = "Science"; quantity = 4 },
      { title = "Organic Chemistry"; author = "R.T. Morrison & R.N. Boyd"; edition = "7th"; publisher = "Pearson India"; category = "Science"; quantity = 4 },
      { title = "Mathematical Analysis"; author = "S.C. Malik & Savita Arora"; edition = "5th"; publisher = "New Age International"; category = "Science"; quantity = 5 },
      { title = "Mathematical Physics"; author = "H.K. Dass"; edition = "11th"; publisher = "S. Chand & Company"; category = "Science"; quantity = 4 },
      { title = "Cell and Molecular Biology"; author = "E.D.P. De Robertis"; edition = "8th"; publisher = "Lippincott Williams (India ed.)"; category = "Science"; quantity = 4 },
      { title = "Genetics"; author = "B.D. Singh"; edition = "4th"; publisher = "Kalyani Publishers"; category = "Science"; quantity = 4 },

      // ── CA / CS Preparation ───────────────────────────────────────────────
      { title = "CA Foundation – Principles and Practice of Accounting"; author = "ICAI"; edition = "2023"; publisher = "ICAI Study Material"; category = "CA_CS"; quantity = 4 },
      { title = "CA Foundation – Business Economics"; author = "ICAI"; edition = "2023"; publisher = "ICAI Study Material"; category = "CA_CS"; quantity = 4 },
      { title = "CS Foundation – Business Environment and Law"; author = "ICSI"; edition = "2023"; publisher = "ICSI Study Material"; category = "CA_CS"; quantity = 3 },
      { title = "CA Intermediate – Advanced Accounting"; author = "ICAI"; edition = "2023"; publisher = "ICAI Study Material"; category = "CA_CS"; quantity = 3 },
      { title = "Company Secretary Executive – Company Law"; author = "ICSI"; edition = "2023"; publisher = "ICSI Study Material"; category = "CA_CS"; quantity = 3 },
    ];
  };
};
