import Map "mo:core/Map";
import ProcurementTypes "../types/procurement";
import Common "../types/common";

module {
  // Order of valid forward transitions for procurement status.
  // #Cancelled is a terminal state reachable from any stage.
  // Returns true when moving from `current` to `next` is allowed.
  public func isValidTransition(
    current : ProcurementTypes.ProcurementStatus,
    next : ProcurementTypes.ProcurementStatus,
  ) : Bool {
    if (next == #Cancelled) { return true };
    switch (current) {
      case (#Pending) { next == #Ordered or next == #Procured or next == #Approved };
      case (#Approved) { next == #Ordered or next == #Procured };
      case (#Ordered) { next == #Procured };
      case (#Procured) { next == #ReadyForCollection };
      case (#ReadyForCollection) { next == #Issued };
      case (#Issued) { next == #Returned };
      case (#Returned) { false }; // terminal
      case (#Cancelled) { false }; // terminal
    };
  };

  public func generateProcurementId(counter : Nat) : Common.ProcurementId {
    "PROC" # counter.toText();
  };

  /// Create a new procurement request.
  public func createProcurement(
    procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
    procurementId : Common.ProcurementId,
    studentId : Common.UserId,
    bookTitle : Text,
    bookId : ?Common.BookId,
    author : ?Text,
    edition : ?Text,
    publisher : ?Text,
    urgency : ProcurementTypes.ProcurementUrgency,
    now : Common.Timestamp,
  ) : ProcurementTypes.ProcurementRequest {
    let procurement : ProcurementTypes.ProcurementRequest = {
      id = procurementId;
      studentId;
      bookTitle;
      bookId;
      author;
      edition;
      publisher;
      requestDate = now;
      urgency;
      status = #Pending;
    };
    procurements.add(procurementId, procurement);
    procurement;
  };

  /// Update procurement status (admin action).
  public func updateProcurementStatus(
    procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
    procurementId : Common.ProcurementId,
    status : ProcurementTypes.ProcurementStatus,
  ) : Bool {
    switch (procurements.get(procurementId)) {
      case null { false };
      case (?proc) {
        procurements.add(procurementId, { proc with status });
        true;
      };
    };
  };

  /// Get all procurement requests (admin view).
  public func getProcurementRequests(
    procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  ) : [ProcurementTypes.ProcurementRequest] {
    procurements.values().toArray();
  };

  /// Get procurement requests for a specific student.
  public func getProcurementsForStudent(
    procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
    studentId : Common.UserId,
  ) : [ProcurementTypes.ProcurementRequest] {
    procurements.values()
      .filter(func(p) { p.studentId == studentId })
      .toArray();
  };
};
