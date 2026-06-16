import Common "common";
import BookDecisionTypes "../types/book-decision";

module {
  public type NotificationId = Text;

  public type NotificationKind = {
    #General;
    #BookApproved;
    #BookRejected;
    #BookReserved;
    #BookAvailable;
    #ReturnReminder;
    #ReturnAlert;
    #PaymentSuccess;
    #RegistrationSuccess;
    #BookReadyForCollection;
    #DueDateReminder;
    #CourseCompletion;
    #YearPromotion;
    #ChallanGenerated;
    #ProcurementNeeded;
    #BookTransferred;
    #ReservationFulfilled;
    #QueueUpdate;
  };

  public type NotificationChannel = {
    #Website;
    #Email;
    #SMS;
    #WhatsApp;
  };

  public type DeliveryStatus = {
    #Pending;
    #Sent;
    #Failed;
    #Demo;
  };

  public type NotificationDeliveryStatus = {
    channel : NotificationChannel;
    status : DeliveryStatus;
    sentAt : ?Common.Timestamp;
    error : ?Text;
  };

  /// Summary of a single book's outcome inside a notification payload.
  public type NotificationBookOutcome = {
    bookName : Text;
    bookNumber : Text;
    author : Text;
    edition : Text;
    status : BookDecisionTypes.BookDecisionStatus;
    reason : ?Text;
    currentHolder : ?Text;
    expectedReturnDate : ?Common.Timestamp;
    expectedAvailabilityDate : ?Common.Timestamp;
  };

  public type Notification = {
    id : NotificationId;
    /// studentId or admin userId
    userId : Text;
    kind : NotificationKind;
    /// Plain-text event type alias (e.g. "registration_success", "book_approved").
    eventType : ?Text;
    title : Text;
    message : Text;
    actionUrl : ?Text;
    /// Deep link to the challan / collection order related to this notification.
    challanUrl : ?Text;
    timestamp : Common.Timestamp;
    isRead : Bool;
    /// Multi-channel delivery status for this notification.
    deliveryStatus : [NotificationDeliveryStatus];
    /// Whether an email notification was sent for this event.
    emailSent : Bool;
    /// Complete request outcome: every book with its status, so the student sees
    /// approved, rejected, reserved, and manual books in one place.
    bookOutcomes : [NotificationBookOutcome];
    /// Collection details included when the notification is about a finalized request.
    collectionDate : ?Text;
    collectionTime : ?Text;
    collectionLocation : ?Text;
    /// Timestamp when the notification was marked as read.
    readAt : ?Common.Timestamp;
  };
};
