import Map "mo:core/Map";
import Common "types/common";
import BookDecisionTypes "types/book-decision";
import BookTypes "types/book";
import RequestTypes "types/request";
import PaymentTypes "types/payment";
import ReservationTypes "types/reservation";
import ProcurementTypes "types/procurement";
import TransferTypes "types/transfer";
import ChallanTypes "types/challan";
import NotifTypes "types/notification";
import CollectionOrderTypes "types/collection-order";
import EmailNotifTypes "types/notifications";
import AuditTypes "types/audit";
import UserTypes "types/user";

/// Migration module: adds #Purchased variant to BookDecisionStatus.
///
/// The old BookDecisionStatus did NOT have #Purchased.
/// The new BookDecisionStatus adds #Purchased between #Ordered and #Arrived.
///
/// Since no existing records can have #Purchased (it is brand new), this is a
/// pure identity migration: all values pass through unchanged.
module {

  // ---------------------------------------------------------------------------
  // Old types (inline — do not import from .old/)
  // These mirror the types as they were in the previously-deployed canister,
  // i.e. BookDecisionStatus WITHOUT #Purchased.
  // ---------------------------------------------------------------------------

  type OldBookDecisionStatus = {
    #Pending;
    #Approved;
    #Rejected;
    #Reserved;
    #Ordered;
    #Arrived;
    #ReadyForCollection;
    #Issued;
    #Returned;
    #SpecialOrder;
  };

  type OldBookDecision = {
    bookId : Common.BookId;
    bookName : Text;
    bookNumber : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    subject : Text;
    inventoryId : Text;
    decision : OldBookDecisionStatus;
    reason : ?Text;
    currentHolder : ?Text;
    currentHolderStudentId : ?Text;
    expectedReturnDate : ?Common.Timestamp;
    queuePosition : ?Nat;
    procurementCreated : Bool;
    procurementId : ?Common.ProcurementId;
  };

  type OldSpecialRequest = {
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    status : OldBookDecisionStatus;
    procurementId : ?Common.ProcurementId;
    reason : ?Text;
    expectedAvailabilityDate : ?Common.Timestamp;
  };

  type OldChallanBookEntry = {
    bookId : Common.BookId;
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    subject : Text;
    bookNumber : Text;
    status : OldBookDecisionStatus;
    reason : ?Text;
    currentHolder : ?Text;
    currentHolderStudentId : ?Text;
    expectedReturnDate : ?Common.Timestamp;
    queuePosition : ?Nat;
    expectedAvailabilityDate : ?Common.Timestamp;
  };

  type OldNotificationBookOutcome = {
    bookName : Text;
    bookNumber : Text;
    author : Text;
    edition : Text;
    status : OldBookDecisionStatus;
    reason : ?Text;
    currentHolder : ?Text;
    expectedReturnDate : ?Common.Timestamp;
    expectedAvailabilityDate : ?Common.Timestamp;
  };

  type OldAuditBookDecision = {
    bookName : Text;
    bookNumber : Text;
    author : Text;
    status : OldBookDecisionStatus;
    reason : ?Text;
  };

  // BookRequest uses BookDecision and SpecialRequest
  type OldBookRequest = {
    requestId : Common.RequestId;
    userId : Common.UserId;
    selectedBookIds : [Common.BookId];
    requestedBooks : [RequestTypes.RequestedBookPublic];
    status : Text;
    challanData : Text;
    challanId : ?Common.ChallanId;
    createdAt : Common.Timestamp;
    issueDate : ?Common.Timestamp;
    returnDate : ?Common.Timestamp;
    returned : Bool;
    studentName : Text;
    studentPhone : Text;
    studentCourse : Text;
    studentAadhaar : Text;
    bookApprovals : [(Common.BookId, Text)];
    studentEmail : Text;
    studentYear : Text;
    requestNumber : Text;
    collectionDate : Text;
    collectionTime : Text;
    collectionLocation : Text;
    collectionOrderId : ?Text;
    bookDecisions : [OldBookDecision];
    specialRequests : [OldSpecialRequest];
    studentId : Text;
    updatedAt : Common.Timestamp;
    adminId : ?Text;
    adminName : ?Text;
    requestNotes : ?Text;
  };

  type OldChallan = {
    challanId : Common.ChallanId;
    challanNumber : Text;
    requestNumber : Common.RequestId;
    studentId : Common.UserId;
    studentName : Text;
    studentEmail : Text;
    studentPhone : Text;
    studentCourse : Text;
    studentYear : Text;
    adminName : Text;
    generatedAt : Common.Timestamp;
    totalAmount : Nat;
    issuedBookIds : [Common.BookId];
    approvedBooks : [OldChallanBookEntry];
    rejectedBooks : [OldChallanBookEntry];
    reservedBooks : [OldChallanBookEntry];
    manualBooks : [OldChallanBookEntry];
    orderedBooks : [OldChallanBookEntry];
    arrivedBooks : [OldChallanBookEntry];
    readyForCollectionBooks : [OldChallanBookEntry];
    issuedBooks : [OldChallanBookEntry];
    returnedBooks : [OldChallanBookEntry];
    reservations : [ReservationTypes.Reservation];
    procurementRequests : [ProcurementTypes.ProcurementRequest];
    expectedDates : [ChallanTypes.BookAvailabilityDate];
    availabilityDates : [ChallanTypes.BookAvailabilityDate];
    createdAt : Common.Timestamp;
    status : Text;
    bookDecisions : [OldBookDecision];
    specialRequests : [OldSpecialRequest];
    collectionDate : Text;
    collectionTime : Text;
    collectionOrderNumber : Text;
    qrCodeUrl : Text;
    qrCodeData : ?Text;
    pdfUrl : ?Text;
    signatureAdmin : ?Text;
    signatureStudent : ?Text;
    trackedBookIds : [Common.BookId];
    trackingEvents : [Text];
  };

  type OldNotificationDeliveryStatus = {
    channel : NotifTypes.NotificationChannel;
    status : NotifTypes.DeliveryStatus;
    sentAt : ?Common.Timestamp;
    error : ?Text;
  };

  type OldNotification = {
    id : NotifTypes.NotificationId;
    userId : Text;
    kind : NotifTypes.NotificationKind;
    eventType : ?Text;
    title : Text;
    message : Text;
    actionUrl : ?Text;
    challanUrl : ?Text;
    timestamp : Common.Timestamp;
    isRead : Bool;
    deliveryStatus : [OldNotificationDeliveryStatus];
    emailSent : Bool;
    bookOutcomes : [OldNotificationBookOutcome];
    collectionDate : ?Text;
    collectionTime : ?Text;
    collectionLocation : ?Text;
    readAt : ?Common.Timestamp;
  };

  type OldAuditEntry = {
    id : Text;
    actorId : Text;
    actorType : AuditTypes.ActorType;
    action : AuditTypes.AuditAction;
    resourceId : Text;
    timestamp : Common.Timestamp;
    details : ?Text;
    studentName : ?Text;
    adminName : ?Text;
    bookDecisions : [OldAuditBookDecision];
    requestNumber : ?Text;
    actorName : ?Text;
    resourceType : ?Text;
    ipAddress : ?Text;
    userAgent : ?Text;
  };

  type OldCollectionOrder = {
    orderNumber : Text;
    orderId : Text;
    requestId : Common.RequestId;
    challanId : ?Common.ChallanId;
    studentId : Common.UserId;
    studentName : Text;
    studentEmail : Text;
    studentPhone : Text;
    studentCourse : Text;
    studentYear : Text;
    adminName : Text;
    generatedAt : Common.Timestamp;
    collectionDate : Text;
    collectionTime : Text;
    collectionLocation : Text;
    bookDecisions : [OldBookDecision];
    specialRequests : [OldSpecialRequest];
    approvedBooks : [OldBookDecision];
    rejectedBooks : [OldBookDecision];
    reservedBooks : [OldBookDecision];
    orderedBooks : [OldBookDecision];
    arrivedBooks : [OldBookDecision];
    readyForCollectionBooks : [OldBookDecision];
    issuedBooks : [OldBookDecision];
    returnedBooks : [OldBookDecision];
    status : {
      #Pending;
      #Completed;
      #Collected;
      #Cancelled;
    };
  };

  // ---------------------------------------------------------------------------
  // OldActor / NewActor — mirror the stable fields in main.mo
  // ---------------------------------------------------------------------------

  public type OldActor = {
    users          : Map.Map<Common.UserId,           UserTypes.User>;
    books          : Map.Map<Common.BookId,           BookTypes.Book>;
    requests       : Map.Map<Common.RequestId,        OldBookRequest>;
    payments       : Map.Map<Common.PaymentId,        PaymentTypes.Payment>;
    reservations   : Map.Map<Common.ReservationId,   ReservationTypes.Reservation>;
    procurements   : Map.Map<Common.ProcurementId,   ProcurementTypes.ProcurementRequest>;
    transfers      : Map.Map<Common.TransferId,      TransferTypes.Transfer>;
    challans       : Map.Map<Common.ChallanId,       OldChallan>;
    notifications  : Map.Map<NotifTypes.NotificationId, OldNotification>;
    collectionOrders : Map.Map<Common.CollectionOrderId, OldCollectionOrder>;
    emailLogs      : Map.Map<Text,                   EmailNotifTypes.EmailNotificationLog>;
    auditLog       : Map.Map<Text,                   OldAuditEntry>;

    userCounter              : { var value : Nat };
    bookCounter              : { var value : Nat };
    requestCounter           : { var value : Nat };
    paymentCounter           : { var value : Nat };
    reservationCounter       : { var value : Nat };
    procurementCounter       : { var value : Nat };
    transferCounter          : { var value : Nat };
    challanCounter           : { var value : Nat };
    notificationCounter      : { var value : Nat };
    collectionOrderCounter   : { var value : Nat };
    emailLogCounter          : { var value : Nat };
    auditCounter             : { var value : Nat };

    idMigrationState         : { var done : Bool };
    adminUsername            : { var value : Text };
    adminPasswordHash        : { var value : Text };

    userCounterValue         : Nat;
    bookCounterValue         : Nat;
    requestCounterValue      : Nat;
    paymentCounterValue      : Nat;
    reservationCounterValue  : Nat;
    procurementCounterValue  : Nat;
    transferCounterValue     : Nat;
    challanCounterValue      : Nat;
    notificationCounterValue : Nat;
    collectionOrderCounterValue : Nat;
    emailLogCounterValue     : Nat;
    auditCounterValue        : Nat;
  };

  public type NewActor = {
    users          : Map.Map<Common.UserId,           UserTypes.User>;
    books          : Map.Map<Common.BookId,           BookTypes.Book>;
    requests       : Map.Map<Common.RequestId,        RequestTypes.BookRequest>;
    payments       : Map.Map<Common.PaymentId,        PaymentTypes.Payment>;
    reservations   : Map.Map<Common.ReservationId,   ReservationTypes.Reservation>;
    procurements   : Map.Map<Common.ProcurementId,   ProcurementTypes.ProcurementRequest>;
    transfers      : Map.Map<Common.TransferId,      TransferTypes.Transfer>;
    challans       : Map.Map<Common.ChallanId,       ChallanTypes.Challan>;
    notifications  : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>;
    collectionOrders : Map.Map<Common.CollectionOrderId, CollectionOrderTypes.CollectionOrder>;
    emailLogs      : Map.Map<Text,                   EmailNotifTypes.EmailNotificationLog>;
    auditLog       : Map.Map<Text,                   AuditTypes.AuditEntry>;

    userCounter              : { var value : Nat };
    bookCounter              : { var value : Nat };
    requestCounter           : { var value : Nat };
    paymentCounter           : { var value : Nat };
    reservationCounter       : { var value : Nat };
    procurementCounter       : { var value : Nat };
    transferCounter          : { var value : Nat };
    challanCounter           : { var value : Nat };
    notificationCounter      : { var value : Nat };
    collectionOrderCounter   : { var value : Nat };
    emailLogCounter          : { var value : Nat };
    auditCounter             : { var value : Nat };

    idMigrationState         : { var done : Bool };
    adminUsername            : { var value : Text };
    adminPasswordHash        : { var value : Text };

    userCounterValue         : Nat;
    bookCounterValue         : Nat;
    requestCounterValue      : Nat;
    paymentCounterValue      : Nat;
    reservationCounterValue  : Nat;
    procurementCounterValue  : Nat;
    transferCounterValue     : Nat;
    challanCounterValue      : Nat;
    notificationCounterValue : Nat;
    collectionOrderCounterValue : Nat;
    emailLogCounterValue     : Nat;
    auditCounterValue        : Nat;
  };

  // ---------------------------------------------------------------------------
  // Status migration helpers — identity because #Purchased cannot exist in old data
  // ---------------------------------------------------------------------------

  func migrateStatus(old : OldBookDecisionStatus) : BookDecisionTypes.BookDecisionStatus {
    switch old {
      case (#Pending)            { #Pending };
      case (#Approved)           { #Approved };
      case (#Rejected)           { #Rejected };
      case (#Reserved)           { #Reserved };
      case (#Ordered)            { #Ordered };
      case (#Arrived)            { #Arrived };
      case (#ReadyForCollection) { #ReadyForCollection };
      case (#Issued)             { #Issued };
      case (#Returned)           { #Returned };
      case (#SpecialOrder)       { #SpecialOrder };
    };
  };

  func migrateBookDecision(old : OldBookDecision) : BookDecisionTypes.BookDecision {
    {
      old with
      decision = migrateStatus(old.decision);
    };
  };

  func migrateSpecialRequest(old : OldSpecialRequest) : BookDecisionTypes.SpecialRequest {
    {
      old with
      status = migrateStatus(old.status);
    };
  };

  func migrateChallanBookEntry(old : OldChallanBookEntry) : ChallanTypes.ChallanBookEntry {
    {
      old with
      status = migrateStatus(old.status);
    };
  };

  func migrateNotifBookOutcome(old : OldNotificationBookOutcome) : NotifTypes.NotificationBookOutcome {
    {
      old with
      status = migrateStatus(old.status);
    };
  };

  func migrateAuditBookDecision(old : OldAuditBookDecision) : AuditTypes.AuditBookDecision {
    {
      old with
      status = migrateStatus(old.status);
    };
  };

  func migrateRequest(old : OldBookRequest) : RequestTypes.BookRequest {
    {
      old with
      bookDecisions    = old.bookDecisions.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      specialRequests  = old.specialRequests.map<OldSpecialRequest, BookDecisionTypes.SpecialRequest>(migrateSpecialRequest);
    };
  };

  func migrateChallan(old : OldChallan) : ChallanTypes.Challan {
    {
      old with
      approvedBooks            = old.approvedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      rejectedBooks            = old.rejectedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      reservedBooks            = old.reservedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      manualBooks              = old.manualBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      orderedBooks             = old.orderedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      arrivedBooks             = old.arrivedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      readyForCollectionBooks  = old.readyForCollectionBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      issuedBooks              = old.issuedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      returnedBooks            = old.returnedBooks.map<OldChallanBookEntry, ChallanTypes.ChallanBookEntry>(migrateChallanBookEntry);
      bookDecisions            = old.bookDecisions.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      specialRequests          = old.specialRequests.map<OldSpecialRequest, BookDecisionTypes.SpecialRequest>(migrateSpecialRequest);
    };
  };

  func migrateNotification(old : OldNotification) : NotifTypes.Notification {
    {
      old with
      bookOutcomes = old.bookOutcomes.map<OldNotificationBookOutcome, NotifTypes.NotificationBookOutcome>(migrateNotifBookOutcome);
    };
  };

  func migrateAuditEntry(old : OldAuditEntry) : AuditTypes.AuditEntry {
    {
      old with
      bookDecisions = old.bookDecisions.map<OldAuditBookDecision, AuditTypes.AuditBookDecision>(migrateAuditBookDecision);
    };
  };

  func migrateCollectionOrder(old : OldCollectionOrder) : CollectionOrderTypes.CollectionOrder {
    {
      old with
      bookDecisions           = old.bookDecisions.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      specialRequests         = old.specialRequests.map<OldSpecialRequest, BookDecisionTypes.SpecialRequest>(migrateSpecialRequest);
      approvedBooks           = old.approvedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      rejectedBooks           = old.rejectedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      reservedBooks           = old.reservedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      orderedBooks            = old.orderedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      arrivedBooks            = old.arrivedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      readyForCollectionBooks = old.readyForCollectionBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      issuedBooks             = old.issuedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
      returnedBooks           = old.returnedBooks.map<OldBookDecision, BookDecisionTypes.BookDecision>(migrateBookDecision);
    };
  };

  // ---------------------------------------------------------------------------
  // Entry point: run(old) : NewActor
  // ---------------------------------------------------------------------------

  public func run(old : OldActor) : NewActor {
    let newRequests = old.requests.map<Common.RequestId, OldBookRequest, RequestTypes.BookRequest>(
      func(_id, req) { migrateRequest(req) }
    );
    let newChallans = old.challans.map<Common.ChallanId, OldChallan, ChallanTypes.Challan>(
      func(_id, ch) { migrateChallan(ch) }
    );
    let newNotifications = old.notifications.map<NotifTypes.NotificationId, OldNotification, NotifTypes.Notification>(
      func(_id, n) { migrateNotification(n) }
    );
    let newAuditLog = old.auditLog.map<Text, OldAuditEntry, AuditTypes.AuditEntry>(
      func(_id, entry) { migrateAuditEntry(entry) }
    );
    let newCollectionOrders = old.collectionOrders.map<Common.CollectionOrderId, OldCollectionOrder, CollectionOrderTypes.CollectionOrder>(
      func(_id, co) { migrateCollectionOrder(co) }
    );

    {
      users                     = old.users;
      books                     = old.books;
      requests                  = newRequests;
      payments                  = old.payments;
      reservations              = old.reservations;
      procurements              = old.procurements;
      transfers                 = old.transfers;
      challans                  = newChallans;
      notifications             = newNotifications;
      collectionOrders          = newCollectionOrders;
      emailLogs                 = old.emailLogs;
      auditLog                  = newAuditLog;

      userCounter               = old.userCounter;
      bookCounter               = old.bookCounter;
      requestCounter            = old.requestCounter;
      paymentCounter            = old.paymentCounter;
      reservationCounter        = old.reservationCounter;
      procurementCounter        = old.procurementCounter;
      transferCounter           = old.transferCounter;
      challanCounter            = old.challanCounter;
      notificationCounter       = old.notificationCounter;
      collectionOrderCounter    = old.collectionOrderCounter;
      emailLogCounter           = old.emailLogCounter;
      auditCounter              = old.auditCounter;

      idMigrationState          = old.idMigrationState;
      adminUsername             = old.adminUsername;
      adminPasswordHash         = old.adminPasswordHash;

      userCounterValue          = old.userCounterValue;
      bookCounterValue          = old.bookCounterValue;
      requestCounterValue       = old.requestCounterValue;
      paymentCounterValue       = old.paymentCounterValue;
      reservationCounterValue   = old.reservationCounterValue;
      procurementCounterValue   = old.procurementCounterValue;
      transferCounterValue      = old.transferCounterValue;
      challanCounterValue       = old.challanCounterValue;
      notificationCounterValue  = old.notificationCounterValue;
      collectionOrderCounterValue = old.collectionOrderCounterValue;
      emailLogCounterValue      = old.emailLogCounterValue;
      auditCounterValue         = old.auditCounterValue;
    };
  };
};
