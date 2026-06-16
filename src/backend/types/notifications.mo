import Debug "mo:core/Debug";
import Common "common";

module {
  /// Notification event type as a plain text discriminator (for external/email use).
  /// Maps to the NotificationKind variant in notification.mo.
  public type NotificationEventType = Text;

  /// A request to send an email notification.
  public type EmailNotificationRequest = {
    toEmail : Text;
    subject : Text;
    body : Text;
    /// Optional URL to a challan PDF attachment.
    attachmentUrl : ?Text;
    /// The lifecycle event that triggered this email.
    eventType : NotificationEventType;
    studentId : ?Common.UserId;
    challanId : ?Common.ChallanId;
  };

  /// Result of attempting to send an email notification.
  public type EmailSendResult = {
    success : Bool;
    messageId : ?Text;
    error : ?Text;
    sentAt : Common.Timestamp;
  };

  /// Record of a sent (or attempted) email notification.
  public type EmailNotificationLog = {
    id : Text;
    request : EmailNotificationRequest;
    result : EmailSendResult;
    deliveryStatus : Text; // "pending" | "sent" | "failed" | "demo"
    retryCount : Nat;
    lastError : ?Text;
  };
};
