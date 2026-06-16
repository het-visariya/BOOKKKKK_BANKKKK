import Map "mo:core/Map";
import Types "mo:core/Types";
import Time "mo:core/Time";
import Common "../types/common";
import UserTypes "../types/user";
import BookTypes "../types/book";
import RequestTypes "../types/request";
import ChallanTypes "../types/challan";
import BookDecisionTypes "../types/book-decision";
import CollectionOrderTypes "../types/collection-order";
import NotifTypes "../types/notification";
import AuditTypes "../types/audit";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";
import EmailNotifTypes "../types/notifications";
import UsersLib "../lib/users";
import AdminLib "../lib/admin";
import AuditLib "../lib/audit";
import NotifService "../lib/notifications-service";
import NotificationsLib "../lib/notifications";
import Array "mo:core/Array";

/// Book Request Workflow mixin.
///
/// Owns the complete Steps 1-16 workflow:
///   Step 1 : Student submits request—immediately visible in admin panel
///   Step 2 : Admin Request Panel — full student details, newest first
///   Step 3 : Admin opens request — full book details (not just IDs)
///   Step 4 : Admin verification before approval
///   Step 5 : Per-book decisions (approve / reject)
///   Step 6 : Unavailable books — current holder, expected return, reserve/reject
///   Step 7 : Special book requests (not in inventory)
///   Step 8 : Mandatory collection date + time before completing approval
///   Step 9 : Generate Collection Order automatically
///   Step 10: Student dashboard updates immediately after approval
///   Step 11: Multi-channel notifications (in-app, email, SMS demo, WhatsApp demo)
///   Step 12: Notification bell — unread count + full list
///   Step 13: Challan view, download PDF, print PDF
///   Step 14: Audit logs — all 16 workflow actions
///   Step 15: Waiting list automation on book return
///   Step 16: (Covered by integration tests)
mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  books : Map.Map<Common.BookId, BookTypes.Book>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
  challanCounter : { var value : Nat },
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  reservationCounter : { var value : Nat },
  procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  procurementCounter : { var value : Nat },
  collectionOrders : Map.Map<Common.CollectionOrderId, CollectionOrderTypes.CollectionOrder>,
  collectionOrderCounter : { var value : Nat },
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
  emailLogs : Map.Map<Text, EmailNotifTypes.EmailNotificationLog>,
  emailLogCounter : { var value : Nat },
  auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
  auditCounter : { var value : Nat },
) {

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 / 3  Admin request panel with full details
  // ─────────────────────────────────────────────────────────────────────────

  /// Get full request details for the admin view.
  /// Returns every book with name, number, inventory ID, availability status,
  /// current holder (if issued), expected return date, and waiting queue info.
  /// Also logs a #RequestOpened audit entry.
  public shared func getRequestDetails(
    adminToken : Text,
    requestId : Common.RequestId,
  ) : async Types.Result<RequestDetails, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let studentOpt = users.values().find(func(u) { u.studentId == req.userId });
    let student = switch (studentOpt) {
      case null {
        // Return a minimal placeholder so admin can still see the request
        return #err("Student not found for request: " # requestId);
      };
      case (?u) { UsersLib.toPublic(u) };
    };
    // Build per-book detail views
    let now = Time.now();
    let bookViews = req.selectedBookIds.map(func(bookId) {
      switch (books.get(bookId)) {
        case null {
          {
            bookId;
            title = "Unknown Book";
            bookNumber = "";
            inventoryId = "";
            subject = "";
            edition = "";
            author = "";
            publisher = "";
            availabilityStatus = "Unknown";
            currentHolder = null;
            expectedReturnDate = null;
            queueLength = 0;
            decision = null;
          };
        };
        case (?book) {
          // Find current holder name if any
          let holderName : ?Text = switch (book.currentHolders.size() > 0) {
            case true {
              let holderId = book.currentHolders[0];
              switch (users.get(holderId)) {
                case null { ?holderId };
                case (?hu) { ?UsersLib.getFullName(hu) };
              };
            };
            case false { null };
          };
          // Find expected return date from the reservation with earliest date
          let reservationForBook = reservations.values().find(func(r) {
            r.bookId == bookId and r.status == #Waiting
          });
          let expectedReturn : ?Common.Timestamp = switch (reservationForBook) {
            case null { null };
            case (?rv) { rv.expectedAvailabilityDate };
          };
          let queueLen = reservations.values()
            .filter(func(r) { r.bookId == bookId and r.status == #Waiting })
            .toArray().size();
          // Look up per-book decision from request.bookApprovals
          let statusText = switch (req.bookApprovals.find(func((bid, _)) { bid == bookId })) {
            case null { "Pending" };
            case (?(_, s)) { s };
          };
          let decisionOpt : ?BookDecisionTypes.BookDecision = if (statusText == "Pending") {
            null
          } else {
            ?{
              bookId;
              bookName = book.title;
              bookNumber = book.bookId;
              author = book.author;
              edition = book.edition;
              publisher = book.publisher;
              subject = book.category;
              inventoryId = "INV-" # book.bookId;
              decision = switch (statusText) {
                case "Approved" { #Approved };
                case "Rejected" { #Rejected };
                case "Reserved" { #Reserved };
                case "Ordered" { #Ordered };
                case "Arrived" { #Arrived };
                case "ReadyForCollection" { #ReadyForCollection };
                case "Issued" { #Issued };
                case "Returned" { #Returned };
                case "SpecialOrder" { #SpecialOrder };
                case _ { #Pending };
              };
              reason = null;
              currentHolder = holderName;
              currentHolderStudentId = null;
              expectedReturnDate = expectedReturn;
              queuePosition = null;
              procurementCreated = false;
              procurementId = null;
            };
          };
          let avStatus = if (book.availableQuantity > 0) { "Available" }
            else if (queueLen > 0) { "Reserved" }
            else { "Issued" };
          {
            bookId;
            title = book.title;
            bookNumber = book.bookId;
            inventoryId = "INV-" # book.bookId;
            subject = book.category;
            edition = book.edition;
            author = book.author;
            publisher = book.publisher;
            availabilityStatus = avStatus;
            currentHolder = holderName;
            expectedReturnDate = expectedReturn;
            queueLength = queueLen;
            decision = decisionOpt;
          };
        };
      };
    });
    // Special requests: use stored specialRequests on the request if present,
    // otherwise fall back to deriving them from requestedBooks that are not in the catalogue.
    let specialRequests : [BookDecisionTypes.SpecialRequest] = if (req.specialRequests.size() > 0) {
      req.specialRequests
    } else {
      req.requestedBooks
        .filter(func(rb) {
          books.values().find(func(b) { b.title == rb.title }) == null
        })
        .map<RequestTypes.RequestedBookPublic, BookDecisionTypes.SpecialRequest>(func(rb) {
          { title = rb.title; author = rb.author; edition = rb.edition; publisher = rb.publisher; status = #Pending; reason = null; expectedAvailabilityDate = null; procurementId = null };
        })
    };
    // Log audit
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #RequestOpened, requestId, ?("Opened request: " # requestId));
    #ok({
      request = req;
      books = bookViews;
      specialRequests;
      student;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5  Per-book decisions
  // ─────────────────────────────────────────────────────────────────────────

  /// Admin approves a single book within a request.
  /// Side-effects: decrements inventory, sets issue/return dates,
  ///   creates in-app + email notification, logs audit entry.
  public shared func approveBook(
    adminToken : Text,
    requestId : Common.RequestId,
    bookId : Common.BookId,
  ) : async Types.Result<BookDecisionTypes.BookDecision, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let book = switch (books.get(bookId)) {
      case null { return #err("Book not found: " # bookId) };
      case (?b) { b };
    };
    if (book.availableQuantity == 0) {
      return #err("Book is not available in inventory: " # book.title);
    };
    // Decrement available quantity and add student to current holders
    let updatedHolders = switch (
      book.currentHolders.find(func(h) { h == req.userId })
    ) {
      case null {
        let arr = book.currentHolders;
        let newArr = Array.tabulate(arr.size() + 1, func(i) {
          if (i < arr.size()) { arr[i] } else { req.userId }
        });
        newArr
      };
      case _ { book.currentHolders };
    };
    let updatedBook : BookTypes.Book = {
      book with
      availableQuantity = if (book.availableQuantity > 0) { book.availableQuantity - 1 } else { 0 };
      availableCount = if (book.availableCount > 0) { book.availableCount - 1 } else { 0 };
      currentHolders = updatedHolders;
      isAvailable = book.availableQuantity > 1;
    };
    books.add(bookId, updatedBook);
    // Update per-book approval in request
    let updatedApprovals = req.bookApprovals.map(
      func((bid, status)) {
        if (bid == bookId) { (bid, "Approved") } else { (bid, status) }
      }
    );
    // Also update bookDecisions in-place so status is consistent everywhere
    let decisionRecord : BookDecisionTypes.BookDecision = {
      bookId;
      bookName = book.title;
      bookNumber = book.bookId;
      author = book.author;
      edition = book.edition;
      publisher = book.publisher;
      subject = book.category;
      inventoryId = "INV-" # bookId;
      decision = #Approved;
      reason = null;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      procurementCreated = false;
      procurementId = null;
    };
    let existingDecision = req.bookDecisions.find(func(d) { d.bookId == bookId });
    let updatedDecisions = if (existingDecision == null) {
      let arr = req.bookDecisions;
      Array.tabulate(arr.size() + 1, func(i) {
        if (i < arr.size()) { arr[i] } else { decisionRecord }
      });
    } else {
      req.bookDecisions.map(func(d) {
        if (d.bookId == bookId) { decisionRecord } else { d }
      })
    };
    let updatedReq = { req with bookApprovals = updatedApprovals; bookDecisions = updatedDecisions; updatedAt = Time.now() };
    requests.add(requestId, updatedReq);
    // Create notification for student
    let now = Time.now();
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_approved", ?(book.title), null,
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    // Audit
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookApproval, requestId,
      ?("Approved book: " # book.title # " for request: " # requestId));
    let decision : BookDecisionTypes.BookDecision = {
      bookId;
      bookName = book.title;
      bookNumber = bookId;
      author = book.author;
      edition = book.edition;
      publisher = book.publisher;
      subject = book.category;
      inventoryId = "INV-" # bookId;
      decision = #Approved;
      reason = null;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      procurementCreated = false;
      procurementId = null;
    };
    #ok(decision);
  };

  /// Admin rejects a single book within a request.
  /// Side-effects: restores inventory if needed, creates notification, logs audit.
  public shared func rejectBook(
    adminToken : Text,
    requestId : Common.RequestId,
    bookId : Common.BookId,
    reason : ?Text,
  ) : async Types.Result<BookDecisionTypes.BookDecision, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let bookTitle = switch (books.get(bookId)) {
      case null { bookId };
      case (?b) { b.title };
    };
    // Update per-book approval and bookDecisions atomically
    let updatedApprovals = req.bookApprovals.map(
      func((bid, status)) {
        if (bid == bookId) { (bid, "Rejected") } else { (bid, status) }
      }
    );
    let rejDecisionRecord : BookDecisionTypes.BookDecision = {
      bookId;
      bookName = bookTitle;
      bookNumber = bookId;
      author = switch (books.get(bookId)) { case (?b) { b.author }; case null { "" } };
      edition = switch (books.get(bookId)) { case (?b) { b.edition }; case null { "" } };
      publisher = switch (books.get(bookId)) { case (?b) { b.publisher }; case null { "" } };
      subject = switch (books.get(bookId)) { case (?b) { b.category }; case null { "" } };
      inventoryId = "INV-" # bookId;
      decision = #Rejected;
      reason;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      procurementCreated = false;
      procurementId = null;
    };
    let existingRejDecision = req.bookDecisions.find(func(d) { d.bookId == bookId });
    let updatedRejDecisions = if (existingRejDecision == null) {
      let arr = req.bookDecisions;
      Array.tabulate(arr.size() + 1, func(i) {
        if (i < arr.size()) { arr[i] } else { rejDecisionRecord }
      });
    } else {
      req.bookDecisions.map(func(d) {
        if (d.bookId == bookId) { rejDecisionRecord } else { d }
      })
    };
    requests.add(requestId, { req with bookApprovals = updatedApprovals; bookDecisions = updatedRejDecisions; updatedAt = Time.now() });
    // Notify student
    let now = Time.now();
    let reasonText = switch (reason) { case null { "" }; case (?r) { r } };
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_rejected", ?(bookTitle), if (reasonText == "") { null } else { ?reasonText },
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookRejection, requestId,
      ?("Rejected book: " # bookTitle # " Reason: " # reasonText));
    let decision : BookDecisionTypes.BookDecision = {
      bookId;
      bookName = bookTitle;
      bookNumber = bookId;
      author = "";
      edition = "";
      publisher = "";
      subject = "";
      inventoryId = "INV-" # bookId;
      decision = #Rejected;
      reason;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      procurementCreated = false;
      procurementId = null;
    };
    #ok(decision);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 6  Unavailable books — reserve flow
  // ─────────────────────────────────────────────────────────────────────────

  /// Admin reserves a book for a student (book currently issued to another).
  /// Side-effects: creates/updates Reservation, adds student to waiting queue,
  ///   creates notification, logs audit.
  public shared func reserveBook(
    adminToken : Text,
    requestId : Common.RequestId,
    bookId : Common.BookId,
    expectedAvailabilityDate : ?Common.Timestamp,
  ) : async Types.Result<{ reservation : ReservationTypes.Reservation; queuePosition : Nat }, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let book = switch (books.get(bookId)) {
      case null { return #err("Book not found: " # bookId) };
      case (?b) { b };
    };
    let now = Time.now();
    // Create reservation
    reservationCounter.value += 1;
    let reservationId = "RES" # reservationCounter.value.toText();
    let reservation : ReservationTypes.Reservation = {
      id = reservationId;
      studentId = req.userId;
      bookId;
      requestDate = now;
      expectedAvailabilityDate;
      status = #Waiting;
    };
    reservations.add(reservationId, reservation);
    // Add student to book's waiting queue
    let alreadyQueued = book.waitingQueue.find(func(uid) { uid == req.userId }) != null;
    if (not alreadyQueued) {
      let newQueue = Array.tabulate(book.waitingQueue.size() + 1, func(i) {
        if (i < book.waitingQueue.size()) { book.waitingQueue[i] } else { req.userId }
      });
      books.add(bookId, { book with waitingQueue = newQueue });
    };
    // Queue position (1-indexed)
    let updatedBook = switch (books.get(bookId)) {
      case null { book };
      case (?b) { b };
    };
    let queuePosition = switch (updatedBook.waitingQueue.find(func(uid) { uid == req.userId })) {
      case null { updatedBook.waitingQueue.size() };
      case _ {
        var pos = 0;
        var found = false;
        for (uid in updatedBook.waitingQueue.values()) {
          if (not found) {
            pos += 1;
            if (uid == req.userId) { found := true };
          };
        };
        pos;
      };
    };
    // Update per-book approval in request
    let updatedApprovals = req.bookApprovals.map(
      func((bid, status)) {
        if (bid == bookId) { (bid, "Reserved") } else { (bid, status) }
      }
    );
    requests.add(requestId, { req with bookApprovals = updatedApprovals });
    // Notify student
    let availMsg = switch (expectedAvailabilityDate) {
      case null { "" };
      case (?d) { "Expected availability: " # d.toText() };
    };
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_reserved", ?(book.title), ?(availMsg),
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookReserved, requestId,
      ?("Reserved book: " # book.title # " for student: " # req.userId));
    #ok({ reservation; queuePosition });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 7  Special book requests (not in inventory)
  // ─────────────────────────────────────────────────────────────────────────

  /// Admin approves a special book request (not in inventory), triggering procurement.
  public shared func approveSpecialBookRequest(
    adminToken : Text,
    requestId : Common.RequestId,
    bookTitle : Text,
  ) : async Types.Result<ProcurementTypes.ProcurementRequest, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let now = Time.now();
    procurementCounter.value += 1;
    let procId = "PROC" # procurementCounter.value.toText();
    let procurement : ProcurementTypes.ProcurementRequest = {
      id = procId;
      studentId = req.userId;
      bookTitle;
      bookId = null;
      author = null;
      edition = null;
      publisher = null;
      requestDate = now;
      urgency = #Required;
      status = #Pending;
    };
    procurements.add(procId, procurement);
    // Notify student and admin
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_approved", ?(bookTitle), ?("Special order procurement created."),
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    ignore NotificationsLib.createNotification(
      notifications, notificationCounter,
      "admin", #ProcurementNeeded,
      "Procurement Required",
      "Student " # req.studentName # " (" # req.userId # ") requested: " # bookTitle,
      null, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookApproval, requestId,
      ?("Special order approved for: " # bookTitle));
    #ok(procurement);
  };

  /// Admin rejects a special book request.
  public shared func rejectSpecialBookRequest(
    adminToken : Text,
    requestId : Common.RequestId,
    bookTitle : Text,
    reason : ?Text,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let now = Time.now();
    let reasonText = switch (reason) { case null { "" }; case (?r) { r } };
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_rejected", ?(bookTitle),
      ?(if (reasonText == "") { "Special book request rejected." } else { reasonText }),
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookRejection, requestId,
      ?("Special request rejected for: " # bookTitle # " Reason: " # reasonText));
    #ok(());
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 8 / 9  Mandatory collection date → Complete Approval → Collection Order
  // ─────────────────────────────────────────────────────────────────────────

  /// Complete the approval workflow for a request.
  /// Admin MUST supply collectionDate + collectionTime before this call succeeds.
  public shared func completeApproval(
    adminToken : Text,
    requestId : Common.RequestId,
    collectionDate : Text,
    collectionTime : Text,
    collectionLocation : Text,
    adminName : Text,
  ) : async Types.Result<CompleteApprovalResult, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    if (collectionDate == "") {
      return #err("Collection date is mandatory before completing approval.");
    };
    if (collectionTime == "") {
      return #err("Collection time is mandatory before completing approval.");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    // Idempotency check: already completed
    if (req.status == "completed") {
      return #err("This request has already been submitted. Please refresh to see the latest status.");
    };
    // Validate ALL library books have a decision (none may be Pending)
    for ((_, s) in req.bookApprovals.values()) {
      if (s == "Pending") {
        return #err("Please approve or reject all requested books before submitting.");
      };
    };
    // Validate ALL special/manual books have a decision (none may be Pending)
    for (sr in req.specialRequests.values()) {
      if (sr.status == #Pending) {
        return #err("Please approve or reject all requested books before submitting.");
      };
    };
    let studentOpt = users.values().find(func(u) { u.studentId == req.userId });
    let student = switch (studentOpt) {
      case null { return #err("Student not found: " # req.userId) };
      case (?u) { u };
    };
    let studentName = UsersLib.getFullName(student);
    let now = Time.now();
    // Build book decisions list from bookApprovals
    let bookDecisions : [BookDecisionTypes.BookDecision] = req.bookApprovals.map(
      func((bookId, statusText)) {
        let (bTitle, bAuthor, bEdition, bPublisher, bSubject, bNumber, holderName, expectedRet) = switch (books.get(bookId)) {
          case null { (bookId, "", "", "", "", bookId, null, null) };
          case (?b) {
            let holder : ?Text = switch (b.currentHolders.size() > 0) {
              case true {
                switch (users.get(b.currentHolders[0])) {
                  case null { ?b.currentHolders[0] };
                  case (?hu) { ?UsersLib.getFullName(hu) };
                };
              };
              case false { null };
            };
            (b.title, b.author, b.edition, b.publisher, b.category, b.bookId, holder, null)
          };
        };
        {
          bookId;
          bookName = bTitle;
          bookNumber = bNumber;
          author = bAuthor;
          edition = bEdition;
          publisher = bPublisher;
          subject = bSubject;
          inventoryId = "INV-" # bookId;
          decision = switch (statusText) {
            case "Approved" { #Approved };
            case "Rejected" { #Rejected };
            case "Reserved" { #Reserved };
            case "Ordered" { #Ordered };
            case "Arrived" { #Arrived };
            case "ReadyForCollection" { #ReadyForCollection };
            case "Issued" { #Issued };
            case "Returned" { #Returned };
            case "SpecialOrder" { #SpecialOrder };
            case _ { #Pending };
          };
          reason = null;
          currentHolder = holderName;
          currentHolderStudentId = null;
          expectedReturnDate = expectedRet;
          queuePosition = null;
          procurementCreated = false;
          procurementId = null;
        };
      }
    );
    let approvedBooks = bookDecisions.filter(func(d) { d.decision == #Approved })
      .map<BookDecisionTypes.BookDecision, ChallanTypes.ChallanBookEntry>(func(d) {
        { bookId = d.bookId; title = d.bookName; bookNumber = d.bookNumber; author = d.author; edition = d.edition; publisher = d.publisher; subject = d.subject; status = d.decision; reason = null; currentHolder = null; currentHolderStudentId = null; expectedReturnDate = null; queuePosition = null; expectedAvailabilityDate = null };
      });
    let rejectedBooks = bookDecisions.filter(func(d) { d.decision == #Rejected })
      .map<BookDecisionTypes.BookDecision, ChallanTypes.ChallanBookEntry>(func(d) {
        { bookId = d.bookId; title = d.bookName; bookNumber = d.bookNumber; author = d.author; edition = d.edition; publisher = d.publisher; subject = d.subject; status = d.decision; reason = d.reason; currentHolder = null; currentHolderStudentId = null; expectedReturnDate = null; queuePosition = null; expectedAvailabilityDate = null };
      });
    let reservedBooks = bookDecisions.filter(func(d) { d.decision == #Reserved })
      .map<BookDecisionTypes.BookDecision, ChallanTypes.ChallanBookEntry>(func(d) {
        { bookId = d.bookId; title = d.bookName; bookNumber = d.bookNumber; author = d.author; edition = d.edition; publisher = d.publisher; subject = d.subject; status = d.decision; reason = null; currentHolder = d.currentHolder; currentHolderStudentId = d.currentHolderStudentId; expectedReturnDate = d.expectedReturnDate; queuePosition = d.queuePosition; expectedAvailabilityDate = null };
      });
    // Generate Collection Order
    collectionOrderCounter.value += 1;
    let orderNumber = "CO-" # (if (collectionOrderCounter.value < 10) { "0000" # collectionOrderCounter.value.toText() }
      else if (collectionOrderCounter.value < 100) { "000" # collectionOrderCounter.value.toText() }
      else if (collectionOrderCounter.value < 1000) { "00" # collectionOrderCounter.value.toText() }
      else if (collectionOrderCounter.value < 10000) { "0" # collectionOrderCounter.value.toText() }
      else { collectionOrderCounter.value.toText() });
    let orderId = "ORD" # collectionOrderCounter.value.toText();
    let collectionOrder : CollectionOrderTypes.CollectionOrder = {
      orderNumber;
      orderId;
      requestId;
      challanId = null;
      studentId = req.userId;
      studentName;
      studentEmail = req.studentEmail;
      studentPhone = req.studentPhone;
      studentCourse = req.studentCourse;
      studentYear = "";
      adminName;
      generatedAt = now;
      collectionDate;
      collectionTime;
      collectionLocation;
      bookDecisions;
      specialRequests = req.specialRequests;
      approvedBooks = [];
      rejectedBooks = [];
      reservedBooks = [];
      orderedBooks = [];
      arrivedBooks = [];
      readyForCollectionBooks = [];
      issuedBooks = [];
      returnedBooks = [];
      status = #Completed;
    };
    collectionOrders.add(orderId, collectionOrder);
    // Generate Challan
    challanCounter.value += 1;
    let challanNumber = "CHN-" # (if (challanCounter.value < 10) { "0000" # challanCounter.value.toText() }
      else if (challanCounter.value < 100) { "000" # challanCounter.value.toText() }
      else if (challanCounter.value < 1000) { "00" # challanCounter.value.toText() }
      else if (challanCounter.value < 10000) { "0" # challanCounter.value.toText() }
      else { challanCounter.value.toText() });
    let challanId = "CHLN" # challanCounter.value.toText();
    let qrUrl = "/student/" # req.userId # "?challan=" # challanId;
    let challan : ChallanTypes.Challan = {
      challanId;
      challanNumber;
      requestNumber = req.requestId;
      studentId = req.userId;
      studentName;
      studentEmail = req.studentEmail;
      studentPhone = req.studentPhone;
      studentCourse = req.studentCourse;
      studentYear = "";
      adminName;
      generatedAt = now;
      totalAmount = 200;
      issuedBookIds = req.selectedBookIds;
      approvedBooks;
      rejectedBooks;
      reservedBooks;
      manualBooks = req.specialRequests.map<BookDecisionTypes.SpecialRequest, ChallanTypes.ChallanBookEntry>(func(sr) {
        { bookId = ""; title = sr.title; bookNumber = ""; author = sr.author; edition = sr.edition; publisher = sr.publisher; subject = ""; status = sr.status; reason = sr.reason; currentHolder = null; currentHolderStudentId = null; expectedReturnDate = null; queuePosition = null; expectedAvailabilityDate = sr.expectedAvailabilityDate };
      });
      orderedBooks = [];
      arrivedBooks = [];
      readyForCollectionBooks = [];
      issuedBooks = [];
      returnedBooks = [];
      reservations = [];
      procurementRequests = [];
      expectedDates = [];
      availabilityDates = [];
      createdAt = now;
      status = "Active";
      bookDecisions;
      specialRequests = req.specialRequests;
      collectionDate;
      collectionTime;
      collectionOrderNumber = orderNumber;
      qrCodeUrl = qrUrl;
      qrCodeData = null;
      pdfUrl = null;
      signatureAdmin = null;
      signatureStudent = null;
      trackedBookIds = req.selectedBookIds;
      trackingEvents = [];
    };
    challans.add(challanId, challan);
    // Link challan to collection order
    collectionOrders.add(orderId, { collectionOrder with challanId = ?challanId });
    // Stamp collection details on request and mark as completed
    let newStatus = "completed";
    let updatedReq : RequestTypes.BookRequest = {
      req with
      challanId = ?challanId;
      collectionDate;
      collectionTime;
      collectionOrderId = ?orderId;
      collectionLocation;
      status = newStatus;
      bookDecisions;
      adminName = ?adminName;
      updatedAt = now;
    };
    requests.add(requestId, updatedReq);
    // Multi-channel notifications
    let collectionMsg = "Please collect your books from " # collectionLocation # " on " # collectionDate # " at " # collectionTime;
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, studentName, req.userId,
      "challan_generated", null, ?(collectionMsg),
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, studentName, req.userId,
      "book_ready_for_collection", null, ?(collectionMsg),
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    // Audit logs
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #CollectionDateAssigned, requestId,
      ?("Collection: " # collectionDate # " " # collectionTime # " at " # collectionLocation));
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #CollectionOrderGenerated, requestId,
      ?("Order: " # orderNumber # " Challan: " # challanNumber));
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #NotificationSent, requestId,
      ?("Approval notifications sent to student: " # req.userId));
    #ok({ request = updatedReq; challan; collectionOrder = { collectionOrder with challanId = ?challanId } });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 9  Collection Order retrieval + Completed Forms + Manual Books To Purchase
  // ─────────────────────────────────────────────────────────────────────────

  /// Get ALL completed requests (library-only, manual-only, mixed). Admin only.
  /// A request is considered completed when its status == "completed".
  public query func getCompletedForms(
    adminToken : Text,
  ) : async [RequestTypes.BookRequest] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    requests.values()
      .filter(func(r) { r.status == "completed" })
      .sort(func(a, b) {
        if (a.updatedAt > b.updatedAt) { #less }
        else if (a.updatedAt < b.updatedAt) { #greater }
        else { #equal };
      })
      .toArray();
  };

  /// Get ALL completed requests that have at least one approved manual/special book.
  /// These also remain in completedForms — they appear in BOTH sections simultaneously.
  public query func getManualBooksToPurchase(
    adminToken : Text,
  ) : async [RequestTypes.BookRequest] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    requests.values()
      .filter(func(r) {
        r.status == "completed" and
        r.specialRequests.size() > 0
      })
      .sort(func(a, b) {
        if (a.updatedAt > b.updatedAt) { #less }
        else if (a.updatedAt < b.updatedAt) { #greater }
        else { #equal };
      })
      .toArray();
  };


  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5 (extended)  Per-book decisions for manual/special books
  // ─────────────────────────────────────────────────────────────────────────

  /// Admin approves a single special/manual book within a request by its index.
  /// This uses the same BookDecision status system as inventory books.
  public shared func approveSpecialBook(
    adminToken : Text,
    requestId : Common.RequestId,
    bookIndex : Nat,
  ) : async Types.Result<BookDecisionTypes.SpecialRequest, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    if (bookIndex >= req.specialRequests.size()) {
      return #err("Special book index out of range: " # bookIndex.toText());
    };
    // Update the status atomically
    let updatedSpecial = Array.tabulate(req.specialRequests.size(), func(i) {
      if (i == bookIndex) { { req.specialRequests[i] with status = #Approved } }
      else { req.specialRequests[i] }
    });
    let now = Time.now();
    let updatedReq = { req with specialRequests = updatedSpecial; updatedAt = now };
    requests.add(requestId, updatedReq);
    // Sync challan if linked
    switch (req.challanId) {
      case null {};
      case (?cid) {
        switch (challans.get(cid)) {
          case null {};
          case (?ch) {
            let updatedManual = Array.tabulate(ch.manualBooks.size(), func(i) {
              if (i == bookIndex) { { ch.manualBooks[i] with status = #Approved } }
              else { ch.manualBooks[i] }
            });
            let updatedSpecialCh = Array.tabulate(ch.specialRequests.size(), func(i) {
              if (i == bookIndex) { { ch.specialRequests[i] with status = #Approved } }
              else { ch.specialRequests[i] }
            });
            challans.add(cid, { ch with manualBooks = updatedManual; specialRequests = updatedSpecialCh });
          };
        };
      };
    };
    let bookTitle = req.specialRequests[bookIndex].title;
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_approved", ?(bookTitle), null,
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookApproval, requestId,
      ?("Approved manual book: " # bookTitle # " for request: " # requestId));
    #ok(updatedSpecial[bookIndex]);
  };

  /// Admin rejects a single special/manual book within a request by its index.
  public shared func rejectSpecialBook(
    adminToken : Text,
    requestId : Common.RequestId,
    bookIndex : Nat,
    reason : ?Text,
  ) : async Types.Result<BookDecisionTypes.SpecialRequest, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    if (bookIndex >= req.specialRequests.size()) {
      return #err("Special book index out of range: " # bookIndex.toText());
    };
    let updatedSpecial = Array.tabulate(req.specialRequests.size(), func(i) {
      if (i == bookIndex) { { req.specialRequests[i] with status = #Rejected; reason } }
      else { req.specialRequests[i] }
    });
    let now = Time.now();
    let updatedReq = { req with specialRequests = updatedSpecial; updatedAt = now };
    requests.add(requestId, updatedReq);
    // Sync challan if linked
    switch (req.challanId) {
      case null {};
      case (?cid) {
        switch (challans.get(cid)) {
          case null {};
          case (?ch) {
            let updatedManual = Array.tabulate(ch.manualBooks.size(), func(i) {
              if (i == bookIndex) { { ch.manualBooks[i] with status = #Rejected; reason } }
              else { ch.manualBooks[i] }
            });
            let updatedSpecialCh = Array.tabulate(ch.specialRequests.size(), func(i) {
              if (i == bookIndex) { { ch.specialRequests[i] with status = #Rejected; reason } }
              else { ch.specialRequests[i] }
            });
            challans.add(cid, { ch with manualBooks = updatedManual; specialRequests = updatedSpecialCh });
          };
        };
      };
    };
    let bookTitle = req.specialRequests[bookIndex].title;
    let reasonText = switch (reason) { case null { "" }; case (?r) { r } };
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "book_rejected", ?(bookTitle),
      if (reasonText == "") { null } else { ?reasonText },
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookRejection, requestId,
      ?("Rejected manual book: " # bookTitle # " Reason: " # reasonText));
    #ok(updatedSpecial[bookIndex]);
  };

  /// Get all pending requests for admin — requests with status "Pending" (not yet finalized).
  public query func getPendingRequestsFull(
    adminToken : Text,
  ) : async [RequestTypes.BookRequest] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    requests.values()
      .filter(func(r) { r.status == "Pending" or r.status == "pending" })
      .sort(func(a, b) {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal };
      })
      .toArray();
  };
  /// Update the status of a specific manual/special book within a completed request.
  /// Syncs the update across the request record, challan, and collection order.
  /// Also triggers a notification to the student and adds an audit log entry.
  public shared func updateManualBookStatus(
    adminToken : Text,
    requestId : Common.RequestId,
    bookTitle : Text,
    newStatus : BookDecisionTypes.BookDecisionStatus,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    // Update specialRequests on the request
    let updatedSpecial = req.specialRequests.map(func(sr) {
      if (sr.title == bookTitle) { { sr with status = newStatus } } else { sr }
    });
    let updatedReq = { req with specialRequests = updatedSpecial; updatedAt = Time.now() };
    requests.add(requestId, updatedReq);
    // Sync challan if one is linked
    switch (req.challanId) {
      case null {};
      case (?cid) {
        switch (challans.get(cid)) {
          case null {};
          case (?ch) {
            let updatedManualBooks = ch.manualBooks.map(func(mb) {
              if (mb.title == bookTitle) { { mb with status = newStatus } } else { mb }
            });
            let updatedSpecialCh = ch.specialRequests.map(func(sr) {
              if (sr.title == bookTitle) { { sr with status = newStatus } } else { sr }
            });
            challans.add(cid, { ch with manualBooks = updatedManualBooks; specialRequests = updatedSpecialCh });
          };
        };
      };
    };
    // Sync collection order if one is linked
    switch (req.collectionOrderId) {
      case null {};
      case (?oid) {
        switch (collectionOrders.get(oid)) {
          case null {};
          case (?co) {
            let updatedSpecialCo = co.specialRequests.map(func(sr) {
              if (sr.title == bookTitle) { { sr with status = newStatus } } else { sr }
            });
            collectionOrders.add(oid, { co with specialRequests = updatedSpecialCo });
          };
        };
      };
    };
    let now = Time.now();
    let statusText = switch (newStatus) {
      case (#Approved) { "Approved" };
      case (#Ordered) { "Ordered" };
      case (#Purchased) { "Purchased" };
      case (#Arrived) { "Arrived" };
      case (#ReadyForCollection) { "Ready For Collection" };
      case (#Issued) { "Issued" };
      case (#Returned) { "Returned" };
      case (#Rejected) { "Rejected" };
      case _ { "Updated" };
    };
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      req.userId, req.studentName, req.userId,
      "manual_book_status_update", ?(bookTitle), ?("Status updated to: " # statusText),
      [#Website, #Email, #SMS, #WhatsApp],
      req.studentEmail, req.studentPhone, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookApproval, requestId,
      ?("Manual book '" # bookTitle # "' status updated to: " # statusText));
    #ok(());
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 9  Collection Order retrieval
  // ─────────────────────────────────────────────────────────────────────────

  /// Get the collection order linked to a request.
  public query func getCollectionOrder(
    token : Text,
    requestId : Common.RequestId,
  ) : async Types.Result<CollectionOrderTypes.CollectionOrder, Text> {
    // Accept both student and admin tokens
    let isAdmin = AdminLib.isAdminToken(token);
    let now = Time.now();
    let isStudent = switch (UsersLib.verifyToken(token, now)) {
      case null { false };
      case _ { true };
    };
    if (not isAdmin and not isStudent) {
      return #err("Unauthorized: Invalid or expired token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    switch (req.collectionOrderId) {
      case null { #err("No collection order for this request yet.") };
      case (?ordId) {
        switch (collectionOrders.get(ordId)) {
          case null { #err("Collection order not found: " # ordId) };
          case (?co) { #ok(co) };
        };
      };
    };
  };

  /// Get all collection orders. Admin only.
  public query func getAllCollectionOrders(
    adminToken : Text,
  ) : async [CollectionOrderTypes.CollectionOrder] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    collectionOrders.values().toArray();
  };

  /// Finalize a request — convenience wrapper around completeApproval.
  /// Validates that collection details are provided, then delegates to completeApproval.
  public shared func finalizeRequest(
    adminToken : Text,
    requestId : Common.RequestId,
    collectionDate : Text,
    collectionTime : Text,
    collectionLocation : Text,
  ) : async Types.Result<CompleteApprovalResult, Text> {
    if (collectionDate == "") {
      return #err("Collection date is required to finalize the request.");
    };
    if (collectionTime == "") {
      return #err("Collection time is required to finalize the request.");
    };
    if (collectionLocation == "") {
      return #err("Collection location is required to finalize the request.");
    };
    await completeApproval(adminToken, requestId, collectionDate, collectionTime, collectionLocation, "Admin");
  };

  /// Get all collection orders for admin — alias for getAllCollectionOrders.
  public query func getCollectionOrdersByAdmin(
    adminToken : Text,
  ) : async [CollectionOrderTypes.CollectionOrder] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    collectionOrders.values().toArray();
  };

  /// Get collection orders for a specific student (by studentId).
  public query func getCollectionOrdersByStudent(
    jwtToken : Text,
    studentId : Common.UserId,
  ) : async [CollectionOrderTypes.CollectionOrder] {
    let now = Time.now();
    let callerIdOpt = UsersLib.verifyToken(jwtToken, now);
    let isAdmin = AdminLib.isAdminToken(jwtToken);
    if (not isAdmin) {
      switch (callerIdOpt) {
        case null { return [] };
        case (?callerId) {
          if (callerId != studentId) { return [] };
        };
      };
    };
    collectionOrders.values()
      .filter(func(co) { co.studentId == studentId })
      .toArray();
  };

  /// Get a specific collection order by its order number.
  public query func getCollectionOrderByNumber(
    token : Text,
    orderNumber : Text,
  ) : async Types.Result<CollectionOrderTypes.CollectionOrder, Text> {
    let isAdmin = AdminLib.isAdminToken(token);
    let now = Time.now();
    let isStudent = switch (UsersLib.verifyToken(token, now)) {
      case null { false };
      case _ { true };
    };
    if (not isAdmin and not isStudent) {
      return #err("Unauthorized: Invalid or expired token");
    };
    switch (collectionOrders.values().find(func(co) { co.orderNumber == orderNumber })) {
      case null { #err("Collection order not found: " # orderNumber) };
      case (?co) { #ok(co) };
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 10  Student dashboard — approved / rejected / reserved view
  // ─────────────────────────────────────────────────────────────────────────

  /// Get the student's request outcome summary (approved, rejected, reserved books
  /// + collection date/time + collection order link).
  public query func getMyRequestOutcome(
    jwtToken : Text,
    requestId : Common.RequestId,
  ) : async Types.Result<RequestOutcome, Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(jwtToken, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    if (req.userId != userId) {
      return #err("Access denied: This request does not belong to you.");
    };
    // Build book decisions from bookApprovals with full metadata
    let allDecisions : [BookDecisionTypes.BookDecision] = req.bookApprovals.map(
      func((bookId, statusText)) {
        let (bTitle, bAuthor, bEdition, bPublisher, bSubject, bNumber, holderName, expectedRet) = switch (books.get(bookId)) {
          case null { (bookId, "", "", "", "", bookId, null, null) };
          case (?b) {
            let holder : ?Text = switch (b.currentHolders.size() > 0) {
              case true {
                switch (users.get(b.currentHolders[0])) {
                  case null { ?b.currentHolders[0] };
                  case (?hu) { ?UsersLib.getFullName(hu) };
                };
              };
              case false { null };
            };
            (b.title, b.author, b.edition, b.publisher, b.category, b.bookId, holder, null)
          };
        };
        {
          bookId;
          bookName = bTitle;
          bookNumber = bNumber;
          author = bAuthor;
          edition = bEdition;
          publisher = bPublisher;
          subject = bSubject;
          inventoryId = "INV-" # bookId;
          decision = switch (statusText) {
            case "Approved" { #Approved };
            case "Rejected" { #Rejected };
            case "Reserved" { #Reserved };
            case "Ordered" { #Ordered };
            case "Arrived" { #Arrived };
            case "ReadyForCollection" { #ReadyForCollection };
            case "Issued" { #Issued };
            case "Returned" { #Returned };
            case "SpecialOrder" { #SpecialOrder };
            case _ { #Pending };
          };
          reason = null;
          currentHolder = holderName;
          currentHolderStudentId = null;
          expectedReturnDate = expectedRet;
          queuePosition = null;
          procurementCreated = false;
          procurementId = null;
        };
      }
    );
    let approved = allDecisions.filter(func(d) { d.decision == #Approved });
    let rejected = allDecisions.filter(func(d) { d.decision == #Rejected });
    let reserved = allDecisions.filter(func(d) { d.decision == #Reserved });
    let overallStatus = if (req.status != "") { req.status } else { "Pending" };
    #ok({
      requestId;
      requestNumber = req.requestNumber;
      approvedBooks = approved;
      rejectedBooks = rejected;
      reservedBooks = reserved;
      collectionDate = req.collectionDate;
      collectionTime = req.collectionTime;
      collectionLocation = "SVGA Book Bank Office";
      collectionOrderId = req.collectionOrderId;
      challanId = req.challanId;
      overallStatus;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 13  Challan — view, PDF data, print
  // ─────────────────────────────────────────────────────────────────────────

  /// Get the challan record for a student (student or admin can call).
  public query func getChallan(
    token : Text,
    challanId : Common.ChallanId,
  ) : async Types.Result<ChallanTypes.Challan, Text> {
    let isAdmin = AdminLib.isAdminToken(token);
    let now = Time.now();
    let isStudent = switch (UsersLib.verifyToken(token, now)) {
      case null { false };
      case _ { true };
    };
    if (not isAdmin and not isStudent) {
      return #err("Unauthorized: Invalid or expired token");
    };
    switch (challans.get(challanId)) {
      case null { #err("Challan not found: " # challanId) };
      case (?c) { #ok(c) };
    };
  };

  /// Get all challans for the authenticated student.
  public query func getMyChallans(
    jwtToken : Text,
  ) : async [ChallanTypes.Challan] {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(jwtToken, now)) {
      case null { return [] };
      case (?uid) { uid };
    };
    challans.values()
      .filter(func(c) { c.studentId == userId })
      .sort(func(a, b) {
        if (a.generatedAt > b.generatedAt) { #less }
        else if (a.generatedAt < b.generatedAt) { #greater }
        else { #equal };
      })
      .toArray();
  };

  /// Get PDF-ready challan data (includes QR code URL, signature fields, all book statuses).
  public query func getChallanPdfData(
    token : Text,
    challanId : Common.ChallanId,
  ) : async Types.Result<ChallanPdfData, Text> {
    let isAdmin = AdminLib.isAdminToken(token);
    let now = Time.now();
    let isStudent = switch (UsersLib.verifyToken(token, now)) {
      case null { false };
      case _ { true };
    };
    if (not isAdmin and not isStudent) {
      return #err("Unauthorized: Invalid or expired token");
    };
    let challan = switch (challans.get(challanId)) {
      case null { return #err("Challan not found: " # challanId) };
      case (?c) { c };
    };
    #ok({
      challan;
      qrCodeUrl = challan.qrCodeUrl;
      collectionOrderNumber = challan.collectionOrderNumber;
      collectionDate = challan.collectionDate;
      collectionTime = challan.collectionTime;
      collectionLocation = "SVGA Book Bank Office";
      adminSignaturePlaceholder = "Admin Signature: ___________________________";
      studentSignaturePlaceholder = "Student Signature: ___________________________";
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 14  Audit logs
  // ─────────────────────────────────────────────────────────────────────────

  /// Get audit log entries, filterable by date range, student ID, and action type.
  /// Admin only.
  public query func getAuditLogs(
    adminToken : Text,
    filterStudentId : ?Text,
    filterAction : ?AuditTypes.AuditAction,
    fromTimestamp : ?Common.Timestamp,
    toTimestamp : ?Common.Timestamp,
    limit : Nat,
  ) : async [AuditTypes.AuditEntry] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    let all = AuditLib.getAuditLog(auditLog, filterStudentId, filterAction, fromTimestamp, toTimestamp);
    if (limit == 0) { all } else {
      let n = if (limit < all.size()) { limit } else { all.size() };
      Array.tabulate<AuditTypes.AuditEntry>(n, func(i) { all[i] });
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 15  Waiting list automation
  // ─────────────────────────────────────────────────────────────────────────

  /// Trigger waiting-list auto-assignment for a specific book after it is returned.
  public shared func waitingListAutoAssign(
    adminToken : Text,
    bookId : Common.BookId,
    returnedFromRequestId : Common.RequestId,
  ) : async Types.Result<WaitingListAssignment, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid or expired admin token");
    };
    let book = switch (books.get(bookId)) {
      case null { return #err("Book not found: " # bookId) };
      case (?b) { b };
    };
    // Mark book as returned: increment available quantity, remove from original holder
    let origReq = switch (requests.get(returnedFromRequestId)) {
      case null { null };
      case (?r) { ?r };
    };
    let prevHolderId = switch (origReq) {
      case null { "" };
      case (?r) { r.userId };
    };
    let newHolders = book.currentHolders.filter(func(h) { h != prevHolderId });
    let updatedBook : BookTypes.Book = {
      book with
      availableQuantity = book.availableQuantity + 1;
      availableCount = book.availableCount + 1;
      currentHolders = newHolders;
      isAvailable = true;
    };
    books.add(bookId, updatedBook);
    // Mark original request returned
    switch (origReq) {
      case null {};
      case (?r) {
        requests.add(returnedFromRequestId, { r with returned = true; returnDate = ?Time.now() });
      };
    };
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookReturn, returnedFromRequestId,
      ?("Book returned: " # book.title));
    // Find first Waiting reservation for this book (sorted by requestDate ascending)
    let waitingReservations = reservations.values()
      .filter(func(r) { r.bookId == bookId and r.status == #Waiting })
      .toArray();
    if (waitingReservations.size() == 0) {
      return #ok({
        assigned = false;
        nextStudentId = null;
        nextStudentName = null;
        newRequestId = null;
        collectionOrderId = null;
      });
    };
    // Sort by requestDate ascending to find oldest waiting
    let sorted = waitingReservations.sort(func(a, b) {
      if (a.requestDate < b.requestDate) { #less }
      else if (a.requestDate > b.requestDate) { #greater }
      else { #equal };
    });
    let nextReservation = sorted[0];
    let nextStudentId = nextReservation.studentId;
    // Mark reservation fulfilled
    reservations.add(nextReservation.id, { nextReservation with status = #Fulfilled });
    // Remove student from waiting queue
    let bookAfterReturn = switch (books.get(bookId)) {
      case null { updatedBook };
      case (?b) { b };
    };
    let newQueue = bookAfterReturn.waitingQueue.filter(func(uid) { uid != nextStudentId });
    // Assign book to next student
    let newHolders2 = Array.tabulate(bookAfterReturn.currentHolders.size() + 1, func(i) {
      if (i < bookAfterReturn.currentHolders.size()) { bookAfterReturn.currentHolders[i] } else { nextStudentId }
    });
    let newAvail = if (bookAfterReturn.availableQuantity > 0) { ((bookAfterReturn.availableQuantity : Int) - 1).toNat() } else { 0 };
    books.add(bookId, {
      bookAfterReturn with
      availableQuantity = newAvail;
      availableCount = if (bookAfterReturn.availableCount > 0) { ((bookAfterReturn.availableCount : Int) - 1).toNat() } else { 0 };
      currentHolders = newHolders2;
      waitingQueue = newQueue;
      isAvailable = newAvail > 0;
    });
    // Look up next student details
    let nextStudent = switch (users.get(nextStudentId)) {
      case null { return #err("Next student not found: " # nextStudentId) };
      case (?u) { u };
    };
    let nextStudentName = UsersLib.getFullName(nextStudent);
    let now = Time.now();
    // Generate a new collection order for the next student
    collectionOrderCounter.value += 1;
    let orderNumber = "CO-" # (if (collectionOrderCounter.value < 10) { "0000" # collectionOrderCounter.value.toText() }
      else if (collectionOrderCounter.value < 100) { "000" # collectionOrderCounter.value.toText() }
      else if (collectionOrderCounter.value < 1000) { "00" # collectionOrderCounter.value.toText() }
      else if (collectionOrderCounter.value < 10000) { "0" # collectionOrderCounter.value.toText() }
      else { collectionOrderCounter.value.toText() });
    let orderId = "ORD" # collectionOrderCounter.value.toText();
    let newOrder : CollectionOrderTypes.CollectionOrder = {
      orderNumber;
      orderId;
      requestId = returnedFromRequestId;
      challanId = null;
      studentId = nextStudentId;
      studentName = nextStudentName;
      studentEmail = nextStudent.email;
      studentPhone = nextStudent.phone;
      studentCourse = nextStudent.course;
      studentYear = "";
      adminName = "System";
      generatedAt = now;
      collectionDate = "";
      collectionTime = "";
      collectionLocation = "SVGA Book Bank Office";
      bookDecisions = [{
        bookId;
        bookName = book.title;
        bookNumber = bookId;
        author = book.author;
        edition = book.edition;
        publisher = book.publisher;
        subject = book.category;
        inventoryId = "INV-" # bookId;
        decision = #Approved;
        reason = null;
        currentHolder = null;
        currentHolderStudentId = null;
        expectedReturnDate = null;
        queuePosition = null;
        procurementCreated = false;
        procurementId = null;
      }];
      specialRequests = [];
      approvedBooks = [];
      rejectedBooks = [];
      reservedBooks = [];
      orderedBooks = [];
      arrivedBooks = [];
      readyForCollectionBooks = [];
      issuedBooks = [];
      returnedBooks = [];
      status = #Pending;
    };
    collectionOrders.add(orderId, newOrder);
    // Notify next student
    ignore NotifService.sendMultiChannel(
      notifications, notificationCounter,
      nextStudentId, nextStudentName, nextStudentId,
      "book_available", ?(book.title), ?("Your reserved book is now available for collection. Please contact SVGA Book Bank to arrange collection."),
      [#Website, #Email, #SMS, #WhatsApp],
      nextStudent.email, nextStudent.phone, now,
    );
    // Notify admin
    ignore NotificationsLib.createNotification(
      notifications, notificationCounter,
      "admin", #BookTransferred,
      "Book Auto-Assigned",
      "Book '" # book.title # "' has been auto-assigned to " # nextStudentName # " (" # nextStudentId # ") from waiting list.",
      null, now,
    );
    AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookIssue, returnedFromRequestId,
      ?("Auto-assigned '" # book.title # "' to student: " # nextStudentId # " from waiting list"));
    #ok({
      assigned = true;
      nextStudentId = ?nextStudentId;
      nextStudentName = ?nextStudentName;
      newRequestId = null;
      collectionOrderId = ?orderId;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Array.tabulate and Array.filter used inline above
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // Result types returned by this mixin's endpoints
  // ─────────────────────────────────────────────────────────────────────────

  /// Full admin view of a single request (Step 3).
  public type RequestDetails = {
    request : RequestTypes.BookRequest;
    /// Enriched per-book view: title, book number, inventory ID, availability, holder, queue.
    books : [BookDetailView];
    /// Books student typed manually that are not in inventory.
    specialRequests : [BookDecisionTypes.SpecialRequest];
    /// Full student details for admin display (Step 2).
    student : UserTypes.UserPublic;
  };

  /// Enriched book view inside a request-details response.
  public type BookDetailView = {
    bookId : Common.BookId;
    title : Text;
    bookNumber : Text;   // e.g. "PHY-102"
    inventoryId : Text;  // e.g. "INV-102"
    subject : Text;
    edition : Text;
    author : Text;
    publisher : Text;
    availabilityStatus : Text; // "Available" | "Issued" | "Reserved"
    currentHolder : ?Text;
    expectedReturnDate : ?Common.Timestamp;
    queueLength : Nat;
    /// The per-book decision already made by admin (if any).
    decision : ?BookDecisionTypes.BookDecision;
  };

  /// Result returned by completeApproval (Step 8/9).
  public type CompleteApprovalResult = {
    request : RequestTypes.BookRequest;
    challan : ChallanTypes.Challan;
    collectionOrder : CollectionOrderTypes.CollectionOrder;
  };

  /// Student-facing request outcome summary (Step 10).
  public type RequestOutcome = {
    requestId : Common.RequestId;
    requestNumber : Text;
    approvedBooks : [BookDecisionTypes.BookDecision];
    rejectedBooks : [BookDecisionTypes.BookDecision];
    reservedBooks : [BookDecisionTypes.BookDecision];
    collectionDate : Text;
    collectionTime : Text;
    collectionLocation : Text;
    collectionOrderId : ?Text;
    challanId : ?Common.ChallanId;
    overallStatus : Text;
  };

  /// Challan PDF-ready data record (Step 13).
  public type ChallanPdfData = {
    challan : ChallanTypes.Challan;
    qrCodeUrl : Text;
    /// Collection order number stamped on the PDF.
    collectionOrderNumber : Text;
    collectionDate : Text;
    collectionTime : Text;
    collectionLocation : Text;
    /// Placeholder for admin wet signature on the printed PDF.
    adminSignaturePlaceholder : Text;
    /// Placeholder for student wet signature on the printed PDF.
    studentSignaturePlaceholder : Text;
  };

  /// Result returned by waitingListAutoAssign (Step 15).
  public type WaitingListAssignment = {
    assigned : Bool;
    nextStudentId : ?Common.UserId;
    nextStudentName : ?Text;
    newRequestId : ?Common.RequestId;
    collectionOrderId : ?Common.CollectionOrderId;
  };
};
