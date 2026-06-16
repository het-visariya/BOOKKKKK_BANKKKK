import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AnalyticsData {
    returnedRequests: bigint;
    requestsOverTime: Array<[string, bigint]>;
    waitingListCount: bigint;
    rejectedRequests: bigint;
    activeStudents: bigint;
    totalProcurements: bigint;
    totalStudents: bigint;
    totalReservations: bigint;
    booksIssued: bigint;
    pendingRequests: bigint;
    approvedRequests: bigint;
    booksAvailable: bigint;
    lowStockBooks: bigint;
    reservedBooks: bigint;
    totalBooks: bigint;
    booksOverdue: bigint;
    booksByCategory: Array<[string, bigint]>;
    dueReturns: bigint;
}
export type Result_2 = {
    __kind__: "ok";
    ok: UserPublic;
} | {
    __kind__: "err";
    err: string;
};
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserPublic {
    occupation: string;
    paymentStatus: string;
    studentId: UserId;
    parentContact: string;
    birthDate: string;
    nativePlace: string;
    grandFatherName: string;
    educationSpecialization: string;
    name: string;
    createdAt: Timestamp;
    role: UserRole;
    issuedBooksInfo: Array<IssuedBookInfo>;
    surname: string;
    frozenPhone: boolean;
    email: string;
    membershipStatus: MembershipStatus;
    academicYear: string;
    middleName: string;
    membershipStartDate: Timestamp;
    frozenAadhaar: boolean;
    paymentId: string;
    currentLocation: string;
    aadhaarNumber: string;
    phone: string;
    course: string;
    courseName: string;
    officialSurname: string;
    educationLevel: string;
    profileImageUrl: string;
    college: string;
    occupationOther: string;
    firstName: string;
}
export interface BookInput {
    title: string;
    edition: string;
    publisher: string;
    author: string;
    quantity: bigint;
    category: string;
}
export interface AuditEntry {
    id: string;
    action: AuditAction;
    actorName?: string;
    actorType: ActorType;
    studentName?: string;
    resourceId: string;
    requestNumber?: string;
    actorId: string;
    adminName?: string;
    resourceType?: string;
    bookDecisions: Array<AuditBookDecision>;
    timestamp: Timestamp;
    details?: string;
    userAgent?: string;
    ipAddress?: string;
}
export type Result_5 = {
    __kind__: "ok";
    ok: Book;
} | {
    __kind__: "err";
    err: string;
};
export type Result_4 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface CollectionEntry {
    bookTitle: string;
    requestId: RequestId;
    studentId: UserId;
    studentName: string;
    bookId: BookId;
    collectionDeadline: Timestamp;
    approvalDate: Timestamp;
    entryId: string;
    collected: boolean;
}
export interface EmailSendResult {
    messageId?: string;
    sentAt: Timestamp;
    error?: string;
    success: boolean;
}
export interface BookDetailView {
    title: string;
    decision?: BookDecision;
    bookNumber: string;
    edition: string;
    subject: string;
    publisher: string;
    queueLength: bigint;
    bookId: BookId;
    author: string;
    expectedReturnDate?: Timestamp;
    currentHolder?: string;
    inventoryId: string;
    availabilityStatus: string;
}
export type ChallanId = string;
export type Result_7 = {
    __kind__: "ok";
    ok: {
        otp: string;
        demo: boolean;
    };
} | {
    __kind__: "err";
    err: string;
};
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface AuthResult {
    token: string;
    userId: string;
    user: UserPublic;
}
export type Result_28 = {
    __kind__: "ok";
    ok: Reservation;
} | {
    __kind__: "err";
    err: string;
};
export interface RequestOutcome {
    requestId: RequestId;
    challanId?: ChallanId;
    requestNumber: string;
    rejectedBooks: Array<BookDecision>;
    collectionOrderId?: string;
    approvedBooks: Array<BookDecision>;
    reservedBooks: Array<BookDecision>;
    overallStatus: string;
    collectionDate: string;
    collectionLocation: string;
    collectionTime: string;
}
export type Result_6 = {
    __kind__: "ok";
    ok: Transfer;
} | {
    __kind__: "err";
    err: string;
};
export interface IssuedBookInfo {
    bookTitle: string;
    issueDate: Timestamp;
    status: string;
    requestId: RequestId;
    studentName: string;
    userId: UserId;
    bookId: BookId;
    bookIds: Array<BookId>;
    expectedReturnDate: Timestamp;
    returnDate?: Timestamp;
    returned: boolean;
}
export type Result_26 = {
    __kind__: "ok";
    ok: CompleteApprovalResult;
} | {
    __kind__: "err";
    err: string;
};
export type Result_9 = {
    __kind__: "ok";
    ok: Notification;
} | {
    __kind__: "err";
    err: string;
};
export type Result_12 = {
    __kind__: "ok";
    ok: {
        reservation: Reservation;
        queuePosition: bigint;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Payment {
    status: string;
    userId: UserId;
    createdAt: Timestamp;
    paymentId: PaymentId;
    stripePaymentId: string;
    amount: bigint;
}
export type UserId = string;
export interface RequestDetails {
    request: BookRequest;
    specialRequests: Array<SpecialRequest>;
    student: UserPublic;
    books: Array<BookDetailView>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type Result_10 = {
    __kind__: "ok";
    ok: EmailSendResult;
} | {
    __kind__: "err";
    err: string;
};
export type Result = {
    __kind__: "ok";
    ok: WaitingListAssignment;
} | {
    __kind__: "err";
    err: string;
};
export type PaymentId = string;
export type NotificationId = string;
export interface NotificationDeliveryStatus {
    status: DeliveryStatus;
    sentAt?: Timestamp;
    error?: string;
    channel: NotificationChannel;
}
export interface NotificationBookOutcome {
    status: BookDecisionStatus;
    bookNumber: string;
    bookName: string;
    edition: string;
    author: string;
    expectedAvailabilityDate?: Timestamp;
    expectedReturnDate?: Timestamp;
    currentHolder?: string;
    reason?: string;
}
export type NotificationEventType = string;
export interface Notification {
    id: NotificationId;
    title: string;
    actionUrl?: string;
    userId: string;
    kind: NotificationKind;
    deliveryStatus: Array<NotificationDeliveryStatus>;
    isRead: boolean;
    challanUrl?: string;
    message: string;
    timestamp: Timestamp;
    emailSent: boolean;
    bookOutcomes: Array<NotificationBookOutcome>;
    collectionDate?: string;
    collectionLocation?: string;
    collectionTime?: string;
    eventType?: string;
    readAt?: Timestamp;
}
export interface CompleteApprovalResult {
    collectionOrder: CollectionOrder;
    request: BookRequest;
    challan: Challan;
}
export interface BookCsvRow {
    title: string;
    availableCopies: bigint;
    edition: string;
    publisher: string;
    author: string;
    totalCopies: bigint;
    category: string;
}
export type Timestamp = bigint;
export interface WaitingListAssignment {
    assigned: boolean;
    nextStudentId?: UserId;
    newRequestId?: RequestId;
    nextStudentName?: string;
    collectionOrderId?: CollectionOrderId;
}
export interface ReturnTimelineEntry {
    issueDate: Timestamp;
    requestId: RequestId;
    studentId: UserId;
    studentName: string;
    bookTitles: Array<string>;
    daysUntilReturn: bigint;
    phone: string;
    studentCourse: string;
    returnDate?: Timestamp;
    returned: boolean;
    nextReservedStudent?: string;
}
export type Result_25 = {
    __kind__: "ok";
    ok: Array<AuditEntry>;
} | {
    __kind__: "err";
    err: string;
};
export type Result_17 = {
    __kind__: "ok";
    ok: CsvImportResult;
} | {
    __kind__: "err";
    err: string;
};
export type Result_13 = {
    __kind__: "ok";
    ok: SpecialRequest;
} | {
    __kind__: "err";
    err: string;
};
export interface RequestedBookPublic {
    title: string;
    edition: string;
    publisher: string;
    author: string;
    imageUrl: string;
}
export interface ProviderConfig {
    whatsAppApiKey?: string;
    whatsAppProvider?: WhatsAppProvider;
    smsSenderId?: string;
    smsProvider?: SmsProvider;
    smsApiKey?: string;
    whatsAppSenderId?: string;
}
export type Result_16 = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type Result_1 = {
    __kind__: "ok";
    ok: AuthResult;
} | {
    __kind__: "err";
    err: string;
};
export interface Transfer {
    id: TransferId;
    transferDate: Timestamp;
    challanId?: ChallanId;
    bookId: BookId;
    toStudentId: UserId;
    fromStudentId: UserId;
    adminNotes?: string;
}
export type Result_27 = {
    __kind__: "ok";
    ok: ProcurementRequest;
} | {
    __kind__: "err";
    err: string;
};
export type Result_22 = {
    __kind__: "ok";
    ok: CollectionOrder;
} | {
    __kind__: "err";
    err: string;
};
export type Result_11 = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "err";
    err: string;
};
export interface ProcurementRequest {
    id: ProcurementId;
    bookTitle: string;
    status: ProcurementStatus;
    studentId: UserId;
    edition?: string;
    urgency: ProcurementUrgency;
    publisher?: string;
    bookId?: BookId;
    author?: string;
    requestDate: Timestamp;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type Result_29 = {
    __kind__: "ok";
    ok: {
        waitingCount: bigint;
        available: boolean;
        expectedReturnDate?: Timestamp;
        daysUntilReturn?: bigint;
    };
} | {
    __kind__: "err";
    err: string;
};
export type Result_19 = {
    __kind__: "ok";
    ok: {
        pending: bigint;
        demo: bigint;
        sent: bigint;
        failed: bigint;
    };
} | {
    __kind__: "err";
    err: string;
};
export type Result_24 = {
    __kind__: "ok";
    ok: Challan;
} | {
    __kind__: "err";
    err: string;
};
export type Result_14 = {
    __kind__: "ok";
    ok: BookDecision;
} | {
    __kind__: "err";
    err: string;
};
export type RequestId = string;
export type CollectionOrderId = string;
export interface CollectionOrder {
    status: Variant_Collected_Cancelled_Completed_Pending;
    studentEmail: string;
    requestId: RequestId;
    studentId: UserId;
    studentName: string;
    studentYear: string;
    challanId?: ChallanId;
    generatedAt: Timestamp;
    specialRequests: Array<SpecialRequest>;
    studentPhone: string;
    orderedBooks: Array<BookDecision>;
    rejectedBooks: Array<BookDecision>;
    orderId: string;
    returnedBooks: Array<BookDecision>;
    arrivedBooks: Array<BookDecision>;
    adminName: string;
    bookDecisions: Array<BookDecision>;
    approvedBooks: Array<BookDecision>;
    reservedBooks: Array<BookDecision>;
    studentCourse: string;
    issuedBooks: Array<BookDecision>;
    orderNumber: string;
    readyForCollectionBooks: Array<BookDecision>;
    collectionDate: string;
    collectionLocation: string;
    collectionTime: string;
}
export interface ChallanPdfData {
    adminSignaturePlaceholder: string;
    studentSignaturePlaceholder: string;
    qrCodeUrl: string;
    collectionOrderNumber: string;
    challan: Challan;
    collectionDate: string;
    collectionLocation: string;
    collectionTime: string;
}
export interface Challan {
    challanNumber: string;
    trackingEvents: Array<string>;
    status: string;
    studentEmail: string;
    signatureAdmin?: string;
    signatureStudent?: string;
    procurementRequests: Array<ProcurementRequest>;
    studentId: UserId;
    qrCodeData?: string;
    studentName: string;
    studentYear: string;
    challanId: ChallanId;
    reservations: Array<Reservation>;
    trackedBookIds: Array<BookId>;
    generatedAt: Timestamp;
    specialRequests: Array<SpecialRequest>;
    createdAt: Timestamp;
    availabilityDates: Array<BookAvailabilityDate>;
    studentPhone: string;
    requestNumber: RequestId;
    orderedBooks: Array<ChallanBookEntry>;
    rejectedBooks: Array<ChallanBookEntry>;
    returnedBooks: Array<ChallanBookEntry>;
    arrivedBooks: Array<ChallanBookEntry>;
    adminName: string;
    totalAmount: bigint;
    bookDecisions: Array<BookDecision>;
    pdfUrl?: string;
    qrCodeUrl: string;
    approvedBooks: Array<ChallanBookEntry>;
    reservedBooks: Array<ChallanBookEntry>;
    manualBooks: Array<ChallanBookEntry>;
    collectionOrderNumber: string;
    issuedBookIds: Array<BookId>;
    studentCourse: string;
    issuedBooks: Array<ChallanBookEntry>;
    readyForCollectionBooks: Array<ChallanBookEntry>;
    expectedDates: Array<BookAvailabilityDate>;
    collectionDate: string;
    collectionTime: string;
}
export type BookId = string;
export interface BookAvailabilityDate {
    bookTitle: string;
    bookId: BookId;
    expectedDate: Timestamp;
}
export interface AuditBookDecision {
    status: BookDecisionStatus;
    bookNumber: string;
    bookName: string;
    author: string;
    reason?: string;
}
export interface CsvImportResult {
    skipped: bigint;
    errors: Array<string>;
    processed: bigint;
}
export interface SpecialRequest {
    status: BookDecisionStatus;
    title: string;
    edition: string;
    publisher: string;
    procurementId?: ProcurementId;
    author: string;
    expectedAvailabilityDate?: Timestamp;
    reason?: string;
}
export interface Reservation {
    id: ReservationId;
    status: ReservationStatus;
    studentId: UserId;
    bookId: BookId;
    expectedAvailabilityDate?: Timestamp;
    requestDate: Timestamp;
}
export type ReservationId = string;
export type Result_21 = {
    __kind__: "ok";
    ok: RequestOutcome;
} | {
    __kind__: "err";
    err: string;
};
export interface StudentProfileUpdate {
    occupation: string;
    parentContact: string;
    birthDate: string;
    nativePlace: string;
    grandFatherName: string;
    educationSpecialization: string;
    surname: string;
    email: string;
    academicYear: string;
    middleName: string;
    currentLocation: string;
    course: string;
    courseName: string;
    officialSurname: string;
    educationLevel: string;
    college: string;
    occupationOther: string;
    firstName: string;
}
export type ProcurementId = string;
export interface BookRequest {
    issueDate?: Timestamp;
    status: string;
    bookApprovals: Array<[BookId, string]>;
    studentEmail: string;
    studentAadhaar: string;
    requestId: RequestId;
    studentId: string;
    studentName: string;
    studentYear: string;
    challanId?: ChallanId;
    requestNotes?: string;
    userId: UserId;
    specialRequests: Array<SpecialRequest>;
    createdAt: Timestamp;
    requestedBooks: Array<RequestedBookPublic>;
    studentPhone: string;
    requestNumber: string;
    collectionOrderId?: string;
    adminName?: string;
    updatedAt: Timestamp;
    bookDecisions: Array<BookDecision>;
    adminId?: string;
    studentCourse: string;
    challanData: string;
    returnDate?: Timestamp;
    returned: boolean;
    selectedBookIds: Array<BookId>;
    collectionDate: string;
    collectionLocation: string;
    collectionTime: string;
}
export interface ChallanBookEntry {
    status: BookDecisionStatus;
    title: string;
    bookNumber: string;
    edition: string;
    subject: string;
    publisher: string;
    currentHolderStudentId?: string;
    bookId: BookId;
    queuePosition?: bigint;
    author: string;
    expectedAvailabilityDate?: Timestamp;
    expectedReturnDate?: Timestamp;
    currentHolder?: string;
    reason?: string;
}
export interface BookDecision {
    decision: BookDecisionStatus;
    bookNumber: string;
    bookName: string;
    edition: string;
    subject: string;
    publisher: string;
    procurementId?: ProcurementId;
    currentHolderStudentId?: string;
    bookId: BookId;
    queuePosition?: bigint;
    author: string;
    procurementCreated: boolean;
    expectedReturnDate?: Timestamp;
    currentHolder?: string;
    inventoryId: string;
    reason?: string;
}
export type Result_18 = {
    __kind__: "ok";
    ok: RequestDetails;
} | {
    __kind__: "err";
    err: string;
};
export interface Book {
    title: string;
    isDeleted: boolean;
    edition: string;
    availableQuantity: bigint;
    publisher: string;
    createdAt: Timestamp;
    waitingQueue: Array<UserId>;
    isAvailable: boolean;
    bookId: BookId;
    availableCount: bigint;
    author: string;
    quantity: bigint;
    category: string;
    currentHolders: Array<UserId>;
    totalQuantity: bigint;
}
export type Result_3 = {
    __kind__: "ok";
    ok: BookRequest;
} | {
    __kind__: "err";
    err: string;
};
export type TransferId = string;
export type Result_23 = {
    __kind__: "ok";
    ok: ChallanPdfData;
} | {
    __kind__: "err";
    err: string;
};
export type Result_15 = {
    __kind__: "ok";
    ok: Payment;
} | {
    __kind__: "err";
    err: string;
};
export type AdminLoginResult = {
    __kind__: "ok";
    ok: {
        token: string;
        expiresAt: Timestamp;
    };
} | {
    __kind__: "err";
    err: string;
};
export type Result_20 = {
    __kind__: "ok";
    ok: {
        demoMode: boolean;
        whatsAppConfigured: boolean;
        smsConfigured: boolean;
    };
} | {
    __kind__: "err";
    err: string;
};
export enum ActorType {
    Student = "Student",
    Admin = "Admin"
}
export enum AuditAction {
    BookRequest = "BookRequest",
    RequestOpened = "RequestOpened",
    ChallanGenerated = "ChallanGenerated",
    BookIssue = "BookIssue",
    ProfileUpdate = "ProfileUpdate",
    NotificationSent = "NotificationSent",
    BookReturn = "BookReturn",
    ReservationCreation = "ReservationCreation",
    BookReserved = "BookReserved",
    RequestFinalized = "RequestFinalized",
    CollectionOrderGenerated = "CollectionOrderGenerated",
    StudentRegistration = "StudentRegistration",
    BookRejection = "BookRejection",
    BookApproval = "BookApproval",
    BookCollected = "BookCollected",
    AdminChange = "AdminChange",
    CollectionDateAssigned = "CollectionDateAssigned"
}
export enum BookDecisionStatus {
    Arrived = "Arrived",
    Reserved = "Reserved",
    Ordered = "Ordered",
    Purchased = "Purchased",
    SpecialOrder = "SpecialOrder",
    ReadyForCollection = "ReadyForCollection",
    Approved = "Approved",
    Rejected = "Rejected",
    Issued = "Issued",
    Returned = "Returned",
    Pending = "Pending"
}
export enum DeliveryStatus {
    Failed = "Failed",
    Demo = "Demo",
    Sent = "Sent",
    Pending = "Pending"
}
export enum MembershipStatus {
    PAID = "PAID",
    NOT_PAID = "NOT_PAID"
}
export enum NotificationChannel {
    SMS = "SMS",
    Email = "Email",
    WhatsApp = "WhatsApp",
    Website = "Website"
}
export enum NotificationKind {
    BookReadyForCollection = "BookReadyForCollection",
    ReturnAlert = "ReturnAlert",
    CourseCompletion = "CourseCompletion",
    PaymentSuccess = "PaymentSuccess",
    QueueUpdate = "QueueUpdate",
    RegistrationSuccess = "RegistrationSuccess",
    ChallanGenerated = "ChallanGenerated",
    General = "General",
    BookReserved = "BookReserved",
    ProcurementNeeded = "ProcurementNeeded",
    DueDateReminder = "DueDateReminder",
    BookApproved = "BookApproved",
    ReservationFulfilled = "ReservationFulfilled",
    BookAvailable = "BookAvailable",
    YearPromotion = "YearPromotion",
    BookTransferred = "BookTransferred",
    ReturnReminder = "ReturnReminder",
    BookRejected = "BookRejected"
}
export enum ProcurementStatus {
    Procured = "Procured",
    Ordered = "Ordered",
    ReadyForCollection = "ReadyForCollection",
    Approved = "Approved",
    Issued = "Issued",
    Cancelled = "Cancelled",
    Returned = "Returned",
    Pending = "Pending"
}
export enum ProcurementUrgency {
    Required_ = "Required",
    Optional = "Optional"
}
export enum ReservationStatus {
    Waiting = "Waiting",
    Cancelled = "Cancelled",
    Fulfilled = "Fulfilled"
}
export enum SmsProvider {
    Fast2SMS = "Fast2SMS",
    Twilio = "Twilio",
    MSG91 = "MSG91"
}
export enum UserRole {
    admin = "admin",
    student = "student"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_Collected_Cancelled_Completed_Pending {
    Collected = "Collected",
    Cancelled = "Cancelled",
    Completed = "Completed",
    Pending = "Pending"
}
export enum Variant_RejectReservation_Reject_Accept_AcceptReservation {
    RejectReservation = "RejectReservation",
    Reject = "Reject",
    Accept = "Accept",
    AcceptReservation = "AcceptReservation"
}
export enum WhatsAppProvider {
    Meta = "Meta",
    Twilio = "Twilio"
}
export enum YearPromotionChoice {
    ContinueNextYear = "ContinueNextYear",
    ReturnBooks = "ReturnBooks"
}
export interface backendInterface {
    addBook(adminToken: string, title: string, author: string, edition: string, publisher: string, category: string, quantity: bigint): Promise<Result_5>;
    adminLogin(username: string, password: string): Promise<AdminLoginResult>;
    adminUpdateStudentProfile(adminToken: string, studentId: UserId, update: StudentProfileUpdate): Promise<Result_2>;
    approveBook(adminToken: string, requestId: RequestId, bookId: BookId): Promise<Result_14>;
    approveBookAndUpdateChallan(adminToken: string, requestId: RequestId, bookId: BookId, action: Variant_RejectReservation_Reject_Accept_AcceptReservation, expectedDate: string | null, adminName: string): Promise<{
        __kind__: "ok";
        ok: {
            request: BookRequest;
            challan: Challan;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveSpecialBook(adminToken: string, requestId: RequestId, bookIndex: bigint): Promise<Result_13>;
    approveSpecialBookRequest(adminToken: string, requestId: RequestId, bookTitle: string): Promise<Result_27>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    cancelReservation(token: string, reservationId: ReservationId): Promise<Result_4>;
    checkBookAvailability(bookId: BookId): Promise<Result_29>;
    completeApproval(adminToken: string, requestId: RequestId, collectionDate: string, collectionTime: string, collectionLocation: string, adminName: string): Promise<Result_26>;
    completeProfileAndPay(token: string, firstName: string, middleName: string, grandFatherName: string, surname: string, course: string, academicYear: string, college: string, profileImageUrl: string, birthDate: string, parentContact: string, nativePlace: string, educationLevel: string, educationSpecialization: string, occupation: string, occupationOther: string, officialSurname: string, courseName: string, currentLocation: string): Promise<Result_1>;
    configureNotificationProviders(adminToken: string, config: ProviderConfig): Promise<Result_4>;
    createAdminNotification(adminToken: string, targetUserId: string, title: string, message: string, actionUrl: string | null): Promise<Result_9>;
    createBookRequest(jwtToken: string, selectedBookIds: Array<BookId>, requestedBooks: Array<RequestedBookPublic>): Promise<Result_3>;
    createBookReservation(token: string, bookId: BookId, expectedAvailabilityDate: Timestamp | null): Promise<Result_28>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createProcurementRequest(token: string, bookTitle: string, bookId: BookId | null, author: string | null, edition: string | null, publisher: string | null, urgency: ProcurementUrgency): Promise<Result_27>;
    createReservation(token: string, bookId: BookId, expectedAvailabilityDate: Timestamp | null): Promise<Result_28>;
    createStudentNotification(adminToken: string, studentId: UserId, eventType: NotificationEventType, title: string, message: string, actionUrl: string | null): Promise<Result_9>;
    createUrgentProcurementRequest(token: string, bookTitle: string, bookId: BookId | null, author: string | null, edition: string | null, publisher: string | null): Promise<Result_27>;
    deleteBook(adminToken: string, bookId: BookId): Promise<Result_4>;
    finalizeRequest(adminToken: string, requestId: RequestId, collectionDate: string, collectionTime: string, collectionLocation: string): Promise<Result_26>;
    generateChallanForRequest(adminToken: string, requestId: RequestId, adminName: string): Promise<{
        __kind__: "ok";
        ok: Challan;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAdminNotifications(adminToken: string): Promise<Array<Notification>>;
    getAdminPendingCount(adminToken: string): Promise<bigint>;
    getAdminReturnAlerts(adminToken: string): Promise<Array<{
        bookTitle: string;
        requestId: RequestId;
        studentId: UserId;
        studentName: string;
        urgency: string;
        bookId: BookId;
        daysUntilReturn: bigint;
        returnDate?: Timestamp;
        nextReservedStudent?: {
            studentId: UserId;
            studentName: string;
        };
    }>>;
    getAllBooks(adminToken: string): Promise<Array<Book>>;
    getAllChallans(adminToken: string): Promise<Array<Challan>>;
    getAllCollectionOrders(adminToken: string): Promise<Array<CollectionOrder>>;
    getAllProcurements(adminToken: string): Promise<Array<ProcurementRequest>>;
    getAllRequests(adminToken: string): Promise<Array<BookRequest>>;
    getAllUsers(adminToken: string): Promise<Array<UserPublic>>;
    getAnalyticsData(adminToken: string): Promise<AnalyticsData>;
    getAuditLog(adminToken: string, actorIdFilter: string | null, actionFilter: AuditAction | null, startTime: Timestamp | null, endTime: Timestamp | null): Promise<Result_25>;
    getAuditLogs(adminToken: string, filterStudentId: string | null, filterAction: AuditAction | null, fromTimestamp: Timestamp | null, toTimestamp: Timestamp | null, limit: bigint): Promise<Array<AuditEntry>>;
    getAvailableDropOptions(): Promise<{
        villages: Array<string>;
        surnames: Array<string>;
    }>;
    getBookById(bookId: BookId): Promise<Result_5>;
    getBookLifecycleFlow(adminToken: string): Promise<Array<{
        bookTitle: string;
        bookId: BookId;
        currentHolder?: {
            issueDate: Timestamp;
            userId: UserId;
            name: string;
            returnDate?: Timestamp;
        };
        nextReservedStudent?: {
            reservationDate: Timestamp;
            userId: UserId;
            name: string;
        };
    }>>;
    getBookRecommendations(bookId: BookId): Promise<Array<Book>>;
    getBooksReturningByDate(adminToken: string, days: bigint): Promise<Array<{
        bookTitle: string;
        requestId: RequestId;
        studentId: UserId;
        studentName: string;
        bookId: BookId;
        daysUntilReturn: bigint;
        returnDate: Timestamp;
        nextReservedStudent?: {
            studentId: UserId;
            studentName: string;
        };
    }>>;
    getCallerUserRole(): Promise<UserRole__1>;
    getChallan(token: string, challanId: ChallanId): Promise<Result_24>;
    getChallanById(token: string, challanId: ChallanId): Promise<Challan | null>;
    getChallanPdfData(token: string, challanId: ChallanId): Promise<Result_23>;
    getCollectionOrder(token: string, requestId: RequestId): Promise<Result_22>;
    getCollectionOrderByNumber(token: string, orderNumber: string): Promise<Result_22>;
    getCollectionOrdersByAdmin(adminToken: string): Promise<Array<CollectionOrder>>;
    getCollectionOrdersByStudent(jwtToken: string, studentId: UserId): Promise<Array<CollectionOrder>>;
    getCollectionQueue(adminToken: string): Promise<Array<CollectionEntry>>;
    getCompletedForms(adminToken: string): Promise<Array<BookRequest>>;
    getInventoryLifecycle(adminToken: string): Promise<Array<{
        bookTitle: string;
        procurementRequests: Array<ProcurementRequest>;
        edition: string;
        publisher: string;
        waitingQueue: Array<{
            studentId: UserId;
            studentName: string;
            reservationDate: Timestamp;
        }>;
        bookId: BookId;
        availableCount: bigint;
        author: string;
        currentHolders: Array<{
            issueDate: Timestamp;
            studentId: UserId;
            studentName: string;
            expectedReturnDate: Timestamp;
        }>;
        totalQuantity: bigint;
    }>>;
    getManualBooksToPurchase(adminToken: string): Promise<Array<BookRequest>>;
    getMyChallans(jwtToken: string): Promise<Array<Challan>>;
    getMyChallansList(token: string): Promise<Array<Challan>>;
    getMyIssuedBooks(jwtToken: string): Promise<Array<BookRequest>>;
    getMyNotifications(token: string): Promise<Array<Notification>>;
    getMyProcurements(token: string): Promise<Array<ProcurementRequest>>;
    getMyRequestOutcome(jwtToken: string, requestId: RequestId): Promise<Result_21>;
    getMyRequests(jwtToken: string): Promise<Array<BookRequest>>;
    getMyReservations(token: string): Promise<Array<Reservation>>;
    getNotificationConfig(adminToken: string): Promise<Result_20>;
    getNotificationDeliveryStatus(token: string, notifId: NotificationId): Promise<Result_19>;
    getPaymentStatus(jwtToken: string): Promise<Result_15>;
    getPendingRequests(adminToken: string): Promise<Array<{
        status: string;
        requestId: RequestId;
        studentId: string;
        studentName: string;
        phoneNumber: string;
        course: string;
        requestDate: Timestamp;
        totalBooksCount: bigint;
    }>>;
    getPendingRequestsFull(adminToken: string): Promise<Array<BookRequest>>;
    getQrCodeData(studentId: string, requestId: RequestId): Promise<string>;
    getRequestById(token: string, requestId: RequestId): Promise<Result_3>;
    getRequestDetails(adminToken: string, requestId: RequestId): Promise<Result_18>;
    getReservationsForBook(bookId: BookId): Promise<Array<Reservation>>;
    getReturnTimeline(adminToken: string): Promise<Array<ReturnTimelineEntry>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getStudentByToken(token: string): Promise<UserPublic | null>;
    getStudentChallans(adminToken: string, studentId: UserId): Promise<Array<Challan>>;
    getStudentProfile(userId: UserId): Promise<UserPublic | null>;
    getStudentQrUrl(userId: UserId): Promise<string>;
    getTransferHistory(adminToken: string): Promise<Array<Transfer>>;
    getTransfersForBook(bookId: BookId): Promise<Array<Transfer>>;
    getUnreadCount(token: string): Promise<bigint>;
    importBooksFromCsv(adminToken: string, rows: Array<BookCsvRow>): Promise<Result_17>;
    initiateYearPromotion(adminToken: string, academicYear: string): Promise<bigint>;
    isAadhaarAvailable(aadhaarNumber: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isEmailAvailable(email: string): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    markAllNotificationsRead(token: string): Promise<Result_4>;
    markBookCollected(adminToken: string, requestId: RequestId, bookId: BookId): Promise<Result_4>;
    markBookReturned(adminToken: string, requestId: RequestId): Promise<Result_3>;
    markNotificationRead(token: string, notifId: NotificationId): Promise<Result_4>;
    processYearPromotion(studentToken: string, choice: YearPromotionChoice): Promise<Result_16>;
    recordPayment(jwtToken: string, stripePaymentId: string, amount: bigint): Promise<Result_15>;
    rejectBook(adminToken: string, requestId: RequestId, bookId: BookId, reason: string | null): Promise<Result_14>;
    rejectSpecialBook(adminToken: string, requestId: RequestId, bookIndex: bigint, reason: string | null): Promise<Result_13>;
    rejectSpecialBookRequest(adminToken: string, requestId: RequestId, bookTitle: string, reason: string | null): Promise<Result_4>;
    reserveBook(adminToken: string, requestId: RequestId, bookId: BookId, expectedAvailabilityDate: Timestamp | null): Promise<Result_12>;
    searchBooks(searchTerm: string, course: string): Promise<Array<Book>>;
    searchInventory(searchQuery: string, category: string | null, availabilityFilter: string | null): Promise<Array<Book>>;
    searchRequests(adminToken: string, searchQuery: string, statusFilter: string | null, course: string | null): Promise<Array<BookRequest>>;
    searchStudents(adminToken: string, searchQuery: string, course: string | null, membershipStatus: string | null): Promise<Array<UserPublic>>;
    seedBooks(adminToken: string, booksInput: Array<BookInput>): Promise<Result_11>;
    sendChallanEmail(adminToken: string, challanId: ChallanId): Promise<{
        __kind__: "ok";
        ok: EmailSendResult;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendEmailNotification(adminToken: string, toEmail: string, subject: string, body: string, attachmentUrl: string | null): Promise<Result_10>;
    sendLifecycleEmail(studentId: UserId, eventType: NotificationEventType, bookTitle: string | null, extraInfo: string | null, challanUrl: string | null): Promise<Result_10>;
    sendMultiChannelNotification(adminToken: string, studentId: UserId, eventType: string, bookTitle: string | null, extraInfo: string | null, channels: Array<NotificationChannel>): Promise<Result_9>;
    sendOtp(aadhaarNumber: string, phone: string): Promise<Result_7>;
    sendOtpWithEmail(email: string, aadhaarNumber: string, phone: string): Promise<Result_7>;
    setAdminCredentials(adminToken: string, username: string, passwordHash: string): Promise<Result_4>;
    setReturnDate(adminToken: string, requestId: RequestId, returnDate: Timestamp): Promise<Result_4>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    studentLogout(token: string): Promise<void>;
    studentSignupAndPay(aadhaarNumber: string, otp: string, name: string, phone: string, course: string, college: string, profileImageUrl: string): Promise<Result_1>;
    transferBook(adminToken: string, fromStudentId: UserId, toStudentId: UserId, bookId: BookId, adminNotes: string | null): Promise<Result_6>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    triggerReturnReminders(adminToken: string): Promise<bigint>;
    updateBook(adminToken: string, bookId: BookId, title: string, author: string, edition: string, publisher: string, category: string, quantity: bigint, availableCount: bigint): Promise<Result_5>;
    updateBookApproval(adminToken: string, requestId: RequestId, bookId: BookId, action: Variant_RejectReservation_Reject_Accept_AcceptReservation, expectedDate: string | null): Promise<Result_3>;
    updateIssuedBookStatus(adminToken: string, requestId: RequestId, returned: boolean): Promise<Result_4>;
    updateManualBookStatus(adminToken: string, requestId: RequestId, bookTitle: string, newStatus: BookDecisionStatus): Promise<Result_4>;
    updateProcurementStatus(adminToken: string, procurementId: ProcurementId, status: ProcurementStatus): Promise<Result_4>;
    updateRequestStatus(adminToken: string, requestId: RequestId, status: string): Promise<Result_3>;
    updateStudent(adminToken: string, userId: UserId, firstName: string, middleName: string, grandFatherName: string, surname: string, phone: string, aadhaar: string, course: string, academicYear: string, membershipStatusText: string, issueStatusText: string): Promise<Result_2>;
    updateStudentProfile(token: string, update: StudentProfileUpdate): Promise<Result_2>;
    verifyOtpAndLogin(aadhaarNumber: string, otp: string, name: string, phone: string, course: string, college: string): Promise<Result_1>;
    verifyOtpWithEmail(email: string, aadhaarNumber: string, otp: string, phone: string): Promise<Result_1>;
    verifyStudentToken(token: string): Promise<UserPublic | null>;
    waitingListAutoAssign(adminToken: string, bookId: BookId, returnedFromRequestId: RequestId): Promise<Result>;
}
