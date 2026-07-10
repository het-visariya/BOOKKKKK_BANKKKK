import type {
  AnalyticsData,
  AdminLoginResult,
  Book,
  BookRequest,
  IssuedBookInfo,
  Reservation,
  Result,
  Result_1,
  Result_2,
  Result_3,
  Result_4,
  Result_5,
  Result_28,
  Result_10,
  Result_11,
  ReturnTimelineEntry,
  Transfer,
  UserPublic,
  backendInterface,
} from "../backend";
import { MembershipStatus, UserRole } from "../backend";

const book = (
  id: string,
  title: string,
  author: string,
  publisher: string,
  edition: string,
  category: string,
  available: number,
  qty: number,
): Book => ({
  bookId: id,
  title,
  author,
  publisher,
  edition,
  category,
  availableCount: BigInt(available),
  availableQuantity: BigInt(available),
  quantity: BigInt(qty),
  totalQuantity: BigInt(qty),
  isDeleted: false,
  isAvailable: available > 0,
  createdAt: BigInt(1700000000000 + Math.floor(Math.random() * 1000000)),
  waitingQueue: [],
  currentHolders: [],
});

const sampleBooks: Book[] = [
  book("book-001", "Mathematics Part I (Std. 11)", "R.D. Sharma", "Dhanpat Rai Publications", "Latest", "FYJC", 4, 5),
  book("book-002", "Mathematics Part II (Std. 11)", "R.D. Sharma", "Dhanpat Rai Publications", "Latest", "FYJC", 3, 4),
  book("book-003", "Physics (Std. 11)", "H.C. Verma", "Bharati Bhawan", "2nd", "FYJC", 5, 6),
  book("book-004", "Chemistry Part I (Std. 11)", "NCERT", "NCERT", "2023", "FYJC", 4, 4),
  book("book-005", "Chemistry Part II (Std. 11)", "NCERT", "NCERT", "2023", "FYJC", 3, 4),
  book("book-006", "Biology (Std. 11)", "Trueman's", "MBD Group", "Latest", "FYJC", 2, 3),
  book("book-007", "English Yuvakbharati (Std. 11)", "Maharashtra State Board", "Navneet", "2023", "FYJC", 5, 6),
  book("book-008", "Economics (Std. 11)", "Sandeep Garg", "VK Global", "Latest", "FYJC", 3, 4),
  book("book-009", "Mathematics Part I (Std. 12)", "R.D. Sharma", "Dhanpat Rai Publications", "Latest", "SYJC", 4, 5),
  book("book-010", "Mathematics Part II (Std. 12)", "R.D. Sharma", "Dhanpat Rai Publications", "Latest", "SYJC", 3, 4),
  book("book-011", "Physics Vol. I & II (Std. 12)", "H.C. Verma", "Bharati Bhawan", "2nd", "SYJC", 4, 5),
  book("book-012", "Chemistry Part I (Std. 12)", "NCERT", "NCERT", "2023", "SYJC", 3, 4),
  book("book-013", "Chemistry Part II (Std. 12)", "NCERT", "NCERT", "2023", "SYJC", 2, 3),
  book("book-014", "Biology (Std. 12)", "Trueman's Elementary Biology", "MBD Group", "Latest", "SYJC", 0, 3),
  book("book-015", "Accounts (Std. 12)", "T.S. Grewal", "S. Chand", "Latest", "SYJC", 4, 5),
  book("book-016", "Economics (Std. 12)", "Sandeep Garg", "VK Global", "Latest", "SYJC", 3, 4),
  book("book-019", "Engineering Mathematics Vol. I", "B.S. Grewal", "Khanna Publishers", "44th", "Engineering", 3, 4),
  book("book-020", "Engineering Mathematics Vol. II", "B.S. Grewal", "Khanna Publishers", "44th", "Engineering", 2, 4),
  book("book-021", "Introduction to C Programming", "Dennis Ritchie", "McGraw-Hill", "2nd", "Engineering", 4, 5),
  book("book-022", "Data Structures Using C", "Reema Thareja", "Oxford University Press", "3rd", "Engineering", 3, 4),
  book("book-027", "Gray's Anatomy", "Henry Gray", "Elsevier", "42nd", "Medical", 2, 3),
  book("book-028", "Guyton & Hall Medical Physiology", "Arthur C. Guyton", "Elsevier", "14th", "Medical", 1, 2),
  book("book-033", "Financial Accounting", "T.S. Grewal", "S. Chand", "Latest", "Commerce", 4, 5),
  book("book-034", "Business Law", "N.D. Kapoor", "S. Chand", "Latest", "Commerce", 3, 4),
  book("book-038", "Concepts of Physics Vol. I", "H.C. Verma", "Bharati Bhawan", "Latest", "Science", 5, 6),
  book("book-039", "Concepts of Physics Vol. II", "H.C. Verma", "Bharati Bhawan", "Latest", "Science", 4, 5),
  book("book-043", "Modern Indian History", "Bipin Chandra", "Orient Blackswan", "Latest", "Arts", 4, 5),
  book("book-044", "Indian Political System", "M. Laxmikanth", "McGraw-Hill", "6th", "Arts", 5, 6),
];

