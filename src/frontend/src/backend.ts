export type Result<T> =
  | { __kind__: "ok"; ok: T }
  | { __kind__: "err"; err: string };

export enum BookDecisionStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Reserved = "Reserved",
  SpecialOrder = "SpecialOrder",
  Ordered = "Ordered",
  Arrived = "Arrived",
  ReadyForCollection = "ReadyForCollection",
  Issued = "Issued",
  Returned = "Returned",
}

export enum MembershipStatus {
  PAID = "PAID",
  NOT_PAID = "NOT_PAID",
}

export enum ProcurementStatus {
  Pending = "Pending",
  Ordered = "Ordered",
  Procured = "Procured",
  ReadyForCollection = "ReadyForCollection",
  Arrived = "Arrived",
  Issued = "Issued",
  Returned = "Returned",
  Approved = "Approved",
  Cancelled = "Cancelled",
}

export enum ProcurementUrgency {
  Required = "Required",
  Optional = "Optional",
}

export enum UserRole {
  student = "student",
  admin = "admin",
}

export enum UserRole__1 {
  student = "student",
  admin = "admin",
}

export interface Book {
  bookId: string;
  title: string;
  author: string;
  edition: string;
  publisher: string;
  category: string;
  quantity: bigint | number;
  availableCount: bigint | number;
  availableQuantity: bigint | number;
  totalQuantity: bigint | number;
  isDeleted?: boolean;
  isAvailable?: boolean;
  createdAt?: bigint | number | string | Date;
  waitingQueue?: unknown[];
  currentHolders?: unknown[];
  [key: string]: unknown;
}

export interface UserPublic {
  studentId: string;
  name: string;
  firstName?: string;
  middleName?: string;
  grandFatherName?: string;
  surname?: string;
  academicYear?: string;
  aadhaarNumber?: string;
  phone?: string;
  course?: string;
  college?: string;
  frozenAadhaar?: boolean;
  frozenPhone?: boolean;
  profileImageUrl?: string;
  membershipStatus?: MembershipStatus | string;
  paymentStatus?: string;
  createdAt?: bigint | number | string | Date;
  issuedBooksInfo: Array<{
    requestId?: string;
    bookTitle?: string;
    issueDate?: bigint | number | string | Date;
    returnDate?: bigint | number | string | Date;
    returned?: boolean;
    [key: string]: unknown;
  }>;
  email?: string;
  role?: UserRole | string;
  [key: string]: unknown;
}

export interface BookInput {
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  category?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface BookCsvRow {
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  category?: string;
  quantity?: number;
  available?: number;
  [key: string]: unknown;
}

export interface RequestedBookPublic {
  title: string;
  author: string;
  edition?: string;
  publisher?: string;
  note?: string;
  imageUrl?: string;
  decision?: string;
  [key: string]: unknown;
}

export interface BookRequest {
  requestId: string;
  userId?: string;
  studentName?: string;
  studentAadhaar?: string;
  studentPhone?: string;
  studentEmail?: string;
  studentYear?: string;
  studentCourse?: string;
  studentId?: string;
  selectedBookIds: string[];
  selectedBooks: unknown[];
  requestedBooks: RequestedBookPublic[];
  bookDecisions: unknown[];
  specialRequests: unknown[];
  status: string;
  challanData?: unknown;
  createdAt?: bigint | number | string | Date;
  [key: string]: unknown;
}

export interface Notification {
  id?: string;
  userId?: string;
  kind?: string;
  title?: string;
  message?: string;
  actionUrl?: string;
  timestamp?: number;
  isRead?: boolean;
  [key: string]: unknown;
}

export interface ProcurementRequest {
  id?: string;
  studentId?: string;
  bookTitle?: string;
  bookId?: string;
  author?: string;
  edition?: string;
  publisher?: string;
  requestDate?: bigint | number | string | Date;
  urgency?: ProcurementUrgency | string;
  status?: ProcurementStatus | string;
  [key: string]: unknown;
}

export interface Reservation {
  id?: string;
  studentId?: string;
  bookId?: string;
  requestDate?: bigint | number | string | Date;
  expectedAvailabilityDate?: bigint | number | string | Date;
  status?: string;
  [key: string]: unknown;
}

export interface Transfer {
  id?: string;
  bookId?: string;
  fromStudentId?: string;
  toStudentId?: string;
  transferDate?: bigint | number | string | Date;
  adminNotes?: string;
  challanId?: string;
  [key: string]: unknown;
}

export interface ReturnTimelineEntry {
  requestId?: string;
  studentName?: string;
  studentId?: string;
  bookTitles?: string[];
  returnDate?: bigint | number | string | Date;
  daysUntilReturn?: bigint | number;
  [key: string]: unknown;
}

export interface BookDetailView {
  bookId?: string;
  title?: string;
  bookNumber?: string;
  inventoryId?: string;
  subject?: string;
  edition?: string;
  author?: string;
  publisher?: string;
  availabilityStatus?: string;
  currentHolder?: string;
  expectedReturnDate?: bigint | number | string | Date;
  queueLength?: bigint | number;
  decision?: unknown;
  [key: string]: unknown;
}

export interface AnalyticsData {
  totalStudents?: bigint | number;
  totalBooks?: bigint | number;
  pendingRequests?: bigint | number;
  approvedRequests?: bigint | number;
  rejectedRequests?: bigint | number;
  returnedRequests?: bigint | number;
  lowStockBooks?: bigint | number;
  requestsOverTime?: Array<[string, bigint | number]>;
  booksByCategory?: Array<[string, bigint | number]>;
  [key: string]: unknown;
}

export interface AdminLoginResult {
  success: boolean;
  token: string;
  expiresAt: number;
  username: string;
  [key: string]: unknown;
}

export interface backendInterface {
  [key: string]: unknown;
}

export class Backend implements backendInterface {
  [key: string]: unknown;

  constructor(..._args: unknown[]) {
    void _args;
  }
}

export function createRestActor(): Backend {
  return new Backend();
}
