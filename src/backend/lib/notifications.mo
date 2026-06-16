import Map "mo:core/Map";
import NotifTypes "../types/notification";
import Common "../types/common";

module {
  let SEVEN_DAYS_NS : Int = 604_800_000_000_000;

  // ── ID generation ─────────────────────────────────────────────────────────
  public func generateNotificationId(counter : Nat) : NotifTypes.NotificationId {
    "notif_" # counter.toText();
  };

  // ── Lazy cleanup ───────────────────────────────────────────────────────────
  /// Remove notifications older than 7 days for a given user.
  /// Called lazily on every write operation touching that user's notifications.
  public func dismissOld(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    userId : Text,
    now : Common.Timestamp,
  ) {
    let cutoff = now - SEVEN_DAYS_NS;
    let toRemove = notifications.entries()
      .filter(func((_, n)) { n.userId == userId and n.timestamp < cutoff })
      .map(func((k, _)) { k })
      .toArray();
    for (id in toRemove.values()) {
      notifications.remove(id);
    };
  };

  // ── Write ──────────────────────────────────────────────────────────────────
  /// Create a simple notification (backward compatible).
  public func createNotification(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    counter : { var value : Nat },
    userId : Text,
    kind : NotifTypes.NotificationKind,
    title : Text,
    message : Text,
    actionUrl : ?Text,
    now : Common.Timestamp,
  ) : NotifTypes.Notification {
    createNotificationFull(notifications, counter, userId, kind, title, message, actionUrl, null, now, [], null, null, null);
  };

  /// Create a notification with complete request outcome and collection details.
  public func createNotificationFull(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    counter : { var value : Nat },
    userId : Text,
    kind : NotifTypes.NotificationKind,
    title : Text,
    message : Text,
    actionUrl : ?Text,
    challanUrl : ?Text,
    now : Common.Timestamp,
    bookOutcomes : [NotifTypes.NotificationBookOutcome],
    collectionDate : ?Text,
    collectionTime : ?Text,
    collectionLocation : ?Text,
  ) : NotifTypes.Notification {
    dismissOld(notifications, userId, now);
    counter.value += 1;
    let id = generateNotificationId(counter.value);
    let notif : NotifTypes.Notification = {
      id;
      userId;
      kind;
      eventType = null;
      title;
      message;
      actionUrl;
      challanUrl;
      timestamp = now;
      isRead = false;
      deliveryStatus = [];
      emailSent = false;
      bookOutcomes;
      collectionDate;
      collectionTime;
      collectionLocation;
      readAt = null;
    };
    notifications.add(id, notif);
    notif;
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  /// Mark a single notification as read. Returns true if found.
  public func markAsRead(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    userId : Text,
    notifId : NotifTypes.NotificationId,
  ) : Bool {
    switch (notifications.get(notifId)) {
      case null { false };
      case (?n) {
        if (n.userId != userId) { return false };
        notifications.add(notifId, { n with isRead = true });
        true;
      };
    };
  };

  /// Mark all notifications for a user as read.
  public func markAllRead(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    userId : Text,
  ) {
    for ((id, n) in notifications.entries()) {
      if (n.userId == userId and not n.isRead) {
        notifications.add(id, { n with isRead = true });
      };
    };
  };

  // ── Read ───────────────────────────────────────────────────────────────────
  /// Get unread count for a user (lightweight).
  public func getUnreadCount(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    userId : Text,
  ) : Nat {
    var count = 0;
    for ((_, n) in notifications.entries()) {
      if (n.userId == userId and not n.isRead) {
        count += 1;
      };
    };
    count;
  };

  /// Get the most recent `limit` notifications for a user, sorted newest-first.
  public func getNotifications(
    notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
    userId : Text,
    limit : Nat,
  ) : [NotifTypes.Notification] {
    notifications.values()
      .filter(func(n) { n.userId == userId })
      .sort(func(a, b) {
        if (a.timestamp > b.timestamp) { #less }
        else if (a.timestamp < b.timestamp) { #greater }
        else { #equal };
      })
      .take(limit)
      .toArray();
  };
};
