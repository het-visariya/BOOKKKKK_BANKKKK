/** User returned by the canister */
export interface User {
  _id: string;
  name: string;
  /** Structured name fields */
  firstName?: string;
  middleName?: string;
  grandFatherName?: string;
  surname?: string;
  /** Custom surname when 'Not In The List' is selected */
  customSurname?: string;
  /** Whether 'Not In The List' was selected in surname dropdown */
  notInList?: boolean;
  /** Village from dropdown */
  village?: string;
  /** Custom village when 'Other' is selected */
  customVillage?: string;
  /** Whether 'Other' was selected in village dropdown */
  otherVillage?: boolean;
  /** Official surname if different from registered surname */
  officialSurnameIfDifferent?: string;
  /** Date of birth in ISO format */
  birthDate?: string;
  /** Parent/guardian contact number */
  parentContactNumber?: string;
  /** Current living address */
  currentLivingPlace?: string;
  /** Education level, e.g. SSC, HSC, Graduate, Post-Graduate */
  educationLevel?: string;
  /** Specialization, e.g. Science, Commerce, Arts */
  educationSpecialization?: string;
  /** Occupation, e.g. Student, Self-Employed, etc. */
  occupation?: string;
  /** Specified occupation when 'Other' selected */
  specifyIfOther?: string;
  /** Academic year, e.g. "2024-25" */
  academicYear?: string;
  /** Email address — MANDATORY. Used for notifications, challans, and password recovery */
  email: string;
  /** Aadhaar-based auth */
  aadhaarNumber: string;
  phone: string;
  /** Whether Aadhaar is frozen (read-only after OTP verification) */
  frozenAadhaar?: boolean;
  /** Whether phone is frozen (read-only after OTP verification) */
  frozenPhone?: boolean;
  course?: string;
  /** Custom course name when 'Other' selected */
  customCourse?: string;
  college?: string;
  /** Standard / Year — mandatory field */
  standardYear?: string;
  studentId: string;
  membershipStatus: "PAID" | "NOT_PAID";
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED";
  /** Whether user has completed profile setup */
  profileCompleted?: boolean;
  /** Whether user has uploaded profile photo */
  photoUploaded?: boolean;
  role: "student" | "admin";
  profilePhoto?: string;
  /** Legacy field — same as profilePhoto */
  profileImageUrl?: string;
  issuedBooks: IssuedBook[];
  /** Legacy field populated by backend */
  issuedBooksInfo?: IssuedBookInfo[];
  createdAt: string;
}

export interface IssuedBook {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  issueDate: string;
  returnDate: string;
  returned: boolean;
}

/** Legacy shape used in DashboardPage / StudentQrPage */
export interface IssuedBookInfo {
  requestId: string;
  bookTitle: string;
  bookAuthor: string;
  issueDate?: string;
  returnDate?: string;
  returned: boolean;
}

export interface Book {
  _id: string;
  /** Legacy alias */
  bookId?: string;
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  /** Legacy alias */
  availableCount?: number;
  createdAt: string;
}

export interface BookInput {
  title: string;
  author: string;
  edition: string;
  publisher: string;
  category: string;
  quantity: number;
}

export interface BookCsvRow {
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  category?: string;
  quantity?: number;
  available?: number;
}

export interface CsvImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export interface SelectedBook {
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  issueDate: string;
  returnDate: string;
  returned: boolean;
}

export interface RequestedBook {
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  note?: string;
  imageUrl?: string;
  decision?: string;
}

/** Legacy alias used by some pages */
export type RequestedBookPublic = RequestedBook;

export interface BookApproval {
  bookId: string;
  /** "Accept" | "Reject" | "AcceptReservation" | "RejectReservation" */
  action: string;
  expectedDate?: string;
}

export interface CollectionEntry {
  entryId: string;
  requestId: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  approvalDate: string; // ISO
  collectionDeadline: string; // ISO
  collected: boolean;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorType: string;
  action: string;
  resourceId: string;
  timestamp: bigint | string; // ISO or nanoseconds bigint
  details?: string;
}

export interface BookRequest {
  _id?: string;
  /** Legacy field */
  requestId: string;
  userId: string;
  studentName: string;
  studentAadhaar?: string;
  studentPhone?: string;
  studentEmail?: string;
  studentYear?: string;
  studentCourse: string;
  studentId: string;
  selectedBookIds: string[];
  selectedBooks: SelectedBook[];
  requestedBooks: RequestedBook[];
  /** Per-book approvals from admin */
  bookApprovals?: BookApproval[];
  /** Per-book decisions from admin (new workflow) */
  bookDecisions?: BookDecision[];
  /** Special/manual book requests */
  specialRequests?: SpecialRequest[];
  /** Challan ID if generated */
  challanId?: string;
  status: "Pending" | "Approved" | "Procured" | "Rejected" | "Returned";
  challanGenerated: boolean;
  challanData?: string;
  /** ISO string or nanosecond bigint-as-string */
  createdAt: string;
}

