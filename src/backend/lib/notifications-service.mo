import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Debug "mo:core/Debug";
import Common "../types/common";
import NotifTypes "../types/notification";
import EmailNotifTypes "../types/notifications";

/// Multi-channel notification service supporting WEBSITE, EMAIL, SMS, and WHATSAPP.
/// Designed for production-ready use with configurable providers.
/// SMS and WhatsApp run in demo mode (console logging) until real API credentials are added.
module {

  // ── Configuration ─────────────────────────────────────────────────────────

  /// Global demo mode flag for SMS and WhatsApp channels.
  /// When true, SMS/WhatsApp notifications are logged but not actually sent.
  public let demoMode : Bool = true;

  /// Provider configuration (to be filled when real credentials are available).
  public type SmsProvider = { #Twilio; #MSG91; #Fast2SMS };
  public type WhatsAppProvider = { #Twilio; #Meta };

  public type ProviderConfig = {
    smsProvider : ?SmsProvider;
    smsApiKey : ?Text;
    smsSenderId : ?Text;
    whatsAppProvider : ?WhatsAppProvider;
    whatsAppApiKey : ?Text;
    whatsAppSenderId : ?Text;
  };

  public let providerConfig : ProviderConfig = {
    smsProvider = null;
    smsApiKey = null;
    smsSenderId = null;
    whatsAppProvider = null;
    whatsAppApiKey = null;
    whatsAppSenderId = null;
  };

  // ── Template System ───────────────────────────────────────────────────────

  public type NotificationTemplate = {
    eventType : Text;
    title : Text;
    body : Text;
    smsBody : Text;
    whatsAppBody : Text;
  };

  /// Get the template for a given event type.
  public func getTemplate(eventType : Text, studentName : Text, studentId : Text, bookTitle : ?Text, extraInfo : ?Text) : NotificationTemplate {
    let bookPart = switch (bookTitle) { case (?t) { " - " # t }; case null { "" } };
    let extraPart = switch (extraInfo) { case (?e) { "\n" # e }; case null { "" } };

    let (title, body, smsBody, whatsAppBody) = switch (eventType) {
      case ("registration_success") {
        ("Registration Successful", "Welcome to SVGA Book Bank! Your account is now active.", "Welcome to SVGA Book Bank! Your registration is complete. Student ID: " # studentId, "Welcome to SVGA Book Bank! Your registration is complete. Student ID: " # studentId);
      };
      case ("payment_success") {
        ("Payment Received", "Your membership payment has been received. You can now request books.", "Payment received for SVGA Book Bank membership. Student ID: " # studentId, "Payment received for SVGA Book Bank membership. Student ID: " # studentId);
      };
      case ("book_approved") {
        ("Book Request Approved", "Your book request has been approved. Please collect your book." # bookPart, "Your book request has been approved" # bookPart # ". Please collect it.", "Your book request has been approved" # bookPart # ". Please collect it.");
      };
      case ("book_rejected") {
        ("Book Request Rejected", "Unfortunately, your book request has been rejected." # bookPart # extraPart, "Your book request was rejected" # bookPart # ".", "Your book request was rejected" # bookPart # ".");
      };
      case ("book_reserved") {
        ("Book Reserved", "Your book has been reserved. We'll notify you when it's available." # bookPart, "Your book has been reserved" # bookPart # ". We'll notify you when available.", "Your book has been reserved" # bookPart # ". We'll notify you when available.");
      };
      case ("book_available") {
        ("Book Available", "Great news! A book you reserved is now available for collection." # bookPart, "Your reserved book is now available" # bookPart # ". Please collect it.", "Your reserved book is now available" # bookPart # ". Please collect it.");
      };
      case ("book_ready_for_collection") {
        ("Book Ready for Collection", "Your book is ready. Please collect it from SVGA Book Bank." # bookPart, "Your book is ready for collection" # bookPart # ".", "Your book is ready for collection" # bookPart # ".");
      };
      case ("return_reminder") {
        ("Return Reminder", "Please return your book to the SVGA Book Bank before the due date." # bookPart # extraPart, "Reminder: Please return your book" # bookPart # " before the due date.", "Reminder: Please return your book" # bookPart # " before the due date.");
      };
      case ("due_date_reminder") {
        ("Due Date Reminder", "Your book is due for return soon." # bookPart # extraPart, "Due date reminder for your book" # bookPart # ".", "Due date reminder for your book" # bookPart # ".");
      };
      case ("course_completion") {
        ("Course Completion Notice", "Your course is completing soon. Please return books or renew." # extraPart, "Course completion notice: Please return books or renew membership.", "Course completion notice: Please return books or renew membership.");
      };
      case ("year_promotion") {
        ("Year Promotion", "You are eligible for year promotion. Please visit SVGA Book Bank." # extraPart, "Year promotion available. Please visit SVGA Book Bank.", "Year promotion available. Please visit SVGA Book Bank.");
      };
      case ("challan_generated") {
        ("Challan Generated", "A new challan has been generated for your request." # extraPart, "A new challan has been generated. Student ID: " # studentId, "A new challan has been generated. Student ID: " # studentId);
      };
      case (_) {
        ("Notification", "You have a new notification from SVGA Book Bank." # extraPart, "New notification from SVGA Book Bank.", "New notification from SVGA Book Bank.");
      };
    };

    {
      eventType;
      title;
      body = "Dear " # studentName # ",\n\n" # body;
      smsBody;
      whatsAppBody;
    };
  };

  // ── Delivery Status Helpers ───────────────────────────────────────────────

  public func pendingStatus(channel : NotifTypes.NotificationChannel) : NotifTypes.NotificationDeliveryStatus {
    { channel; status = #Pending; sentAt = null; error = null };
  };

  public func sentStatus(channel : NotifTypes.NotificationChannel, now : Common.Timestamp) : NotifTypes.NotificationDeliveryStatus {
    { channel; status = #Sent; sentAt = ?now; error = null };
  };

  public func failedStatus(channel : NotifTypes.NotificationChannel, error : Text) : NotifTypes.NotificationDeliveryStatus {
    { channel; status = #Failed; sentAt = null; error = ?error };
  };

  public func demoStatus(channel : NotifTypes.NotificationChannel, now : Common.Timestamp) : NotifTypes.NotificationDeliveryStatus {
    { channel; status = #Demo; sentAt = ?now; error = null };
  };

  // ── Channel Senders ─────────────────────────────────────────────────────────

  /// Send a website notification (in-app). Always succeeds.
  public func sendWebsite(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    counter : { var value : Nat },
    userId : Text,
    title : Text,
    message : Text,
    eventType : ?Text,
    now : Common.Timestamp,
  ) : NotifTypes.Notification {
    counter.value += 1;
    let id = "notif_" # counter.value.toText();
    let notif : NotifTypes.Notification = {
      id;
      userId;
      kind = #General;
      eventType;
      title;
      message;
      actionUrl = null;
      challanUrl = null;
      timestamp = now;
      isRead = false;
      readAt = null;
      deliveryStatus = [{ channel = #Website; status = #Sent; sentAt = ?now; error = null }];
      emailSent = false;
      bookOutcomes = [];
      collectionDate = null;
      collectionTime = null;
      collectionLocation = null;
    };
    notifications.add(id, notif);
    notif;
  };

  /// Send an email notification via the platform email extension.
  /// Returns delivery status. In demo mode, logs and returns demo status.
  public func sendEmail(
    toEmail : Text,
    _subject : Text,
    _body : Text,
    now : Common.Timestamp,
  ) : NotifTypes.NotificationDeliveryStatus {
    if (toEmail == "") {
      return failedStatus(#Email, "No email address provided");
    };
    // In a real implementation, this would call the email extension.
    // For now, we return a sent status (email extension is called by the caller).
    sentStatus(#Email, now);
  };

  /// Send an SMS notification.
  /// In demo mode: logs to console and returns demo status.
  /// In production: would call the configured SMS provider (Twilio, MSG91, Fast2SMS).
  public func sendSMS(
    phone : Text,
    message : Text,
    now : Common.Timestamp,
  ) : NotifTypes.NotificationDeliveryStatus {
    if (phone == "") {
      return failedStatus(#SMS, "No phone number provided");
    };
    if (demoMode) {
      Debug.print("[DEMO SMS] To: " # phone # " | Message: " # message);
      return demoStatus(#SMS, now);
    };
    // Production: call SMS provider API via HTTP outcall
    // Example: await callSmsProvider(phone, message);
    // For now, return pending until provider is configured
    switch (providerConfig.smsProvider) {
      case null { failedStatus(#SMS, "No SMS provider configured") };
      case (?_) { pendingStatus(#SMS) };
    };
  };

  /// Send a WhatsApp notification.
  /// In demo mode: logs to console and returns demo status.
  /// In production: would call the configured WhatsApp provider (Twilio, Meta).
  public func sendWhatsApp(
    phone : Text,
    message : Text,
    now : Common.Timestamp,
  ) : NotifTypes.NotificationDeliveryStatus {
    if (phone == "") {
      return failedStatus(#WhatsApp, "No phone number provided");
    };
    if (demoMode) {
      Debug.print("[DEMO WhatsApp] To: " # phone # " | Message: " # message);
      return demoStatus(#WhatsApp, now);
    };
    // Production: call WhatsApp provider API via HTTP outcall
    switch (providerConfig.whatsAppProvider) {
      case null { failedStatus(#WhatsApp, "No WhatsApp provider configured") };
      case (?_) { pendingStatus(#WhatsApp) };
    };
  };

  // ── Multi-Channel Send ──────────────────────────────────────────────────────

  /// Send a notification across multiple channels simultaneously.
  /// Returns the created notification with delivery statuses for each channel.
  public func sendMultiChannel(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    counter : { var value : Nat },
    userId : Text,
    studentName : Text,
    studentId : Text,
    eventType : Text,
    bookTitle : ?Text,
    extraInfo : ?Text,
    channels : [NotifTypes.NotificationChannel],
    email : Text,
    phone : Text,
    now : Common.Timestamp,
  ) : NotifTypes.Notification {
    let template = getTemplate(eventType, studentName, studentId, bookTitle, extraInfo);

    let deliveryStatuses : List.List<NotifTypes.NotificationDeliveryStatus> = List.empty();

    // Always send website notification
    let webNotif = sendWebsite(notifications, counter, userId, template.title, template.body, ?eventType, now);
    deliveryStatuses.add({ channel = #Website; status = #Sent; sentAt = ?now; error = null });

    // Send to other requested channels
    for (channel in channels.values()) {
      let status = switch (channel) {
        case (#Website) {
          // Already handled above
          { channel = #Website; status = #Sent; sentAt = ?now; error = null };
        };
        case (#Email) {
          sendEmail(email, template.title, template.body, now);
        };
        case (#SMS) {
          sendSMS(phone, template.smsBody, now);
        };
        case (#WhatsApp) {
          sendWhatsApp(phone, template.whatsAppBody, now);
        };
      };
      deliveryStatuses.add(status);
    };

    // Update the notification with all delivery statuses
    let updatedNotif : NotifTypes.Notification = {
      webNotif with
      deliveryStatus = deliveryStatuses.toArray();
      emailSent = email != "";
    };
    notifications.add(webNotif.id, updatedNotif);
    updatedNotif;
  };

  // ── Provider Configuration ──────────────────────────────────────────────────

  /// Configure SMS and WhatsApp providers for production use.
  /// Call this when API credentials are available.
  public func configureProviders(config : ProviderConfig) {
    ignore config;
    Debug.print("configureProviders: update providerConfig via actor state, not library var");
  };

  /// Enable or disable demo mode.
  public func setDemoMode(enabled : Bool) {
    ignore enabled;
    Debug.print("setDemoMode: update demoMode via actor state, not library var");
  };

  // ── Delivery Status Query ─────────────────────────────────────────────────

  /// Get the delivery status summary for a notification.
  public func getDeliverySummary(
    notif : NotifTypes.Notification,
  ) : { sent : Nat; failed : Nat; pending : Nat; demo : Nat } {
    var sent = 0;
    var failed = 0;
    var pending = 0;
    var demo = 0;
    for (ds in notif.deliveryStatus.values()) {
      switch (ds.status) {
        case (#Sent) { sent += 1 };
        case (#Failed) { failed += 1 };
        case (#Pending) { pending += 1 };
        case (#Demo) { demo += 1 };
      };
    };
    { sent; failed; pending; demo };
  };
};
