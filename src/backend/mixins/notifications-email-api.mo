import Map "mo:core/Map";
import Types "mo:core/Types";
import Time "mo:core/Time";
import EmailClient "mo:caffeineai-email/emailClient";
import NotifTypes "../types/notification";
import EmailNotifTypes "../types/notifications";
import ChallanTypes "../types/challan";
import Common "../types/common";
import UsersLib "../lib/users";
import AdminLib "../lib/admin";
import UserTypes "../types/user";
import EmailLib "../lib/email-notifications";
import NotificationsLib "../lib/notifications";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
  challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
  challanCounter : { var value : Nat },
  emailLogs : Map.Map<Text, EmailNotifTypes.EmailNotificationLog>,
  emailLogCounter : { var value : Nat },
) {
  // ── Email Notifications ───────────────────────────────────────────────────

  /// Send an email notification through the platform email extension.
  /// Creates an email log entry on success or failure.
  public shared func sendEmailNotification(
    adminToken : Text,
    toEmail : Text,
    subject : Text,
    body : Text,
    attachmentUrl : ?Text,
  ) : async Types.Result<EmailNotifTypes.EmailSendResult, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    let request : EmailNotifTypes.EmailNotificationRequest = {
      toEmail;
      subject;
      body;
      attachmentUrl;
      eventType = "manual";
      studentId = null;
      challanId = null;
    };
    let sendResult = await EmailClient.sendServiceEmail(
      "svga-book-bank",
      [toEmail],
      subject,
      body,
    );
    let (success, messageId, errorMsg) = switch (sendResult) {
      case (#ok) { (true, null, null) };
      case (#err(e)) { (false, null, ?e) };
    };
    let result : EmailNotifTypes.EmailSendResult = {
      success;
      messageId;
      error = errorMsg;
      sentAt = now;
    };
    ignore EmailLib.logEmail(emailLogs, emailLogCounter, request, result);
    if (success) { #ok(result) } else {
      #err(switch (errorMsg) { case (?e) e; case null "Unknown error" });
    };
  };

  /// Send a lifecycle event email to a student automatically.
  /// Called internally when key events occur (registration, approval, etc.).
  public shared func sendLifecycleEmail(
    studentId : Common.UserId,
    eventType : EmailNotifTypes.NotificationEventType,
    bookTitle : ?Text,
    extraInfo : ?Text,
    challanUrl : ?Text,
  ) : async Types.Result<EmailNotifTypes.EmailSendResult, Text> {
    let now = Time.now();
    // Look up the student
    let student = switch (UsersLib.findById(users, studentId)) {
      case null { return #err("Student not found: " # studentId) };
      case (?u) { u };
    };
    let studentEmail = student.email;
    let studentName = UsersLib.getFullName(student);
    // Build email content
    let subject = EmailLib.buildSubject(eventType, bookTitle);
    let body = EmailLib.buildBody(eventType, studentName, studentId, bookTitle, extraInfo, challanUrl);
    // Create in-app notification
    let (title, notifMsg) = switch (eventType) {
      case ("book_approved") { ("Book Request Approved", "Your book request has been approved. Please collect your book.") };
      case ("book_rejected") { ("Book Request Rejected", switch (extraInfo) { case (?e) e; case null "Your book request was rejected." }) };
      case ("book_reserved") { ("Book Reserved", "Your book has been reserved. We'll notify you when it's available.") };
      case ("book_ready_for_collection") { ("Book Ready for Collection", "Your book is ready. Please collect it from SVGA Book Bank.") };
      case ("book_due_for_return") { ("Return Reminder", switch (extraInfo) { case (?e) e; case null "Your book is due for return soon." }) };
      case ("book_available_from_waiting_list") { ("Book Available", "A book you reserved is now available for collection.") };
      case ("registration_success") { ("Registration Successful", "Welcome to SVGA Book Bank! Your account is ready.") };
      case ("payment_success") { ("Payment Received", "Your membership payment has been received.") };
      case ("course_completion") { ("Course Completion Notice", switch (extraInfo) { case (?e) e; case null "Your course is completing soon. Please return books or renew." }) };
      case ("renewal_available") { ("Renewal Available", "Your membership is eligible for renewal.") };
      case (_) { ("Notification", switch (extraInfo) { case (?e) e; case null "You have a new notification from SVGA Book Bank." }) };
    };
    ignore NotificationsLib.createNotification(
      notifications,
      notificationCounter,
      studentId,
      #General,
      title,
      notifMsg,
      null,
      now,
    );
    // If no email on file, skip email send but still return ok (in-app notif created)
    if (studentEmail == "") {
      let result : EmailNotifTypes.EmailSendResult = {
        success = false;
        messageId = null;
        error = ?"No email address on file for student";
        sentAt = now;
      };
      return #ok(result);
    };
    // Send the email via platform extension
    let request : EmailNotifTypes.EmailNotificationRequest = {
      toEmail = studentEmail;
      subject;
      body;
      attachmentUrl = challanUrl;
      eventType;
      studentId = ?studentId;
      challanId = null;
    };
    let sendResult = await EmailClient.sendServiceEmail(
      "svga-book-bank",
      [studentEmail],
      subject,
      body,
    );
    let (success, messageId, errorMsg) = switch (sendResult) {
      case (#ok) { (true, null, null) };
      case (#err(e)) { (false, null, ?e) };
    };
    let result : EmailNotifTypes.EmailSendResult = {
      success;
      messageId;
      error = errorMsg;
      sentAt = now;
    };
    ignore EmailLib.logEmail(emailLogs, emailLogCounter, request, result);
    #ok(result);
  };

  // ── Challan API Extensions ────────────────────────────────────────────────

  /// Get all challans in the system (admin only).
  public query func getAllChallans(
    adminToken : Text,
  ) : async [ChallanTypes.Challan] {
    if (not AdminLib.isAdminToken(adminToken)) { return [] };
    challans.values().toArray();
  };

  /// Get a single challan by its ID (student or admin).
  public query func getChallanById(
    token : Text,
    challanId : Common.ChallanId,
  ) : async ?ChallanTypes.Challan {
    let now = Time.now();
    // Allow both student tokens and admin tokens
    let isAdmin = AdminLib.isAdminToken(token);
    let isStudent = UsersLib.verifyToken(token, now) != null;
    if (not isAdmin and not isStudent) { return null };
    challans.get(challanId);
  };

  /// Get all challans for the authenticated student.
  public query func getMyChallansList(
    token : Text,
  ) : async [ChallanTypes.Challan] {
    let now = Time.now();
    let studentId = switch (UsersLib.verifyToken(token, now)) {
      case null { return [] };
      case (?uid) { uid };
    };
    challans.values()
      .filter(func(c) { c.studentId == studentId })
      .toArray();
  };

  // ── Notification API Extensions ───────────────────────────────────────────

  /// Create a notification for a student by their student ID (admin or system use).
  /// Returns the created notification.
  public shared func createStudentNotification(
    adminToken : Text,
    studentId : Common.UserId,
    eventType : EmailNotifTypes.NotificationEventType,
    title : Text,
    message : Text,
    actionUrl : ?Text,
  ) : async Types.Result<NotifTypes.Notification, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    let notif = NotificationsLib.createNotification(
      notifications,
      notificationCounter,
      studentId,
      #General,
      title,
      message,
      actionUrl,
      now,
    );
    #ok(notif);
  };
};