/** Smart book availability result */
export interface BookAvailability {
  available: boolean;
  expectedReturnDate?: number; // ms timestamp
  waitingCount: number;
  daysUntilReturn?: number;
}

export interface Reservation {
  id: string;
  studentId: string;
  bookId: string;
  requestDate: string; // ISO
  expectedAvailabilityDate?: string; // ISO
  status: "Waiting" | "Fulfilled" | "Cancelled";
  queuePosition?: number;
}

export interface ProcurementRequest {
  id: string;
  studentId: string;
  bookTitle: string;
  bookId?: string;
  author?: string;
  edition?: string;
  publisher?: string;
  requestDate: string; // ISO
  urgency: "Required" | "Optional";
  status:
    | "Pending"
    | "Ordered"
    | "Procured"
    | "ReadyForCollection"
    | "Arrived"
    | "Issued"
    | "Returned"
    | "Approved"
    | "Cancelled";
}

export interface Notification {
  id: string;
  userId: string;
  kind: string;
  title: string;
  message: string;
  actionUrl?: string;
  timestamp: number;
  isRead: boolean;
}

export interface Transfer {
  id: string;
  bookId: string;
  fromStudentId: string;
  toStudentId: string;
  transferDate: string; // ISO
  adminNotes?: string;
  challanId?: string;
}

export interface InventoryLifecycleItem {
  bookId: string;
  bookTitle: string;
  author: string;
  edition: string;
  publisher: string;
  totalQuantity: number;
  availableCount: number;
  currentHolders: Array<{
    studentId: string;
    studentName: string;
    issueDate: string;
    expectedReturnDate: string;
  }>;
  waitingQueue: Array<{
    studentId: string;
    studentName: string;
    reservationDate: string;
  }>;
  procurementRequests: ProcurementRequest[];
}

export interface BookReturningEntry {
  requestId: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  returnDate: string; // ISO
  daysUntilReturn: number;
  nextReservedStudent?: {
    studentId: string;
    studentName: string;
  };
}

/** Challan data including reservations and procurement requests */
export interface ChallanData {
  requestId: string;
  studentName: string;
  studentCourse: string;
  studentAadhaar?: string;
  selectedBookIds: string[];
  requestedBooks: RequestedBook[];
  reservations: Reservation[];
  procurementRequests: ProcurementRequest[];
  status: string;
  createdAt: string;
}

/** Manual/special book request (matches backend SpecialRequest) */
export interface SpecialRequest {
  title: string;
  author: string;
  edition: string;
  publisher: string;
  status: string;
  reason?: string;
  procurementId?: string;
  expectedAvailabilityDate?: bigint | string;
}

/** Decision made by admin on a single book in a collection order */
export interface BookDecision {
  bookId: string;
  bookName: string;
  bookNumber: string;
  inventoryId: string;
  decision:
    | "Approved"
    | "Rejected"
    | "Reserved"
    | "Pending"
    | "SpecialOrder"
    | "Ordered"
    | "Arrived"
    | "ReadyForCollection"
    | "Issued"
    | "Returned"
    | string;
  reason?: string;
  expectedReturnDate?: string;
  currentHolder?: string;
  procurementCreated?: boolean;
}

