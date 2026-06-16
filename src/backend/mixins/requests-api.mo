import Map "mo:core/Map";
import Time "mo:core/Time";
import RequestTypes "../types/request";
import UserTypes "../types/user";
import BookTypes "../types/book";
import Common "../types/common";
import Types "mo:core/Types";
import RequestsLib "../lib/requests";
import UsersLib "../lib/users";
import BooksLib "../lib/books";
import Int "mo:core/Int";
import AdminLib "../lib/admin";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";
import ReservationsLib "../lib/reservations";
import ProcurementLib "../lib/procurement";
import NotifTypes "../types/notification";
import Notifications "../lib/notifications";
import TransferTypes "../types/transfer";
import ChallanTypes "../types/challan";
import List "mo:core/List";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  requestCounter : { var value : Nat },
  books : Map.Map<Common.BookId, BookTypes.Book>,
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  reservationCounter : { var value : Nat },
  procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  procurementCounter : { var value : Nat },
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
  transfers : Map.Map<Common.TransferId, TransferTypes.Transfer>,
  transferCounter : { var value : Nat },
) {
  /// Create a new book request (challan) for the authenticated student.
  /// jwtToken is the student's JWT session token.
  /// Create a new book request (challan) for the authenticated student.
  /// jwtToken is the student's JWT session token.
  public shared func createBookRequest(
    jwtToken : Text,
    selectedBookIds : [Common.BookId],
    requestedBooks : [RequestTypes.RequestedBookPublic],
  ) : async Types.Result<RequestTypes.BookRequest, Text> {
    // 1. Validate the token with expiry check first (fail fast)
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(jwtToken, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    // 2. Load the user record
    let user = switch (users.get(userId)) {
      case null { return #err("User account not found. Please log in again.") };
      case (?u) { u };
    };
    // 3. Make sure the stored token still matches (logout invalidation)
    switch (user.sessionToken) {
      case null { return #err("No active session found. Please log in again.") };
      case (?t) {
        if (t != jwtToken) {
          return #err("Session token mismatch. Please log in again.");
        };
      };
    };
    // 4. Must select at least one book or submit at least one procurement request
    if (selectedBookIds.size() == 0 and requestedBooks.size() == 0) {
      return #err("Please select at least one book or add a procurement request.");
    };
    // 5. Check availability of all selected books
    for (bookId in selectedBookIds.values()) {
      switch (books.get(bookId)) {
        case (?book) {
          if (book.availableCount == 0) {
            return #err("Book not available: " # book.title);
          };
        };
        case null { return #err("Book not found: " # bookId) };
      };
    };
    // 6. Decrement available count for all selected books
    for (bookId in selectedBookIds.values()) {
      switch (books.get(bookId)) {
        case (?book) {
          books.add(bookId, BooksLib.decrementAvailable(book));
        };
        case null {};
      };
    };
    // 7. Create and persist the request
    requestCounter.value += 1;
    let requestId = RequestsLib.generateRequestId(requestCounter.value);
    var req = RequestsLib.create(
      requestId, user.studentId, selectedBookIds, requestedBooks, now,
      user.name, user.phone, user.course, user.aadhaarNumber,
      user.email, user.academicYear,
    );
    let challan = RequestsLib.buildChallanData(req, user.name, user.studentId);
    req := { req with challanData = challan };
    requests.add(requestId, req);
    #ok(req);
  };

  /// Get the student's own book requests via JWT token.
  /// Get the student's own book requests via JWT token.
  public query func getMyRequests(jwtToken : Text) : async [RequestTypes.BookRequest] {
    let now = Time.now();
    switch (UsersLib.verifyToken(jwtToken, now)) {
      case null { [] };
      case (?userId) {
        switch (users.get(userId)) {
          case null { [] };
          case (?user) {
            switch (user.sessionToken) {
              case (?t) {
                if (t == jwtToken) { RequestsLib.forUser(requests, user.studentId) } else { [] };
              };
              case null { [] };
            };
          };
        };
      };
    };
  };

  /// Get all book requests, newest first. Admin only (adminToken required).
  public query func getAllRequests(adminToken : Text) : async [RequestTypes.BookRequest] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    let arr = requests.values().toArray();
    arr.sort(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
  };

  /// Update the status of a request. Admin only (adminToken required).
  public shared func updateRequestStatus(
    adminToken : Text,
    requestId : Common.RequestId,
    status : Text,
  ) : async Types.Result<RequestTypes.BookRequest, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (requests.get(requestId)) {
      case (?req) {
        var updated = RequestsLib.withStatus(req, status);
        // When approved for the first time: set issueDate + returnDate (14 days)
        if (status == "Approved" and req.issueDate == null) {
          let now = Time.now();
          let fourteenDays : Int = 14 * 24 * 60 * 60 * 1_000_000_000;
          updated := { updated with issueDate = ?now; returnDate = ?(now + fourteenDays) };
        };
        // When marked returned: set returned flag and restore book inventory
        if (status == "Returned") {
          updated := { updated with returned = true };
          for (bookId in req.selectedBookIds.values()) {
            switch (books.get(bookId)) {
              case (?book) {
                books.add(bookId, { book with availableCount = book.availableCount + 1 });
              };
              case null {};
            };
          };
        };
        requests.add(requestId, updated);
        #ok(updated);
      };
      case null { #err("Request not found: " # requestId) };
    };
  };

  /// Mark a request as returned and restore book copies. Admin only.
  /// Mark a request as returned. Automatically transfers to the next waiting student if any.
  /// Mark a request as returned. Automatically transfers to the next waiting student if any.
  public shared func markBookReturned(
    adminToken : Text,
    requestId : Common.RequestId,
  ) : async Types.Result<RequestTypes.BookRequest, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (requests.get(requestId)) {
      case (?req) {
        if (req.status == "Returned") {
          return #err("Request already marked as returned");
        };
        let now = Time.now();
        let fourteenDays : Int = 14 * 24 * 60 * 60 * 1_000_000_000;
        let updated = { req with status = "Returned"; returned = true };
        requests.add(requestId, updated);
        // Process each book in this request
        for (bookId in req.selectedBookIds.values()) {
          switch (books.get(bookId)) {
            case null {}; // skip unknown books
            case (?book) {
              let bookTitle = book.title;
              // Find next waiting reservation for this book (earliest requestDate)
              let isWaitingForBook = func(r : ReservationTypes.Reservation) : Bool {
                if (r.bookId != bookId) { return false };
                switch (r.status) { case (#Waiting) true; case _ false };
              };
              let waitingArr = reservations.values()
                .filter(isWaitingForBook)
                .toArray()
                .sort(func(a, b) { Int.compare(a.requestDate, b.requestDate) });
              if (waitingArr.size() > 0) {
                let nextRes = waitingArr[0];
                let nextStudentId = nextRes.studentId;
                switch (users.get(nextStudentId)) {
                  case null {
                    // No user record — restore availability normally
                    books.add(bookId, { book with availableCount = book.availableCount + 1; isAvailable = true });
                  };
                  case (?nextUser) {
                    // Create new Approved request for the next student (book stays issued)
                    transferCounter.value += 1;
                    let newRequestId = "TRANS-REQ-" # transferCounter.value.toText();
                    let newRequest : RequestTypes.BookRequest = {
                      requestId = newRequestId;
                      userId = nextStudentId;
                      selectedBookIds = [bookId];
                      requestedBooks = [];
                      status = "Approved";
                      challanData = "";
                      challanId = null;
                      createdAt = now;
                      issueDate = ?now;
                      returnDate = ?(now + fourteenDays);
                      returned = false;
                      studentName = nextUser.name;
                      studentPhone = nextUser.phone;
                      studentCourse = nextUser.course;
                      studentAadhaar = nextUser.aadhaarNumber;
                      studentEmail = nextUser.email;
                      studentYear = nextUser.academicYear;
                      requestNumber = "TRANS-" # transferCounter.value.toText();
                      collectionDate = "";
                      collectionTime = "";
                      collectionLocation = "";
                      collectionOrderId = null;
                      bookApprovals = [(bookId, "Approved")];
                      bookDecisions = [];
                      specialRequests = [];
                      studentId = nextUser.studentId;
                      updatedAt = now;
                      adminId = null;
                      adminName = null;
                      requestNotes = null;
                    };
                    requests.add(newRequestId, newRequest);
                    // Fulfill the reservation (this restores availableCount temporarily)
                    let _ = ReservationsLib.fulfillReservation(reservations, books, nextRes.id);
                    // Re-decrement: book immediately re-issued to next student
                    switch (books.get(bookId)) {
                      case (?b2) {
                        let newAvail : Nat = if (b2.availableCount > 0) { b2.availableCount - 1 : Nat } else { 0 };
                        books.add(bookId, { b2 with availableCount = newAvail; isAvailable = newAvail > 0 });
                      };
                      case null {};
                    };
                    // Record transfer
                    transferCounter.value += 1;
                    let transferId = "TRANSF-" # transferCounter.value.toText();
                    let transfer : TransferTypes.Transfer = {
                      id = transferId;
                      fromStudentId = req.userId;
                      toStudentId = nextStudentId;
                      bookId;
                      transferDate = now;
                      adminNotes = ?"Auto-transferred on return";
                      challanId = null;
                    };
                    transfers.add(transferId, transfer);
                    // Notify admin
                    let _ = Notifications.createNotification(
                      notifications, notificationCounter,
                      "admin", #BookTransferred,
                      "Book Auto-Transferred",
                      "Book " # bookTitle # " automatically transferred to " # nextUser.name,
                      null, now,
                    );
                    // Notify next student
                    let _ = Notifications.createNotification(
                      notifications, notificationCounter,
                      nextStudentId, #ReservationFulfilled,
                      "Book Ready for Collection",
                      "Your reserved book " # bookTitle # " is now ready for collection!",
                      null, now,
                    );
                  };
                };
              } else {
                // No waiting reservations — restore available count normally
                books.add(bookId, { book with availableCount = book.availableCount + 1; isAvailable = true });
              };
            };
          };
        };
        #ok(updated);
      };
      case null { #err("Request not found: " # requestId) };
    };
  };

  /// Get the student's approved/procured requests that are not yet returned.
  /// Get the student's approved/procured requests that are not yet returned.
  public query func getMyIssuedBooks(jwtToken : Text) : async [RequestTypes.BookRequest] {
    let now = Time.now();
    switch (UsersLib.verifyToken(jwtToken, now)) {
      case null { [] };
      case (?userId) {
        switch (users.get(userId)) {
          case null { [] };
          case (?user) {
            switch (user.sessionToken) {
              case (?t) {
                if (t == jwtToken) {
                  RequestsLib.forUser(requests, user.studentId)
                    .filter(func(r) {
                      r.status == "Approved" or r.status == "Procured"
                    })
                } else { [] };
              };
              case null { [] };
            };
          };
        };
      };
    };
  };

  /// Search and filter requests by query, status, and course. Admin only.
  public query func searchRequests(
    adminToken : Text,
    searchQuery : Text,
    statusFilter : ?Text,
    course : ?Text,
  ) : async [RequestTypes.BookRequest] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    let lower = searchQuery.toLower();
    requests.values()
      .filter(func(r) {
        let matchesQuery = lower == "" or
          r.requestId.toLower().contains(#text lower) or
          r.userId.toLower().contains(#text lower) or
          r.studentName.toLower().contains(#text lower) or
          r.studentName.toLower().contains(#text lower) or
          r.studentAadhaar.toLower().contains(#text lower);
        let matchesStatus = switch (statusFilter) {
          case (?s) { r.status == s };
          case null { true };
        };
        let matchesCourse = switch (course) {
          case (?c) { r.studentCourse == c };
          case null { true };
        };
        matchesQuery and matchesStatus and matchesCourse;
      })
      .toArray();
  };

  /// Create a reservation queue entry for an unavailable book.
  /// This is the "YES, I can wait" path from the smart availability flow.
  public shared func createBookReservation(
    token : Text,
    bookId : Common.BookId,
    expectedAvailabilityDate : ?Common.Timestamp,
  ) : async Types.Result<ReservationTypes.Reservation, Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid.") };
      case (?uid) { uid };
    };
    switch (users.get(userId)) {
      case null { return #err("User not found.") };
      case (?u) {
        switch (u.sessionToken) {
          case null { return #err("No active session.") };
          case (?t) { if (t != token) { return #err("Session mismatch.") } };
        };
      };
    };
    // Prevent duplicate
    if (ReservationsLib.hasWaitingReservation(reservations, userId, bookId)) {
      return #err("You already have a waiting reservation for this book.");
    };
    reservationCounter.value += 1;
    let reservationId = ReservationsLib.generateReservationId(reservationCounter.value);
    let reservation = ReservationsLib.createReservation(
      reservations, books, reservationId, userId, bookId, expectedAvailabilityDate, now,
    );
    #ok(reservation);
  };

  /// Create a procurement request for a book that needs urgent sourcing.
  /// This is the "NO, I need urgently" path from the smart availability flow.
  public shared func createUrgentProcurementRequest(
    token : Text,
    bookTitle : Text,
    bookId : ?Common.BookId,
    author : ?Text,
    edition : ?Text,
    publisher : ?Text,
  ) : async Types.Result<ProcurementTypes.ProcurementRequest, Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid.") };
      case (?uid) { uid };
    };
    switch (users.get(userId)) {
      case null { return #err("User not found.") };
      case (?u) {
        switch (u.sessionToken) {
          case null { return #err("No active session.") };
          case (?t) { if (t != token) { return #err("Session mismatch.") } };
        };
      };
    };
    if (bookTitle == "") { return #err("Book title is required.") };
    procurementCounter.value += 1;
    let procurementId = ProcurementLib.generateProcurementId(procurementCounter.value);
    let procurement = ProcurementLib.createProcurement(
      procurements, procurementId, userId, bookTitle,
      bookId, author, edition, publisher, #Required, now,
    );
    #ok(procurement);
  };

  /// Update the approval status of a single book within a request. Admin only.
  /// action: #Accept, #Reject, #AcceptReservation, #RejectReservation
  /// If #Accept: decrement availableCount, set issue/return dates, notify student.
  /// If #AcceptReservation: add to reservations, notify student.
  /// Auto-generates/updates challan after any action.
  public shared func updateBookApproval(
    adminToken : Text,
    requestId : Common.RequestId,
    bookId : Common.BookId,
    action : { #Accept; #Reject; #AcceptReservation; #RejectReservation },
    expectedDate : ?Text,
  ) : async Types.Result<RequestTypes.BookRequest, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let req = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    let now = Time.now();
    // Determine new approval status text
    let approvalText = switch (action) {
      case (#Accept) { "Approved" };
      case (#Reject) { "Rejected" };
      case (#AcceptReservation) { "Reserved" };
      case (#RejectReservation) { "Rejected" };
    };
    var updated = RequestsLib.updateBookApproval(req, bookId, approvalText);
    // Side-effects per action
    switch (action) {
      case (#Accept) {
        // Decrement book available count and set issue/return dates
        switch (books.get(bookId)) {
          case (?book) {
            let newAvail : Nat = if (book.availableCount > 0) { book.availableCount - 1 : Nat } else { 0 };
            books.add(bookId, { book with availableCount = newAvail; isAvailable = newAvail > 0 });
          };
          case null {};
        };
        // Set issueDate and returnDate (end of academic year = May 31)
        let issueDate : Common.Timestamp = if (updated.issueDate == null) { now } else {
          switch (updated.issueDate) { case (?d) d; case null now };
        };
        // Return date: May 31 of current year in nanoseconds (approx 7 months from now)
        let sevenMonthsNs : Int = 7 * 30 * 24 * 60 * 60 * 1_000_000_000;
        let returnDate : Common.Timestamp = issueDate + sevenMonthsNs;
        updated := { updated with issueDate = ?issueDate; returnDate = ?returnDate };
        // Notify student
        let bookTitle = switch (books.get(bookId)) {
          case (?b) { b.title };
          case null { bookId };
        };
        let _ = Notifications.createNotification(
          notifications, notificationCounter,
          req.userId, #BookApproved,
          "Book Approved",
          "Your request for \"" # bookTitle # "\" has been approved. Please collect it.",
          null, now,
        );
      };
      case (#Reject) {
        // Restore inventory if book was previously decremented
        switch (books.get(bookId)) {
          case (?book) {
            books.add(bookId, { book with availableCount = book.availableCount + 1; isAvailable = true });
          };
          case null {};
        };
        let bookTitle = switch (books.get(bookId)) {
          case (?b) { b.title };
          case null { bookId };
        };
        let _ = Notifications.createNotification(
          notifications, notificationCounter,
          req.userId, #BookRejected,
          "Book Rejected",
          "Unfortunately your request for \"" # bookTitle # "\" was rejected.",
          null, now,
        );
      };
      case (#AcceptReservation) {
        // Add to reservations if not already waiting
        if (not ReservationsLib.hasWaitingReservation(reservations, req.userId, bookId)) {
          reservationCounter.value += 1;
          let reservationId = ReservationsLib.generateReservationId(reservationCounter.value);
          let _ = ReservationsLib.createReservation(
            reservations, books, reservationId, req.userId, bookId, null, now,
          );
        };
        let bookTitle = switch (books.get(bookId)) {
          case (?b) { b.title };
          case null { bookId };
        };
        let availMsg = switch (expectedDate) {
          case (?d) { " Expected availability: " # d };
          case null { "" };
        };
        let _ = Notifications.createNotification(
          notifications, notificationCounter,
          req.userId, #BookReserved,
          "Book Reserved",
          "You have been added to the waiting list for \"" # bookTitle # "\"." # availMsg,
          null, now,
        );
      };
      case (#RejectReservation) {
        let bookTitle = switch (books.get(bookId)) {
          case (?b) { b.title };
          case null { bookId };
        };
        let _ = Notifications.createNotification(
          notifications, notificationCounter,
          req.userId, #BookRejected,
          "Reservation Rejected",
          "Your reservation request for \"" # bookTitle # "\" was rejected.",
          null, now,
        );
      };
    };
    // Update overall request status based on all book approvals
    let allApprovals = updated.bookApprovals;
    let hasAnyApproved = allApprovals.find(func((_, s)) { s == "Approved" or s == "Reserved" }) != null;
    let allDone = allApprovals.find(func((_, s)) { s == "Pending" }) == null;
    let newStatus = if (allDone and hasAnyApproved) { "Approved" }
      else if (allDone) { "Rejected" }
      else { updated.status };
    updated := { updated with status = newStatus };
    // Rebuild challan data
    let user = switch (users.get(req.userId)) {
      case (?u) { u };
      case null { return #err("User not found") };
    };
    let newChallan = RequestsLib.buildChallanData(updated, user.name, user.studentId);
    updated := { updated with challanData = newChallan };
    requests.add(requestId, updated);
    #ok(updated);
  };

  /// Get a single request by ID. Token must belong to the request owner or be a valid admin token.
  public query func getRequestById(
    token : Text,
    requestId : Common.RequestId,
  ) : async Types.Result<RequestTypes.BookRequest, Text> {
    switch (requests.get(requestId)) {
      case (?req) {
        let now_ = Time.now();
        let isOwner = switch (UsersLib.verifyToken(token, now_)) {
          case (?uid) { uid == req.userId };
          case null { false };
        };
        if (isOwner or AdminLib.isAdminToken(token)) {
          #ok(req);
        } else {
          #err("Unauthorized: You can only view your own requests");
        };
      };
      case null { #err("Request not found: " # requestId) };
    };
  };
};
