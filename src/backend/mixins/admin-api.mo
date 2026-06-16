import Types "mo:core/Types";
import Time "mo:core/Time";
import Common "../types/common";
import Map "mo:core/Map";
import RequestTypes "../types/request";
import UserTypes "../types/user";
import BookTypes "../types/book";
import AdminLib "../lib/admin";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";
import List "mo:core/List";
import CollectionTypes "../types/collection";
import NotificationsLib "../lib/notifications";
import NotifTypes "../types/notification";
import UsersLib "../lib/users";
import AuditLib "../lib/audit";
import AuditTypes "../types/audit";
import Int "mo:core/Int";

mixin (
  adminUsername : { var value : Text },
  adminPasswordHash : { var value : Text },
  users : Map.Map<Common.UserId, UserTypes.User>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  books : Map.Map<Common.BookId, BookTypes.Book>,
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
  auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
  auditCounter : { var value : Nat },
) {
  // ─── Pending / Completed Request Sections ──────────────────────────────

  /// Return a summary of all requests that have NOT yet been finalized
  /// (i.e. collectionOrderId is null, meaning FINAL SUBMIT has not been clicked).
  /// Used for the "Pending Requests" section in the admin panel.
  /// Returns newest first.
  public query func getPendingRequests(
    adminToken : Text,
  ) : async [{
    requestId : Common.RequestId;
    studentName : Text;
    studentId : Text;
    phoneNumber : Text;
    course : Text;
    requestDate : Common.Timestamp;
    totalBooksCount : Nat;
    status : Text;
  }] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    let arr = requests.values()
      .filter(func(r) {
        switch (r.collectionOrderId) {
          case null { true };
          case (?_) { false };
        };
      })
      .map(func(r : RequestTypes.BookRequest) : {
        requestId : Common.RequestId;
        studentName : Text;
        studentId : Text;
        phoneNumber : Text;
        course : Text;
        requestDate : Common.Timestamp;
        totalBooksCount : Nat;
        status : Text;
      } {
        {
          requestId = r.requestId;
          studentName = r.studentName;
          studentId = r.studentId;
          phoneNumber = r.studentPhone;
          course = r.studentCourse;
          requestDate = r.createdAt;
          totalBooksCount = r.selectedBookIds.size() + r.requestedBooks.size();
          status = r.status;
        };
      })
      .toArray();
    arr.sort(func(a, b) { Int.compare(b.requestDate, a.requestDate) });
  };

  /// Returns the count of pending (not-yet-finalized) requests.
  /// Used for the notification badge in the navbar.
  public query func getAdminPendingCount(
    adminToken : Text,
  ) : async Nat {
    if (not AdminLib.isAdminToken(adminToken)) { return 0 };
    requests.values()
      .filter(func(r) {
        switch (r.collectionOrderId) {
          case null { true };
          case (?_) { false };
        };
      })
      .toArray()
      .size();
  };

  // Simple deterministic hash: fold chars into a Nat, encode as text
  func hashPassword(password : Text) : Text {
    var h : Nat = 5381;
    for (c in password.toIter()) {
      h := (h * 33 + c.toNat32().toNat()) % 0xFFFFFFFF;
    };
    h.toText();
  };

  /// Admin-specific login using stored username + password hash.
  /// Returns a short-lived session token on success.
  /// Admin-specific login using stored username + password hash.
  /// Returns a session token (with embedded expiry) on success.
  public shared func adminLogin(
    username : Text,
    password : Text,
  ) : async AdminLib.AdminLoginResult {
    // Seed default credentials if none have been set yet
    if (adminUsername.value == "") {
      adminUsername.value := "svga_admin";
      adminPasswordHash.value := hashPassword("admin123");
    };
    if (not AdminLib.safeEqual(adminUsername.value, username)) {
      return #err("Invalid credentials");
    };
    let incoming = hashPassword(password);
    if (not AdminLib.safeEqual(adminPasswordHash.value, incoming)) {
      return #err("Invalid credentials");
    };
    let now = Time.now();
    let token = AdminLib.generateToken(username, now);
    // expiresAt = now + 24 hours, same as embedded in token
    let expiresAt = now + 24 * 60 * 60 * 1_000_000_000;
    #ok({ token; expiresAt });
  };

  /// Set (or replace) the admin username and password hash. Admin principal only.
  public shared func setAdminCredentials(
    adminToken : Text,
    username : Text,
    passwordHash : Text,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    adminUsername.value := username;
    adminPasswordHash.value := passwordHash;
    #ok(());
  };

  /// Admin sets the return deadline for an issued request.
  public shared func setReturnDate(
    adminToken : Text,
    requestId : Common.RequestId,
    returnDate : Common.Timestamp,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (requests.get(requestId)) {
      case (?req) {
        let issueDate = switch (req.issueDate) {
          case (?d) { ?d };
          case null { ?Time.now() };
        };
        let updated = { req with returnDate = ?returnDate; issueDate };
        requests.add(requestId, updated);
        #ok(());
      };
      case null { #err("Request not found: " # requestId) };
    };
  };

  /// Admin marks a request's book as returned (or reverts it).
  public shared func updateIssuedBookStatus(
    adminToken : Text,
    requestId : Common.RequestId,
    returned : Bool,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (requests.get(requestId)) {
      case (?req) {
        var updated = { req with returned };
        if (returned) {
          updated := { updated with status = "Returned" };
          // Restore inventory for all selected books
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
        #ok(());
      };
      case null { #err("Request not found: " # requestId) };
    };
  };

  /// Return Timeline: all non-returned approved/procured requests with urgency.
  /// Admin only.
  public query func getReturnTimeline(adminToken : Text) : async [RequestTypes.ReturnTimelineEntry] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    let nowNs = Time.now();
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
    requests.values()
      .filter(func(r) {
        not r.returned and (r.status == "Approved" or r.status == "Procured")
      })
      .map(func(r : RequestTypes.BookRequest) : RequestTypes.ReturnTimelineEntry {
        // Collect all book titles for this request
        let titles = r.selectedBookIds.map(func(bid) {
          switch (books.get(bid)) {
            case (?b) { b.title };
            case null {
              switch (r.requestedBooks.find(func(rb) { true })) {
                case (?rb) { rb.title };
                case null { bid };
              };
            };
          };
        });
        let extraTitles = r.requestedBooks.map(func(rb) { rb.title });
        let bookTitles = titles.concat(extraTitles);
        let issueDate = switch (r.issueDate) {
          case (?d) { d };
          case null { r.createdAt };
        };
        let daysUntilReturn = switch (r.returnDate) {
          case (?rd) { (rd - nowNs) / dayNs };
          case null { 99 };
        };
        {
          requestId = r.requestId;
          studentId = r.userId;
          studentName = r.studentName;
          studentCourse = r.studentCourse;
          bookTitles;
          issueDate;
          returnDate = r.returnDate;
          returned = r.returned;
          daysUntilReturn;
          nextReservedStudent = null;
          phone = r.studentPhone;
        };
      })
      .toArray();
  };

  /// Inventory lifecycle view: per-book current holder, waiting queue, and procurement requests.
  /// Admin only.
  public query func getInventoryLifecycle(
    adminToken : Text,
  ) : async [{
    bookId : Common.BookId;
    bookTitle : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    availableCount : Nat;
    totalQuantity : Nat;
    currentHolders : [{ studentId : Common.UserId; studentName : Text; issueDate : Common.Timestamp; expectedReturnDate : Common.Timestamp }];
    waitingQueue : [{ studentId : Common.UserId; studentName : Text; reservationDate : Common.Timestamp }];
    procurementRequests : [ProcurementTypes.ProcurementRequest];
  }] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
    books.values()
      .filter(func(b) { not b.isDeleted })
      .map(func(book : BookTypes.Book) : {
        bookId : Common.BookId;
        bookTitle : Text;
        author : Text;
        edition : Text;
        publisher : Text;
        availableCount : Nat;
        totalQuantity : Nat;
        currentHolders : [{ studentId : Common.UserId; studentName : Text; issueDate : Common.Timestamp; expectedReturnDate : Common.Timestamp }];
        waitingQueue : [{ studentId : Common.UserId; studentName : Text; reservationDate : Common.Timestamp }];
        procurementRequests : [ProcurementTypes.ProcurementRequest];
      } {
        // Build currentHolders from active (non-returned) approved requests
        let currentHolders = requests.values()
          .filter(func(r) {
            not r.returned and
            (r.status == "Approved" or r.status == "Procured") and
            r.selectedBookIds.find(func(bid) { bid == book.bookId }) != null
          })
          .map(func(r : RequestTypes.BookRequest) : { studentId : Common.UserId; studentName : Text; issueDate : Common.Timestamp; expectedReturnDate : Common.Timestamp } {
            let issueDate = switch (r.issueDate) { case (?d) { d }; case null { r.createdAt } };
            let expectedReturnDate = switch (r.returnDate) { case (?d) { d }; case null { r.createdAt + 14 * dayNs } };
            { studentId = r.userId; studentName = r.studentName; issueDate; expectedReturnDate };
          })
          .toArray();
        // Build waitingQueue from active reservations
        let waitingQueue = reservations.values()
          .filter(func(r) { r.bookId == book.bookId and r.status == #Waiting })
          .map(func(r : ReservationTypes.Reservation) : { studentId : Common.UserId; studentName : Text; reservationDate : Common.Timestamp } {
            let name = switch (users.get(r.studentId)) { case (?u) { u.name }; case null { r.studentId } };
            { studentId = r.studentId; studentName = name; reservationDate = r.requestDate };
          })
          .toArray();
        // Procurement requests linked to this book
        let bookProcs = procurements.values()
          .filter(func(p) {
            switch (p.bookId) { case (?bid) { bid == book.bookId }; case null { false } }
          })
          .toArray();
        {
          bookId = book.bookId;
          bookTitle = book.title;
          author = book.author;
          edition = book.edition;
          publisher = book.publisher;
          availableCount = book.availableCount;
          totalQuantity = book.totalQuantity;
          currentHolders;
          waitingQueue;
          procurementRequests = bookProcs;
        };
      })
      .toArray();
  };

  /// Get books expected to return within N days, with next-in-queue info.
  /// Admin only.
  public query func getBooksReturningByDate(
    adminToken : Text,
    days : Nat,
  ) : async [{
    requestId : Common.RequestId;
    bookId : Common.BookId;
    bookTitle : Text;
    studentId : Common.UserId;
    studentName : Text;
    returnDate : Common.Timestamp;
    daysUntilReturn : Int;
    nextReservedStudent : ?{ studentId : Common.UserId; studentName : Text };
  }] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    let nowNs = Time.now();
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
    let cutoff = nowNs + days.toInt() * dayNs;
    let result = List.empty<{ requestId : Common.RequestId; bookId : Common.BookId; bookTitle : Text; studentId : Common.UserId; studentName : Text; returnDate : Common.Timestamp; daysUntilReturn : Int; nextReservedStudent : ?{ studentId : Common.UserId; studentName : Text } }>();
    requests.values()
      .filter(func(r) {
        not r.returned and
        (r.status == "Approved" or r.status == "Procured") and
        (switch (r.returnDate) { case (?rd) { rd <= cutoff }; case null { false } })
      })
      .forEach(func(r : RequestTypes.BookRequest) {
        for (bookId in r.selectedBookIds.values()) {
          let bookTitle = switch (books.get(bookId)) { case (?b) { b.title }; case null { bookId } };
          let returnDate = switch (r.returnDate) { case (?rd) { rd }; case null { 0 } };
          let daysUntilReturn = (returnDate - nowNs) / dayNs;
          let nextRes = reservations.values().find(func(res) {
            res.bookId == bookId and res.status == #Waiting
          });
          let nextReservedStudent : ?{ studentId : Common.UserId; studentName : Text } =
            switch (nextRes) {
              case null { null };
              case (?res) {
                let name = switch (users.get(res.studentId)) { case (?u) { u.name }; case null { res.studentId } };
                ?{ studentId = res.studentId; studentName = name };
              };
            };
          result.add({
            requestId = r.requestId;
            bookId;
            bookTitle;
            studentId = r.userId;
            studentName = r.studentName;
            returnDate;
            daysUntilReturn;
            nextReservedStudent;
          });
        };
      });
    result.toArray();
  };

  /// Return Alerts: non-returned requests sorted by returnDate ascending, with urgency colours.
  /// Includes nextReservedStudent for each book.
  public query func getAdminReturnAlerts(
    adminToken : Text,
  ) : async [{
    requestId : Common.RequestId;
    bookId : Common.BookId;
    bookTitle : Text;
    studentId : Common.UserId;
    studentName : Text;
    returnDate : ?Common.Timestamp;
    daysUntilReturn : Int;
    urgency : Text; // "red" | "yellow" | "green"
    nextReservedStudent : ?{ studentId : Common.UserId; studentName : Text };
  }] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    let nowNs = Time.now();
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
    let result = List.empty<{
      requestId : Common.RequestId;
      bookId : Common.BookId;
      bookTitle : Text;
      studentId : Common.UserId;
      studentName : Text;
      returnDate : ?Common.Timestamp;
      daysUntilReturn : Int;
      urgency : Text;
      nextReservedStudent : ?{ studentId : Common.UserId; studentName : Text };
    }>();
    requests.values()
      .filter(func(r) {
        not r.returned and (r.status == "Approved" or r.status == "Procured")
      })
      .forEach(func(r : RequestTypes.BookRequest) {
        for (bookId in r.selectedBookIds.values()) {
          let bookTitle = switch (books.get(bookId)) { case (?b) { b.title }; case null { bookId } };
          let daysUntilReturn = switch (r.returnDate) {
            case (?rd) { (rd - nowNs) / dayNs };
            case null { 99 };
          };
          let urgency = if (daysUntilReturn < 0) { "red" }
            else if (daysUntilReturn <= 2) { "red" }
            else if (daysUntilReturn <= 5) { "yellow" }
            else { "green" };
          let nextRes = reservations.values().find(func(res) {
            res.bookId == bookId and res.status == #Waiting
          });
          let nextReservedStudent : ?{ studentId : Common.UserId; studentName : Text } =
            switch (nextRes) {
              case null { null };
              case (?res) {
                let name = switch (users.get(res.studentId)) { case (?u) { u.name }; case null { res.studentId } };
                ?{ studentId = res.studentId; studentName = name };
              };
            };
          result.add({
            requestId = r.requestId;
            bookId;
            bookTitle;
            studentId = r.userId;
            studentName = r.studentName;
            returnDate = r.returnDate;
            daysUntilReturn;
            urgency;
            nextReservedStudent;
          });
        };
      });
    // Sort ascending by daysUntilReturn (overdue/soonest first)
    let arr = result.toArray();
    arr.sort(func(a, b) {
      if (a.daysUntilReturn < b.daysUntilReturn) { #less }
      else if (a.daysUntilReturn > b.daysUntilReturn) { #greater }
      else { #equal }
    });
  };

  /// Book Flow: per active book, show currentHolder and nextReservedStudent.
  public query func getBookLifecycleFlow(
    adminToken : Text,
  ) : async [{
    bookId : Common.BookId;
    bookTitle : Text;
    currentHolder : ?{ userId : Common.UserId; name : Text; issueDate : Common.Timestamp; returnDate : ?Common.Timestamp };
    nextReservedStudent : ?{ userId : Common.UserId; name : Text; reservationDate : Common.Timestamp };
  }] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    let result = List.empty<{
      bookId : Common.BookId;
      bookTitle : Text;
      currentHolder : ?{ userId : Common.UserId; name : Text; issueDate : Common.Timestamp; returnDate : ?Common.Timestamp };
      nextReservedStudent : ?{ userId : Common.UserId; name : Text; reservationDate : Common.Timestamp };
    }>();
    books.values()
      .filter(func(b) { not b.isDeleted })
      .forEach(func(book : BookTypes.Book) {
        // Find the earliest-issued active request for this book
        let activeReqs = requests.values()
          .filter(func(r) {
            not r.returned and
            (r.status == "Approved" or r.status == "Procured") and
            r.selectedBookIds.find(func(bid) { bid == book.bookId }) != null
          })
          .toArray();
        if (activeReqs.size() == 0) { return }; // skip books with no active holder
        let holderReq = activeReqs[0];
        let issueDate = switch (holderReq.issueDate) { case (?d) { d }; case null { holderReq.createdAt } };
        let currentHolder : ?{ userId : Common.UserId; name : Text; issueDate : Common.Timestamp; returnDate : ?Common.Timestamp } = ?{
          userId = holderReq.userId;
          name = holderReq.studentName;
          issueDate;
          returnDate = holderReq.returnDate;
        };
        // Find the earliest-queued reservation for this book
        let waitingRes = reservations.values()
          .filter(func(r) { r.bookId == book.bookId and r.status == #Waiting })
          .toArray()
          .sort(func(a, b) {
            if (a.requestDate < b.requestDate) { #less }
            else if (a.requestDate > b.requestDate) { #greater }
            else { #equal }
          });
        let nextReservedStudent : ?{ userId : Common.UserId; name : Text; reservationDate : Common.Timestamp } =
          if (waitingRes.size() > 0) {
            let res = waitingRes[0];
            let name = switch (users.get(res.studentId)) { case (?u) { u.name }; case null { res.studentId } };
            ?{ userId = res.studentId; name; reservationDate = res.requestDate };
          } else { null };
        result.add({
          bookId = book.bookId;
          bookTitle = book.title;
          currentHolder;
          nextReservedStudent;
        });
      });
    result.toArray();
  };

  // ─── Collection Queue ────────────────────────────────────────────────────

  /// Get the book collection queue: requests approved but not yet collected, sorted by deadline.
  public query func getCollectionQueue(
    adminToken : Text,
  ) : async [CollectionTypes.CollectionEntry] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    let now = Time.now();
    let threeDaysNs : Int = 3 * 24 * 60 * 60 * 1_000_000_000;
    let result = List.empty<CollectionTypes.CollectionEntry>();
    requests.values()
      .filter(func(r) {
        r.status == "Approved" and not r.returned
      })
      .forEach(func(r : RequestTypes.BookRequest) {
        let approvalDate = switch (r.issueDate) {
          case (?d) { d };
          case null { r.createdAt };
        };
        let collectionDeadline = approvalDate + threeDaysNs;
        for (bookId in r.selectedBookIds.values()) {
          let bookTitle = switch (books.get(bookId)) {
            case (?b) { b.title };
            case null { bookId };
          };
          result.add({
            entryId = r.requestId # "-" # bookId;
            studentId = r.userId;
            studentName = r.studentName;
            bookId;
            bookTitle;
            requestId = r.requestId;
            approvalDate;
            collectionDeadline;
            collected = false;
          });
        };
      });
    let arr = result.toArray();
    arr.sort(func(a, b) { Int.compare(a.collectionDeadline, b.collectionDeadline) });
  };

  /// Mark a specific book in a request as collected by the student.
  public shared func markBookCollected(
    adminToken : Text,
    requestId : Common.RequestId,
    bookId : Common.BookId,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (requests.get(requestId)) {
      case null { #err("Request not found: " # requestId) };
      case (?req) {
        // Mark approval as Collected for that book
        let newApprovals = req.bookApprovals.map(
          func((bid, status)) {
            if (bid == bookId and status == "Approved") { (bid, "Collected") } else { (bid, status) }
          }
        );
        let updated = { req with bookApprovals = newApprovals };
        requests.add(requestId, updated);
        AuditLib.logAudit(
          auditLog, auditCounter,
          "admin", #Admin,
          #BookIssue,
          requestId,
          ?("Book " # bookId # " collected by " # req.userId),
        );
        #ok(());
      };
    };
  };

  // ─── Return Reminders ────────────────────────────────────────────────────

  /// Send return reminder notifications for books due in 30, 15, 7, 3, or 1 days.
  /// Returns the count of reminders sent.
  public shared func triggerReturnReminders(
    adminToken : Text,
  ) : async Nat {
    if (not AdminLib.isAdminToken(adminToken)) { return 0 };
    let now = Time.now();
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
    let thresholds : [Int] = [30, 15, 7, 3, 1];
    var count = 0;
    requests.values()
      .filter(func(r) {
        not r.returned and (r.status == "Approved" or r.status == "Procured")
      })
      .forEach(func(r : RequestTypes.BookRequest) {
        switch (r.returnDate) {
          case null {};
          case (?rd) {
            let daysLeft = (rd - now) / dayNs;
            let matches = thresholds.find(func(t) { daysLeft == t }) != null;
            if (matches) {
              let bookTitles = r.selectedBookIds.map(func(bid) {
                switch (books.get(bid)) { case (?b) { b.title }; case null { bid } }
              });
              let titles = if (bookTitles.size() > 0) { bookTitles[0] } else { "your books" };
              let _ = NotificationsLib.createNotification(
                notifications, notificationCounter,
                r.userId, #ReturnAlert,
                "Return Reminder",
                "Please return \"" # titles # "\" in " # daysLeft.toText() # " day(s).",
                null, now,
              );
              count += 1;
            };
          };
        };
      });
    count;
  };

  // ─── Update Student ──────────────────────────────────────────────────────

  /// Admin can edit a student's profile fields.
  public shared func updateStudent(
    adminToken : Text,
    userId : Common.UserId,
    firstName : Text,
    middleName : Text,
    grandFatherName : Text,
    surname : Text,
    phone : Text,
    aadhaar : Text,
    course : Text,
    academicYear : Text,
    membershipStatusText : Text,
    issueStatusText : Text,
  ) : async Types.Result<UserTypes.UserPublic, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (users.get(userId)) {
      case null { #err("User not found: " # userId) };
      case (?user) {
        let fullName = firstName # " " # middleName # " " # grandFatherName # " " # surname;
        let membershipStatus : UserTypes.MembershipStatus = if (membershipStatusText == "PAID") { #PAID } else { #NOT_PAID };
        let updated = {
          user with
          firstName;
          middleName;
          grandFatherName;
          surname;
          name = fullName;
          phone;
          aadhaarNumber = aadhaar;
          course;
          academicYear;
          membershipStatus;
        };
        users.add(userId, updated);
        AuditLib.logAudit(
          auditLog, auditCounter,
          "admin", #Admin,
          #ProfileUpdate,
          userId,
          ?("Admin updated student profile: " # userId),
        );
        #ok(UsersLib.toPublic(updated));
      };
    };
  };

  // ─── Year Promotion ──────────────────────────────────────────────────────

  /// Send year-end notifications to all active students for a given academic year.
  /// Returns count of students notified.
  public shared func initiateYearPromotion(
    adminToken : Text,
    academicYear : Text,
  ) : async Nat {
    if (not AdminLib.isAdminToken(adminToken)) { return 0 };
    let now = Time.now();
    var count = 0;
    users.values()
      .filter(func(u) { u.membershipStatus == #PAID and u.academicYear == academicYear })
      .forEach(func(u : UserTypes.User) {
        let _ = NotificationsLib.createNotification(
          notifications, notificationCounter,
          u.studentId, #General,
          "Academic Year Ending",
          "Your academic year is ending. Your current books are due for return. Would you like to return them or continue to the next year?",
          null, now,
        );
        count += 1;
      });
    count;
  };

  /// Student chooses to return books or continue to next year.
  public shared func processYearPromotion(
    studentToken : Text,
    choice : CollectionTypes.YearPromotionChoice,
  ) : async Types.Result<Text, Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(studentToken, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    let user = switch (users.get(userId)) {
      case null { return #err("User not found") };
      case (?u) { u };
    };
    switch (choice) {
      case (#ReturnBooks) {
        let _ = NotificationsLib.createNotification(
          notifications, notificationCounter,
          userId, #General,
          "Return Confirmed",
          "Thank you for choosing to return your books. Please bring them to the library.",
          null, now,
        );
        #ok("Please return your books to the library.");
      };
      case (#ContinueNextYear) {
        // Increment academic year
        let nextYear = switch (user.academicYear) {
          case ("FY") { "SY" };
          case ("SY") { "TY" };
          case ("TY") { "TY" }; // Stays TY if already final year
          case other { other };
        };
        let promoted = { user with academicYear = nextYear };
        users.add(userId, promoted);
        AuditLib.logAudit(
          auditLog, auditCounter,
          userId, #Student,
          #ProfileUpdate,
          userId,
          ?("Year promoted from " # user.academicYear # " to " # nextYear),
        );
        let _ = NotificationsLib.createNotification(
          notifications, notificationCounter,
          userId, #General,
          "Year Promoted",
          "Congratulations! You have been promoted to " # nextYear # ". New book recommendations will be available.",
          null, now,
        );
        #ok("Promoted to " # nextYear);
      };
    };
  };

  /// Public query — returns the URL that should be encoded into the student's QR code.
  public query func getStudentQrUrl(userId : Common.UserId) : async Text {
    "/student/qr/" # userId;
  };

    /// Public query — returns a user's profile and all their issued books.
  /// Used by the QR scan page to show a digital challan.
  public query func getStudentProfile(
    userId : Common.UserId,
  ) : async ?UserTypes.UserPublic {
    switch (users.get(userId)) {
      case null { null };
      case (?user) {
        let issuedBooksInfo : [RequestTypes.IssuedBookInfo] = requests.values()
          .filter(func(r) {
            r.userId == userId and (r.status == "Approved" or r.status == "Procured" or r.status == "Returned")
          })
      .map(func(r : RequestTypes.BookRequest) : RequestTypes.IssuedBookInfo {
            let bookTitle = if (r.selectedBookIds.size() > 0) {
              switch (books.get(r.selectedBookIds[0])) {
                case (?b) { b.title };
                case null {
                  if (r.requestedBooks.size() > 0) { r.requestedBooks[0].title } else { "" };
                };
              };
            } else {
              if (r.requestedBooks.size() > 0) { r.requestedBooks[0].title } else { "" };
            };
            let bookId = if (r.selectedBookIds.size() > 0) { r.selectedBookIds[0] } else { "" };
            let issueDate = switch (r.issueDate) {
              case (?d) { d };
              case null { r.createdAt };
            };
            {
              requestId = r.requestId;
              userId = r.userId;
              studentName = user.name;
              bookId;
              bookTitle;
              issueDate;
              expectedReturnDate = switch (r.returnDate) {
                case (?d) { d };
                case null { r.createdAt + 1_209_600_000_000_000 };
              };
              returnDate = r.returnDate;
              returned = r.returned;
              status = if (r.returned) { "Returned" } else { r.status };
              bookIds = r.selectedBookIds;
            };
          })
          .toArray();
        ?{
          studentId = user.studentId;
          name = user.name;
          firstName = user.firstName;
          middleName = user.middleName;
          grandFatherName = user.grandFatherName;
          surname = user.surname;
          aadhaarNumber = user.aadhaarNumber;
          frozenAadhaar = user.frozenAadhaar;
          frozenPhone = user.frozenPhone;
          phone = user.phone;
          course = user.course;
          academicYear = user.academicYear;
          college = user.college;
          profileImageUrl = "";
          paymentStatus = user.paymentStatus;
          paymentId = user.paymentId;
          membershipStartDate = user.membershipStartDate;
          createdAt = user.createdAt;
          membershipStatus = user.membershipStatus;
          role = user.role;
          issuedBooksInfo;
          email = user.email;
          birthDate = user.birthDate;
          parentContact = user.parentContact;
          nativePlace = user.nativePlace;
          educationLevel = user.educationLevel;
          educationSpecialization = user.educationSpecialization;
          occupation = user.occupation;
          occupationOther = user.occupationOther;
          officialSurname = user.officialSurname;
          courseName = user.courseName;
          currentLocation = user.currentLocation;
        };
      };
    };
  };
};