/** Collection order generated after admin finalizes a request */
export interface CollectionOrder {
  orderId: string;
  orderNumber: string;
  collectionDate: string;
  collectionTime: string;
  collectionLocation: string;
  bookDecisions: BookDecision[];
  studentId: string;
  studentName: string;
  requestId: string;
  adminName: string;
  generatedAt: string;
  challanId?: string;
  studentEmail?: string;
  studentPhone?: string;
  studentCourse?: string;
  status?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

/** Legacy alias */
export type AuthResult = AuthResponse;

export interface AdminLoginResult {
  success: boolean;
  token: string;
  expiresAt: number;
  username: string;
}

export interface AnalyticsData {
  totalStudents: number;
  activeMembers: number;
  totalBooks: number;
  totalIssuedBooks: number;
  pendingRequests: number;
  approvedRequests: number;
  procuredRequests: number;
  rejectedRequests: number;
  returnedRequests: number;
  totalRevenue: number;
  lowStockBooks?: number;
  requestsOverTime?: [string, number][];
  booksByCategory?: [string, number][];
  courseDistribution: Array<{ course: string; count: number }>;
}

export interface ReturnTimelineItem {
  requestId: string;
  studentName: string;
  studentId: string;
  bookTitle: string;
  bookAuthor: string;
  returnDate: string;
  daysRemaining: number;
  urgency: "red" | "yellow" | "green" | "overdue";
}

export interface Payment {
  _id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
}

/** Student session persisted in localStorage (Aadhaar+OTP based) */
export interface StudentSession {
  token: string;
  userId: string;
  aadhaarNumber: string;
  email: string;
  name: string;
  phone: string;
  course: string;
  membershipStatus: "PAID" | "NOT_PAID";
  user: User;
  expiresAt: number;
}

// ─── Notification System ───────────────────────────────────────────────────────

/** Delivery channel for notifications */
export type NotificationChannel = "website" | "email" | "sms" | "whatsapp";

/** All notification event types */
export type NotificationEventType =
  | "registration_success"
  | "payment_success"
  | "book_approved"
  | "book_rejected"
  | "book_reserved"
  | "book_available"
  | "return_reminder"
  | "due_date_reminder"
  | "course_completion"
  | "year_promotion"
  | "challan_generated"
  | "procurement_needed"
  | "procurement_ready"
  | "waiting_list_update";

/** Template for a notification */
export interface NotificationTemplate {
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  /** Whether to attach the challan PDF */
  attachChallan?: boolean;
}

/** Status of a notification delivery */
export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "demo";

/** Record of a sent notification */
export interface NotificationDeliveryRecord {
  id: string;
  userId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  error?: string;
  /** Message ID from external provider (Twilio, MSG91, etc.) */
  providerId?: string;
}

/** OTP request payload */
export interface OtpRequest {
  aadhaarNumber: string;
  phone: string;
  email?: string;
}

/** OTP verification payload */
export interface OtpVerification {
  aadhaarNumber: string;
  otp: string;
  phone?: string;
}

/** OTP send result */
export interface OtpSendResult {
  success: boolean;
  otp?: string; // only present in demo mode
  demo: boolean;
  message?: string;
}

/** Approved surname constants */
export const APPROVED_SURNAMES = [
  "Bauva",
  "Buricha",
  "Charla",
  "Chhadwa",
  "Chheda",
  "Dagha",
  "Dedhia",
  "Furiya",
  "Gada",
  "Gala",
  "Gindra",
  "Gogri",
  "Karia",
  "Khirani-Gala",
  "Khuthia",
  "Mamania",
  "Mota",
  "Nandu",
  "Nisar",
  "Rambhia",
  "Rita",
  "Satra",
  "Savla",
  "Shah",
  "Vadhan",
  "Visaria",
  "Vora",
] as const;

export type ApprovedSurname = (typeof APPROVED_SURNAMES)[number];

/** Approved village constants */
export const APPROVED_VILLAGES = [
  "Adhoi",
  "Bhachau",
  "Bharudia",
  "Gagodar",
  "Ghanithar",
  "Halra",
  "Kakrava",
  "Kharoi",
  "Lakadiya",
  "Manafra",
  "Nandasar",
  "N. Trambo",
  "Rav",
  "Samkhiyari",
  "Shivlakha",
  "Suvai",
  "Thoriyari",
  "Trambo",
  "Vanoi",
] as const;

export type ApprovedVillage = (typeof APPROVED_VILLAGES)[number];

export type RequestStatus =
  | "Pending"
  | "Approved"
  | "Procured"
  | "Rejected"
  | "Returned";

export interface ManualBookEntry {
  title: string;
  author: string;
  edition: string;
  publisher: string;
  imageUrl: string;
  note?: string;
}

export interface RegistrationFormData {
  /** Step 1 — Identity verification */
  email: string;
  aadhaarNumber: string;
  phone: string;
  /** Step 2 — Name details */
  firstName: string;
  middleName: string;
  grandFatherName: string;
  surname: string;
  customSurname?: string;
  notInList?: boolean;
  /** Step 2 — Village */
  village?: string;
  customVillage?: string;
  otherVillage?: boolean;
  /** Step 2 — Additional details */
  officialSurnameIfDifferent?: string;
  birthDate?: string;
  parentContactNumber?: string;
  currentLivingPlace?: string;
  educationLevel?: string;
  educationSpecialization?: string;
  occupation?: string;
  specifyIfOther?: string;
  /** Step 2 — Academic details */
  course: string;
  customCourse?: string;
  standardYear?: string;
  college?: string;
  profileImageFile?: File;
  /** Legacy full name */
  name?: string;
}

export type StudentStep = "details" | "payment" | "books" | "confirm";
export type BookSelectionStep = "search" | "review" | "confirmation";

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

/** Admin session stored in localStorage under 'svga_admin_session' */
export interface AdminSessionState {
  token: string;
  expiresAt: number;
  username?: string;
}

/** Return urgency classification based on days remaining */
export type ReturnUrgency = "overdue" | "urgent" | "warning" | "normal";

/** Membership status enum compat */
export const MembershipStatus = { PAID: "PAID", NOT_PAID: "NOT_PAID" } as const;
export type MembershipStatusType =
  (typeof MembershipStatus)[keyof typeof MembershipStatus];
/** Alias for backwards compat with old Motoko type */
export type UserPublic = User;
