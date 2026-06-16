import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "mo:core/Types";
import NotifTypes "../types/notification";
import Common "../types/common";
import NotificationsLib "../lib/notifications";
import UsersLib "../lib/users";
import AdminLib "../lib/admin";
import UserTypes "../types/user";
import NotifService "../lib/notifications-service";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
) {
  /// Get the last 20 notifications for the authenticated student.
  public query func getMyNotifications(
    token : Text,
  ) : async [NotifTypes.Notification] {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { [] };
      case (?userId) {
        NotificationsLib.getNotifications(notifications, userId, 20);
      };
    };
  };

  /// Get the last 50 notifications visible to an admin (admin-targeted ones).
  public query func getAdminNotifications(
    adminToken : Text,
  ) : async [NotifTypes.Notification] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    NotificationsLib.getNotifications(notifications, "admin", 50);
  };

  /// Get unread notification count for the authenticated student.
  public query func getUnreadCount(
    token : Text,
  ) : async Nat {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { 0 };
      case (?userId) {
        NotificationsLib.getUnreadCount(notifications, userId);
      };
    };
  };

  /// Mark a single notification as read.
  public shared func markNotificationRead(
    token : Text,
    notifId : NotifTypes.NotificationId,
  ) : async Types.Result<(), Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    if (NotificationsLib.markAsRead(notifications, userId, notifId)) {
      #ok(());
    } else {
      #err("Notification not found or does not belong to you.");
    };
  };

  /// Mark all notifications as read for the authenticated user.
  public shared func markAllNotificationsRead(
    token : Text,
  ) : async Types.Result<(), Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    NotificationsLib.markAllRead(notifications, userId);
    #ok(());
  };

  /// Create a manual admin-targeted notification (admin only).
  /// Useful for broadcasting alerts to all students or sending a targeted message.
  public shared func createAdminNotification(
    adminToken : Text,
    targetUserId : Text,
    title : Text,
    message : Text,
    actionUrl : ?Text,
  ) : async Types.Result<NotifTypes.Notification, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    let notif = NotificationsLib.createNotification(
      notifications, notificationCounter,
      targetUserId, #General,
      title, message, actionUrl, now,
    );
    #ok(notif);
  };

  // ── Multi-Channel Notification Endpoints ────────────────────────────────────

  /// Send a multi-channel notification to a student (admin or system use).
  /// Supports WEBSITE, EMAIL, SMS, and WHATSAPP channels.
  /// SMS and WhatsApp run in demo mode until real API credentials are configured.
  public shared func sendMultiChannelNotification(
    adminToken : Text,
    studentId : Common.UserId,
    eventType : Text,
    bookTitle : ?Text,
    extraInfo : ?Text,
    channels : [NotifTypes.NotificationChannel],
  ) : async Types.Result<NotifTypes.Notification, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    // Look up the student
    let student = switch (UsersLib.findById(users, studentId)) {
      case null { return #err("Student not found: " # studentId) };
      case (?u) { u };
    };
    let studentName = UsersLib.getFullName(student);
    let notif = NotifService.sendMultiChannel(
      notifications,
      notificationCounter,
      studentId,
      studentName,
      studentId,
      eventType,
      bookTitle,
      extraInfo,
      channels,
      student.email,
      student.phone,
      now,
    );
    #ok(notif);
  };

  /// Get the delivery status summary for a notification.
  public query func getNotificationDeliveryStatus(
    token : Text,
    notifId : NotifTypes.NotificationId,
  ) : async Types.Result<{ sent : Nat; failed : Nat; pending : Nat; demo : Nat }, Text> {
    let now = Time.now();
    // Verify student token
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    switch (notifications.get(notifId)) {
      case null { return #err("Notification not found.") };
      case (?notif) {
        if (notif.userId != userId) {
          return #err("Notification does not belong to you.")
        };
        #ok(NotifService.getDeliverySummary(notif));
      };
    };
  };

  /// Configure SMS and WhatsApp providers for production use (admin only).
  /// When configured, demo mode is disabled and real notifications are sent.
  public shared func configureNotificationProviders(
    adminToken : Text,
    config : NotifService.ProviderConfig,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    NotifService.configureProviders(config);
    #ok(());
  };

  /// Get current notification service configuration (admin only).
  public query func getNotificationConfig(
    adminToken : Text,
  ) : async Types.Result<{ demoMode : Bool; smsConfigured : Bool; whatsAppConfigured : Bool }, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    #ok({
      demoMode = NotifService.demoMode;
      smsConfigured = NotifService.providerConfig.smsProvider != null;
      whatsAppConfigured = NotifService.providerConfig.whatsAppProvider != null;
    });
  };
};
