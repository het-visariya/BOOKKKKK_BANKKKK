import Map "mo:core/Map";
import AuditTypes "../types/audit";
import Common "../types/common";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  public func generateAuditId(counter : Nat) : Text {
    "AUD" # counter.toText();
  };

  /// Create and store an audit log entry.
  public func logAudit(
    auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
    auditCounter : { var value : Nat },
    actorId : Text,
    actorType : AuditTypes.ActorType,
    action : AuditTypes.AuditAction,
    resourceId : Text,
    details : ?Text,
  ) {
    logAuditFull(auditLog, auditCounter, actorId, actorType, action, resourceId, details, null, null, [], null);
  };

  /// Create and store an audit log entry with full context (book decisions, names, request number).
  public func logAuditFull(
    auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
    auditCounter : { var value : Nat },
    actorId : Text,
    actorType : AuditTypes.ActorType,
    action : AuditTypes.AuditAction,
    resourceId : Text,
    details : ?Text,
    studentName : ?Text,
    adminName : ?Text,
    bookDecisions : [AuditTypes.AuditBookDecision],
    requestNumber : ?Text,
  ) {
    auditCounter.value += 1;
    let id = generateAuditId(auditCounter.value);
    let entry : AuditTypes.AuditEntry = {
      id;
      actorId;
      actorType;
      action;
      resourceId;
      timestamp = Time.now();
      details;
      studentName;
      adminName;
      bookDecisions;
      requestNumber;
      actorName = null;
      resourceType = null;
      ipAddress = null;
      userAgent = null;
    };
    auditLog.add(id, entry);
  };

  /// Get audit log entries with optional filtering.
  public func getAuditLog(
    auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
    actorIdFilter : ?Text,
    actionFilter : ?AuditTypes.AuditAction,
    startTime : ?Common.Timestamp,
    endTime : ?Common.Timestamp,
  ) : [AuditTypes.AuditEntry] {
    let filtered = auditLog.values()
      .filter(func(entry) {
        let matchesActor = switch (actorIdFilter) {
          case (?aid) { entry.actorId == aid };
          case null { true };
        };
        let matchesAction = switch (actionFilter) {
          case (?act) { entry.action == act };
          case null { true };
        };
        let matchesStart = switch (startTime) {
          case (?st) { entry.timestamp >= st };
          case null { true };
        };
        let matchesEnd = switch (endTime) {
          case (?et) { entry.timestamp <= et };
          case null { true };
        };
        matchesActor and matchesAction and matchesStart and matchesEnd;
      })
      .toArray();
    // Sort newest first
    filtered.sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
  };
};
