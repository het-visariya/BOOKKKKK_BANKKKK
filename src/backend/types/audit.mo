import Common "common";
import BookDecisionTypes "../types/book-decision";

module {
  public type ActorType = { #Student; #Admin };

  /// All actions that are logged in the audit trail.
  public type AuditAction = {
    #StudentRegistration;
    #ProfileUpdate;
    #BookRequest;
    #BookApproval;
    #BookRejection;
    #BookIssue;
    #BookReturn;
    #ReservationCreation;
    #AdminChange;
    // Workflow Step 14 extensions
    #RequestOpened;
    #BookReserved;
    #CollectionDateAssigned;
    #CollectionOrderGenerated;
    #ChallanGenerated;
    #RequestFinalized;
    #NotificationSent;
    #BookCollected;
  };

  /// Per-book decision recorded in an audit entry so the log shows full book names
  /// instead of internal IDs.
  public type AuditBookDecision = {
    bookName : Text;
    bookNumber : Text;
    author : Text;
    status : BookDecisionTypes.BookDecisionStatus;
    reason : ?Text;
  };

  public type AuditEntry = {
    id : Text;
    actorId : Text; // userId or "admin"
    actorType : ActorType;
    action : AuditAction;
    resourceId : Text; // bookId, requestId, or userId
    timestamp : Common.Timestamp;
    details : ?Text;
    /// Full student name for display in audit logs.
    studentName : ?Text;
    /// Full admin name for display in audit logs.
    adminName : ?Text;
    /// Per-book decisions recorded with this action (e.g. approval of multiple books).
    bookDecisions : [AuditBookDecision];
    /// Human-readable request number.
    requestNumber : ?Text;
    /// Name of the actor (student or admin) who performed the action.
    actorName : ?Text;
    /// Type of resource affected (e.g. "book", "request", "student").
    resourceType : ?Text;
    /// IP address of the client (if available).
    ipAddress : ?Text;
    /// User agent string of the client (if available).
    userAgent : ?Text;
  };
};