const _sampleIssuedBookInfo: IssuedBookInfo = {
  requestId: "req-002",
  userId: "SVGA-2024-001",
  studentName: "Priya Sharma",
  bookId: "book-009",
  bookIds: ["book-009"],
  bookTitle: "Mathematics Part I (Std. 12)",
  status: "Issued",
  issueDate: BigInt(1700000000000),
  returnDate: BigInt(1702592000000),
  expectedReturnDate: BigInt(1702592000000),
  returned: false,
};

const sampleUser: UserPublic = {
  paymentStatus: "completed",
  studentId: "SVGA-2024-001",
  name: "Priya Sharma",
  firstName: "Priya",
  middleName: "",
  grandFatherName: "",
  surname: "Sharma",
  academicYear: "FY",
  frozenAadhaar: false,
  frozenPhone: false,
  createdAt: BigInt(1700000000000),
  aadhaarNumber: "123412341234",
  membershipStartDate: BigInt(1700000000000),
  paymentId: "pay_001",
  phone: "9876543210",
  course: "FYJC Science",
  profileImageUrl: "",
  membershipStatus: MembershipStatus.PAID,
  college: "SVGA Junior College, Mumbai",
  role: UserRole.student,
  issuedBooksInfo: [],
  occupation: "",
  parentContact: "",
  birthDate: "",
  nativePlace: "",
  educationLevel: "",
  educationSpecialization: "",
  officialSurname: "",
  courseName: "",
  currentLocation: "",
  email: "",
  occupationOther: "",
};

const sampleRequest: BookRequest = {
  status: "Pending",
  requestId: "req-001",
  userId: "SVGA-2024-001",
  studentId: "",
  studentAadhaar: "123412341234",
  studentPhone: "9876543210",
  studentEmail: "priya@example.com",
  studentName: "Priya Sharma",
  studentCourse: "FYJC Science",
  studentYear: "FY",
  createdAt: BigInt(1700000000000),
  requestedBooks: [],
  selectedBookIds: ["book-001", "book-003"],
  bookApprovals: [],
  challanId: undefined,
  specialRequests: [],
  requestNumber: "REQ-001",
  updatedAt: BigInt(1700000000000),
  bookDecisions: [],
  returned: false,
  collectionDate: "",
  collectionLocation: "SVGA Book Bank Office",
  collectionTime: "",
  challanData: "",
};

const samplePayment = {
  status: "completed",
  userId: "SVGA-2024-001",
  createdAt: new Date(1700000000000).toISOString(),
  paymentId: "pay_001",
  stripePaymentId: "demo_session_001",
  amount: BigInt(20000),
};

