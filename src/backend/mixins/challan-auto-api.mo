import Map "mo:core/Map";
import Common "../types/common";
import UserTypes "../types/user";
import BookTypes "../types/book";
import RequestTypes "../types/request";
import ChallanTypes "../types/challan";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";
import NotifTypes "../types/notification";
import EmailNotifTypes "../types/notifications";
import AuditTypes "../types/audit";
import Time "mo:core/Time";
import EmailClient "mo:caffeineai-email/emailClient";
import ChallanGenLib "../lib/challan-gen";
import NotificationsLib "../lib/notifications";
import EmailLib "../lib/email-notifications";
import AuditLib "../lib/audit";
import AdminLib "../lib/admin";
import UsersLib "../lib/users";
import Result "mo:core/Result";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

/// Challan auto-generation mixin.
/// Responsible for:
///   - Generating a structured Challan record every time admin approves or
///     rejects any book within a request.
///   - Emailing the challan PDF link to the student immediately.
///   - Storing the challan permanently with a sequential CHN-NNNNN number.
mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  books : Map.Map<Common.BookId, BookTypes.Book>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
  challanCounter : { var value : Nat },
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  reservationCounter : { var value : Nat },
  procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
  emailLogs : Map.Map<Text, EmailNotifTypes.EmailNotificationLog>,
  emailLogCounter : { var value : Nat },
  auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
  auditCounter : { var value : Nat },
) {

  /// Generate a complete Challan for a request after the admin has made
  /// all per-book decisions (approve / reject / reserve / procurement).
  /// Returns the persisted Challan.
  /// Also:
  ///   - creates an in-app notification for the student
  ///   - sends an email to the student's address with the challan summary
  ///   - logs an audit entry (ChallanGenerated action)
  public shared func generateChallanForRequest(
    adminToken : Text,
    requestId : Common.RequestId,
    adminName : Text,
  ) : async { #ok : ChallanTypes.Challan; #err : Text } {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    // Fetch request
    let request = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    // Fetch student
    let user = switch (users.get(request.userId)) {
      case null { return #err("Student not found: " # request.userId) };
      case (?u) { u };
    };
    // Generate challan number and ID
    challanCounter.value += 1;
    let challanNumber = ChallanGenLib.generateChallanNumber(challanCounter.value);
    let challanId = "CHL-" # challanCounter.value.toText();
    // Build the full challan record
    let challan = ChallanGenLib.buildChallan(
      challanId,
      challanNumber,
      request,
      user,
      books,
      reservations,
      procurements,
      adminName,
      now,
    );
    // Persist the challan
    challans.add(challanId, challan);
    // Link challan back to request
    let updatedRequest = { request with challanId = ?challanId };
    requests.add(requestId, updatedRequest);
    // Create in-app notification for the student
    ignore NotificationsLib.createNotification(
      notifications,
      notificationCounter,
      user.studentId,
      #General,
      "Challan Generated",
      "A new challan (" # challanNumber # ") has been generated for your request.",
      null,
      now,
    );
    // Send challan email
    if (user.email != "") {
      let subject = "Challan Generated - SVGA Book Bank (" # challanNumber # ")";
      let studentName = UsersLib.getFullName(user);
      let body = EmailLib.buildBody("book_approved", studentName, user.studentId, null, ?("Challan: " # challanNumber), null);
      let sendResult = await EmailClient.sendServiceEmail(
        "svga-book-bank",
        [user.email],
        subject,
        body,
      );
      // Log the email attempt
      let (success, messageId, errorMsg) = switch (sendResult) {
        case (#ok) { (true, null, null) };
        case (#err(e)) { (false, null, ?e) };
      };
      let emailReq : EmailNotifTypes.EmailNotificationRequest = {
        toEmail = user.email;
        subject;
        body;
        attachmentUrl = null;
        eventType = "challan_generated";
        studentId = ?user.studentId;
        challanId = ?challanId;
      };
      let emailResult : EmailNotifTypes.EmailSendResult = {
        success;
        messageId;
        error = errorMsg;
        sentAt = now;
      };
      ignore EmailLib.logEmail(emailLogs, emailLogCounter, emailReq, emailResult);
    };
    // Audit log
    AuditLib.logAudit(
      auditLog,
      auditCounter,
      "admin",
      #Admin,
      #BookApproval,
      requestId,
      ?("Challan generated: " # challanNumber),
    );
    #ok(challan);
  };

  /// Get all challans for a specific student (admin view).
  /// Returns newest first.
  public query func getStudentChallans(
    adminToken : Text,
    studentId : Common.UserId,
  ) : async [ChallanTypes.Challan] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    // Return challans newest first
    let studentChallans = challans.values()
      .filter(func(c) { c.studentId == studentId })
      .toArray();
    studentChallans.sort(func(a, b) {
      if (a.generatedAt > b.generatedAt) { #less }
      else if (a.generatedAt < b.generatedAt) { #greater }
      else { #equal };
    });
  };

  /// Approve/reject a book and immediately regenerate the challan in one
  /// atomic admin action.
  /// Combines updateBookApproval + generateChallanForRequest.
  public shared func approveBookAndUpdateChallan(
    adminToken : Text,
    requestId : Common.RequestId,
    bookId : Common.BookId,
    action : { #Accept; #Reject; #AcceptReservation; #RejectReservation },
    expectedDate : ?Text,
    adminName : Text,
  ) : async { #ok : { request : RequestTypes.BookRequest; challan : ChallanTypes.Challan }; #err : Text } {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    // Fetch the request
    let request = switch (requests.get(requestId)) {
      case null { return #err("Request not found: " # requestId) };
      case (?r) { r };
    };
    // Map the action to approval status string
    let newStatus = switch (action) {
      case (#Accept) { "Approved" };
      case (#Reject) { "Rejected" };
      case (#AcceptReservation) { "Reserved" };
      case (#RejectReservation) { "Rejected" };
    };
    // Update the per-book approval map
    // Rebuild the bookApprovals array updating the target book
    var foundApproval = false;
    let updatedApprovals = request.bookApprovals.map(func((bid, status)) {
      if (bid == bookId) {
        foundApproval := true;
        (bid, newStatus)
      } else {
        (bid, status)
      }
    });
    let newApprovals : [(Common.BookId, Text)] = if (not foundApproval) {
      let extra : [(Common.BookId, Text)] = [(bookId, newStatus)];
      updatedApprovals.vals().concat(extra.vals()).toArray()
    } else {
      updatedApprovals
    };
    // Update the request status to reflect the overall decision
    let hasPending = newApprovals.vals().find(func((_, s)) { s == "Pending" }) != null;
    let overallStatus = if (hasPending) { "pending" } else { "approved" };
    let updatedRequest = { request with
      bookApprovals = newApprovals;
      status = overallStatus;
    };
    requests.add(requestId, updatedRequest);
    // Update inventory if approving/rejecting affects availability
    switch (action) {
      case (#Accept) {
        switch (books.get(bookId)) {
          case null {};
          case (?book) {
            if (book.availableQuantity > 0) {
              let newAvail : Nat = book.availableQuantity - 1;
              let updatedBook = { book with
                availableQuantity = newAvail;
                availableCount = newAvail;
                isAvailable = newAvail > 0;
              };
              books.add(bookId, updatedBook);
            };
          };
        };
        // Audit
        AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookApproval, bookId, ?("Approved for request " # requestId));
      };
      case (#Reject) {
        AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookRejection, bookId, ?("Rejected for request " # requestId));
      };
      case (#AcceptReservation) {
        // Create or update a reservation for this student
        reservationCounter.value += 1;
        let resId = "RES-" # reservationCounter.value.toText();
        let expectedTs : ?Common.Timestamp = switch (expectedDate) {
          case null { null };
          case (?d) {
            // Parse simple date string (days from now as fallback)
            ?( now + 30 * 24 * 60 * 60 * 1_000_000_000 )
          };
        };
        let reservation : ReservationTypes.Reservation = {
          id = resId;
          studentId = request.userId;
          bookId;
          requestDate = now;
          expectedAvailabilityDate = expectedTs;
          status = #Waiting;
        };
        reservations.add(resId, reservation);
        AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #ReservationCreation, bookId, ?("Reservation for request " # requestId));
      };
      case (#RejectReservation) {
        AuditLib.logAudit(auditLog, auditCounter, "admin", #Admin, #BookRejection, bookId, ?("Reservation rejected for request " # requestId));
      };
    };
    // Generate/update the challan
    challanCounter.value += 1;
    let challanNumber = ChallanGenLib.generateChallanNumber(challanCounter.value);
    let challanId = "CHL-" # challanCounter.value.toText();
    let user = switch (users.get(request.userId)) {
      case null { return #err("Student not found") };
      case (?u) { u };
    };
    // Refetch updated request
    let finalRequest = switch (requests.get(requestId)) {
      case null { return #err("Request disappeared") };
      case (?r) { r };
    };
    let challan = ChallanGenLib.buildChallan(
      challanId,
      challanNumber,
      finalRequest,
      user,
      books,
      reservations,
      procurements,
      adminName,
      now,
    );
    challans.add(challanId, challan);
    let finalUpdated = { finalRequest with challanId = ?challanId };
    requests.add(requestId, finalUpdated);
    // Notify student
    let (notifTitle, notifMsg) = switch (action) {
      case (#Accept) { ("Book Request Approved", "Your book request has been approved. Please collect your book.") };
      case (#Reject) { ("Book Request Rejected", "Your book request has been rejected.") };
      case (#AcceptReservation) { ("Book Reserved", "Your book has been reserved. We'll notify you when it's available.") };
      case (#RejectReservation) { ("Reservation Rejected", "Your reservation request was rejected.") };
    };
    ignore NotificationsLib.createNotification(
      notifications,
      notificationCounter,
      user.studentId,
      #General,
      notifTitle,
      notifMsg,
      null,
      now,
    );
    // Email the student
    if (user.email != "") {
      let eventType = switch (action) {
        case (#Accept) { "book_approved" };
        case (#Reject) { "book_rejected" };
        case (#AcceptReservation) { "book_reserved" };
        case (#RejectReservation) { "book_rejected" };
      };
      let studentName = UsersLib.getFullName(user);
      let bookTitle = switch (books.get(bookId)) {
        case (?b) { ?b.title };
        case null { null };
      };
      let subject = EmailLib.buildSubject(eventType, bookTitle);
      let body = EmailLib.buildBody(eventType, studentName, user.studentId, bookTitle, null, null);
      ignore await EmailClient.sendServiceEmail("svga-book-bank", [user.email], subject, body);
    };
    #ok({ request = finalUpdated; challan });
  };

  /// Send the challan email to the student for an existing challan.
  /// Can be called by admin to resend if initial delivery failed.
  public shared func sendChallanEmail(
    adminToken : Text,
    challanId : Common.ChallanId,
  ) : async { #ok : EmailNotifTypes.EmailSendResult; #err : Text } {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    let challan = switch (challans.get(challanId)) {
      case null { return #err("Challan not found: " # challanId) };
      case (?c) { c };
    };
    if (challan.studentEmail == "") {
      return #err("No email address on file for student");
    };
    let subject = "Challan " # challan.challanNumber # " - SVGA Book Bank";
    let body = EmailLib.buildBody(
      "book_approved",
      challan.studentName,
      challan.studentId,
      null,
      ?("Challan Number: " # challan.challanNumber),
      null,
    );
    let sendResult = await EmailClient.sendServiceEmail(
      "svga-book-bank",
      [challan.studentEmail],
      subject,
      body,
    );
    let (success, messageId, errorMsg) = switch (sendResult) {
      case (#ok) { (true, null, null) };
      case (#err(e)) { (false, null, ?e) };
    };
    let emailReq : EmailNotifTypes.EmailNotificationRequest = {
      toEmail = challan.studentEmail;
      subject;
      body;
      attachmentUrl = null;
      eventType = "challan_resend";
      studentId = ?challan.studentId;
      challanId = ?challanId;
    };
    let emailResult : EmailNotifTypes.EmailSendResult = {
      success;
      messageId;
      error = errorMsg;
      sentAt = now;
    };
    ignore EmailLib.logEmail(emailLogs, emailLogCounter, emailReq, emailResult);
    if (success) { #ok(emailResult) } else {
      #err(switch (errorMsg) { case (?e) e; case null "Email send failed" });
    };
  };
};
