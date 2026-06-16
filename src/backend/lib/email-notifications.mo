import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import NotifTypes "../types/notifications";

module {
  // ── ID generation ─────────────────────────────────────────────────────────
  public func generateEmailLogId(counter : Nat) : Text {
    "ELOG" # counter.toText();
  };

  // ── Email notification helpers ─────────────────────────────────────────────
  /// Build the subject line for a lifecycle event type.
  public func buildSubject(eventType : NotifTypes.NotificationEventType, bookTitle : ?Text) : Text {
    let bookPart = switch (bookTitle) {
      case (?t) { ": " # t };
      case null { "" };
    };
    let base = switch (eventType) {
      case ("registration_success") { "Welcome to SVGA Book Bank" };
      case ("payment_success") { "Payment Received - SVGA Book Bank" };
      case ("book_approved") { "Book Request Approved - SVGA Book Bank" };
      case ("book_rejected") { "Book Request Rejected - SVGA Book Bank" };
      case ("book_reserved") { "Book Reserved Successfully - SVGA Book Bank" };
      case ("book_ready_for_collection") { "Your Book is Ready for Collection - SVGA Book Bank" };
      case ("book_due_for_return") { "Return Reminder - SVGA Book Bank" };
      case ("return_reminder") { "Book Return Reminder - SVGA Book Bank" };
      case ("course_completion") { "Course Completion Notice - SVGA Book Bank" };
      case ("renewal_available") { "Book Renewal Available - SVGA Book Bank" };
      case ("book_available_from_waiting_list") { "Your Reserved Book is Now Available - SVGA Book Bank" };
      case (_) { "Notification from SVGA Book Bank" };
    };
    base # bookPart;
  };

  /// Build the HTML body for a lifecycle notification email.
  public func buildBody(
    eventType : NotifTypes.NotificationEventType,
    studentName : Text,
    studentId : Text,
    bookTitle : ?Text,
    extraInfo : ?Text,
    challanUrl : ?Text,
  ) : Text {
    let bookLine = switch (bookTitle) {
      case (?t) { "<p><strong>Book:</strong> " # t # "</p>" };
      case null { "" };
    };
    let extraLine = switch (extraInfo) {
      case (?info) { "<p>" # info # "</p>" };
      case null { "" };
    };
    let challanLine = switch (challanUrl) {
      case (?url) { "<p><a href='" # url # "'>View Challan</a></p>" };
      case null { "" };
    };
    let bodyContent = switch (eventType) {
      case ("registration_success") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Welcome to SVGA Book Bank! Your registration is complete.</p>" #
        "<p><strong>Student ID:</strong> " # studentId # "</p>";
      };
      case ("payment_success") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Your membership payment has been received. You can now request books.</p>" #
        "<p><strong>Student ID:</strong> " # studentId # "</p>";
      };
      case ("book_approved") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Your book request has been <strong>approved</strong>. Please collect your book at the earliest.</p>" #
        bookLine;
      };
      case ("book_rejected") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Unfortunately, your book request has been <strong>rejected</strong>.</p>" #
        bookLine # extraLine;
      };
      case ("book_reserved") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Your book has been <strong>reserved</strong> successfully. We will notify you when it becomes available.</p>" #
        bookLine # extraLine;
      };
      case ("book_ready_for_collection") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Your book is now <strong>ready for collection</strong> at the SVGA Book Bank.</p>" #
        bookLine;
      };
      case ("book_due_for_return") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>This is a reminder that your book is due for return soon.</p>" #
        bookLine # extraLine;
      };
      case ("return_reminder") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Please return your book to the SVGA Book Bank before the due date.</p>" #
        bookLine # extraLine;
      };
      case ("book_available_from_waiting_list") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Great news! A book you were waiting for is now <strong>available</strong>.</p>" #
        bookLine;
      };
      case ("course_completion") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Your course is completing soon. Please return all books or renew your membership.</p>" #
        extraLine;
      };
      case ("renewal_available") {
        "<p>Dear " # studentName # ",</p>" #
        "<p>Your membership is eligible for renewal. Visit SVGA Book Bank to continue.</p>";
      };
      case (_) {
        "<p>Dear " # studentName # ",</p>" #
        "<p>You have a new notification from SVGA Book Bank.</p>" #
        extraLine;
      };
    };
    "<html><body style='font-family:sans-serif;color:#333;'>" #
    "<div style='max-width:600px;margin:auto;padding:20px;'>" #
    "<h2 style='color:#1e40af;'>SVGA Book Bank</h2>" #
    bodyContent #
    challanLine #
    "<hr/><p style='font-size:12px;color:#888;'>SVGA Book Bank Management System</p>" #
    "</div></body></html>";
  };

  // ── Log management ────────────────────────────────────────────────────────
  /// Record a sent email notification in the log map.
  public func logEmail(
    emailLogs : Map.Map<Text, NotifTypes.EmailNotificationLog>,
    counter : { var value : Nat },
    request : NotifTypes.EmailNotificationRequest,
    result : NotifTypes.EmailSendResult,
  ) : NotifTypes.EmailNotificationLog {
    counter.value += 1;
    let logId = generateEmailLogId(counter.value);
    let entry : NotifTypes.EmailNotificationLog = {
      id = logId;
      request;
      result;
      deliveryStatus = if (result.success) { "sent" } else { "failed" };
      retryCount = 0;
      lastError = result.error;
    };
    emailLogs.add(logId, entry);
    entry;
  };

  /// Get all email logs for a student.
  public func getEmailLogsForStudent(
    emailLogs : Map.Map<Text, NotifTypes.EmailNotificationLog>,
    studentId : Common.UserId,
  ) : [NotifTypes.EmailNotificationLog] {
    emailLogs.values()
      .filter(func(log) {
        switch (log.request.studentId) {
          case (?sid) { sid == studentId };
          case null { false };
        };
      })
      .toArray();
  };
};