export const mockBackend = {
  addBook: async () => ({ __kind__: "ok", ok: sampleBooks[0] } as unknown as Result_3),
  assignCallerUserRole: async () => undefined,
  cancelReservation: async () => ({ __kind__: "ok", ok: null } as unknown),
  checkBookAvailability: async (_bookId: string) => ({
    __kind__: "ok",
    ok: { available: true, waitingCount: BigInt(0), expectedReturnDate: undefined, daysUntilReturn: undefined },
  } as unknown as Result_11),
  createBookRequest: async () => ({ __kind__: "ok", ok: sampleRequest } as unknown as Result_2),
  createBookReservation: async () =>
    ({ __kind__: "ok", ok: { id: "res-001", studentId: "SVGA-2024-001", bookId: "book-001", requestDate: BigInt(1700000000000), status: "Waiting" } } as unknown as Result_10),
  createCheckoutSession: async () => "https://checkout.stripe.com/test-session",
  createProcurementRequest: async () =>
    ({ __kind__: "ok", ok: { id: "proc-001", studentId: "SVGA-2024-001", bookTitle: "Test Book", requestDate: BigInt(1700000000000), urgency: "Required", status: "Pending" } } as unknown),
  createReservation: async () =>
    ({ __kind__: "ok", ok: { id: "res-001", studentId: "SVGA-2024-001", bookId: "book-001", requestDate: BigInt(1700000000000), status: "Waiting" } } as unknown as Result_10),
  createUrgentProcurementRequest: async () =>
    ({ __kind__: "ok", ok: { id: "proc-001", studentId: "SVGA-2024-001", bookTitle: "Test Book", requestDate: BigInt(1700000000000), urgency: "Required", status: "Pending" } } as unknown),
  deleteBook: async () => ({ __kind__: "ok", ok: null } as unknown),
  getAllBooks: async () => sampleBooks,
  getAllProcurements: async () => [],
  getAllRequests: async () => [
    sampleRequest,
    { ...sampleRequest, requestId: "req-002", status: "Approved", userId: "SVGA-2024-002", selectedBookIds: ["book-009", "book-011"] },
    { ...sampleRequest, requestId: "req-003", status: "Procured", userId: "SVGA-2024-003", selectedBookIds: ["book-033", "book-034"] },
    { ...sampleRequest, requestId: "req-004", status: "Rejected", userId: "SVGA-2024-004", selectedBookIds: ["book-027"] },
    { ...sampleRequest, requestId: "req-005", status: "Returned", userId: "SVGA-2024-001", selectedBookIds: ["book-019"] },
  ],
  getAllUsers: async () => [
    sampleUser,
    { ...sampleUser, studentId: "SVGA-2024-002", name: "Rahul Patil", aadhaarNumber: "567856785678", phone: "9823456789", course: "SYJC Commerce", paymentStatus: "completed", college: "SVGA College, Andheri" },
    { ...sampleUser, studentId: "SVGA-2024-003", name: "Sneha Joshi", aadhaarNumber: "901290129012", phone: "9934567890", course: "Engineering", paymentStatus: "pending", college: "SVGA Engineering College" },
    { ...sampleUser, studentId: "SVGA-2024-004", name: "Aditya Kumar", aadhaarNumber: "345634563456", phone: "9845678901", course: "MBBS", paymentStatus: "completed", college: "SVGA Medical College" },
    { ...sampleUser, studentId: "SVGA-2024-005", name: "Meera Nair", aadhaarNumber: "789078907890", phone: "9756789012", course: "B.Com", paymentStatus: "completed", college: "SVGA Commerce College" },
  ],
  getBookById: async (id: string) => {
    const found = sampleBooks.find((b) => b.bookId === id);
    return { __kind__: "ok", ok: found ?? sampleBooks[0] } as unknown as Result_3;
  },
  getBookRecommendations: async () =>
    sampleBooks.filter((b) => Number(b.availableCount) > 0).slice(0, 6),
  getBooksReturningByDate: async () => [],
  getCallerUserRole: async () => "user" as unknown as import("../backend").UserRole__1,
  getInventoryLifecycle: async () => [],
  getMyIssuedBooks: async () => [sampleRequest, { ...sampleRequest, requestId: "req-005", status: "Approved" }],
  getMyProcurements: async () => [],
  getMyRequests: async () => [
    sampleRequest,
    { ...sampleRequest, requestId: "req-005", status: "Approved", selectedBookIds: ["book-009"] },
  ],
  getMyReservations: async () => [],
  getPaymentStatus: async () => ({ __kind__: "ok", ok: samplePayment } as unknown),
  getQrCodeData: async (studentId: string) =>
    `${window.location.origin}/student/qr/${studentId}`,
  getRequestById: async () => ({ __kind__: "ok", ok: sampleRequest } as unknown as Result_2),
  getReservationsForBook: async () => [],
  getReturnTimeline: async () =>
    [
      {
        requestId: "req-001",
        studentId: "SVGA-2024-001",
        studentName: "Priya Sharma",
        studentCourse: "FYJC Science",
        phone: "9876543210",
        bookTitles: ["Mathematics Part I"],
        issueDate: BigInt(1700000000000),
        returnDate: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000) * BigInt(1_000_000),
        returned: false,
        daysUntilReturn: BigInt(2),
      } as ReturnTimelineEntry,
    ],
  getStripeSessionStatus: async () =>
    ({ __kind__: "completed", completed: { response: "paid", userPrincipal: "2vxsx-fae" } }),
  getStudentByToken: async () => sampleUser,
  getStudentProfile: async () => sampleUser,
  getStudentQrUrl: async (userId: string) =>
    `${window.location.origin}/student/qr/${userId}`,
  getTransferHistory: async () => [],
  getTransfersForBook: async () => [],
  getAnalyticsData: async (): Promise<AnalyticsData> => ({
    returnedRequests: BigInt(28),
    requestsOverTime: [
      ["Jan", BigInt(12)], ["Feb", BigInt(18)], ["Mar", BigInt(24)],
      ["Apr", BigInt(15)], ["May", BigInt(30)], ["Jun", BigInt(22)],
      ["Jul", BigInt(19)], ["Aug", BigInt(35)], ["Sep", BigInt(28)],
      ["Oct", BigInt(42)], ["Nov", BigInt(38)], ["Dec", BigInt(25)],
    ] as Array<[string, bigint]>,
    rejectedRequests: BigInt(7),
    totalStudents: BigInt(148),
    activeStudents: BigInt(120),
    booksIssued: BigInt(52),
    booksAvailable: BigInt(96),
    reservedBooks: BigInt(12),
    dueReturns: BigInt(3),
    waitingListCount: BigInt(8),
    pendingRequests: BigInt(14),
    approvedRequests: BigInt(52),
    lowStockBooks: BigInt(8),
    totalBooks: BigInt(sampleBooks.length),
    booksOverdue: BigInt(3),
    totalProcurements: BigInt(5),
    totalReservations: BigInt(12),
    booksByCategory: [
      ["Science / FYJC", BigInt(18)], ["Commerce", BigInt(15)],
      ["Engineering", BigInt(12)], ["Medical", BigInt(10)],
      ["Arts", BigInt(8)], ["SYJC", BigInt(9)], ["CA/CS", BigInt(5)],
    ] as Array<[string, bigint]>,
  }),
  importBooksFromCsv: async () =>
    ({ __kind__: "ok", ok: { processed: BigInt(0), skipped: BigInt(0), errors: [] } } as unknown as Result_28),
  isCallerAdmin: async () => false,
  isStripeConfigured: async () => true,
  markBookReturned: async () =>
    ({ __kind__: "ok", ok: { ...sampleRequest, status: "Returned" } } as unknown as Result_2),
  recordPayment: async () => ({ __kind__: "ok", ok: samplePayment } as unknown),
  searchBooks: async (term: string) =>
    sampleBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(term.toLowerCase()) ||
        b.author.toLowerCase().includes(term.toLowerCase()) ||
        b.category.toLowerCase().includes(term.toLowerCase()),
    ),
  searchInventory: async (term: string) =>
    sampleBooks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(term.toLowerCase()) ||
          b.author.toLowerCase().includes(term.toLowerCase()),
      )
      .slice(0, 10),
  searchRequests: async () => [sampleRequest],
  searchStudents: async (term: string) => {
    const users = [
      sampleUser,
      { ...sampleUser, studentId: "SVGA-2024-002", name: "Rahul Patil", course: "SYJC Commerce" },
    ];
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term.toLowerCase()) ||
        u.studentId.toLowerCase().includes(term.toLowerCase()),
    );
  },
  seedBooks: async () => ({ __kind__: "ok", ok: BigInt(sampleBooks.length) } as unknown as Result_4),
  sendOtp: async (_aadhaarNumber: string) =>
    ({ __kind__: "ok", ok: { otp: "123456", demo: true } } as unknown as Result_5),
  setAdminCredentials: async () => ({ __kind__: "ok", ok: null } as unknown),
  setReturnDate: async () => ({ __kind__: "ok", ok: null } as unknown),
  setStripeConfiguration: async () => undefined,
  studentLogout: async () => undefined,
  studentSignupAndPay: async (aadhaarNumber, _otp, name) =>
    ({
      __kind__: "ok",
      ok: {
        token: "mock_paid_token",
        userId: `SVGA-2024-${Date.now().toString().slice(-4)}`,
        user: { ...sampleUser, name, aadhaarNumber, membershipStatus: MembershipStatus.PAID },
      },
    } as unknown as Result),
  transferBook: async () =>
    ({
      __kind__: "ok",
      ok: {
        id: "tr-001",
        bookId: "book-001",
        fromStudentId: "SVGA-2024-001",
        toStudentId: "SVGA-2024-002",
        transferDate: BigInt(Date.now() * 1_000_000),
      } as Transfer,
    } as unknown as Result_4),
  transform: async (_input) => ({ status: BigInt(200), body: new Uint8Array(), headers: [] }),
  updateBook: async () => ({ __kind__: "ok", ok: sampleBooks[0] } as unknown as Result_3),
  updateIssuedBookStatus: async () => ({ __kind__: "ok", ok: null } as unknown),
  updateProcurementStatus: async () => ({ __kind__: "ok", ok: null } as unknown),
  updateRequestStatus: async () =>
    ({ __kind__: "ok", ok: sampleRequest } as unknown as Result_2),
  verifyOtpAndLogin: async (aadhaarNumber, _otp, name, phone, course, college) =>
    ({
      __kind__: "ok",
      ok: {
        token: "mock_token",
        userId: sampleUser.studentId,
        user: {
          ...sampleUser,
          aadhaarNumber,
          name: name || sampleUser.name,
          phone: phone || sampleUser.phone,
          course: course || sampleUser.course,
          college: college || sampleUser.college,
        },
      },
    } as unknown as Result),
  verifyStudentToken: async () => sampleUser,
  adminLogin: async () =>
    ({
      __kind__: "ok",
      ok: { token: "svga_admin:mock", expiresAt: BigInt(Date.now() + 86400000) * BigInt(1_000_000) },
    } as AdminLoginResult),
} as unknown as backendInterface;
