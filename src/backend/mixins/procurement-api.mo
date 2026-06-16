import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "mo:core/Types";
import ProcurementTypes "../types/procurement";
import NotifTypes "../types/notification";
import UserTypes "../types/user";
import Common "../types/common";
import ProcurementLib "../lib/procurement";
import UsersLib "../lib/users";
import AdminLib "../lib/admin";
import Notifications "../lib/notifications";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  procurementCounter : { var value : Nat },
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
) {
  /// Create a procurement request for a book that needs urgent sourcing.
  /// Sets urgency to #Required when student needs it urgently.
  public shared func createProcurementRequest(
    token : Text,
    bookTitle : Text,
    bookId : ?Common.BookId,
    author : ?Text,
    edition : ?Text,
    publisher : ?Text,
    urgency : ProcurementTypes.ProcurementUrgency,
  ) : async Types.Result<ProcurementTypes.ProcurementRequest, Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    switch (users.get(userId)) {
      case null { return #err("User not found.") };
      case (?u) {
        switch (u.sessionToken) {
          case null { return #err("No active session.") };
          case (?t) { if (t != token) { return #err("Session mismatch.") } };
        };
      };
    };
    if (bookTitle == "") {
      return #err("Book title is required.");
    };
    procurementCounter.value += 1;
    let procurementId = ProcurementLib.generateProcurementId(procurementCounter.value);
    let procurement = ProcurementLib.createProcurement(
      procurements, procurementId, userId, bookTitle,
      bookId, author, edition, publisher, urgency, now,
    );
    #ok(procurement);
  };

  /// Update procurement status. Admin only.
  /// Validates forward-only status transitions and notifies the requesting student.
  public shared func updateProcurementStatus(
    adminToken : Text,
    procurementId : Common.ProcurementId,
    status : ProcurementTypes.ProcurementStatus,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let existing = switch (procurements.get(procurementId)) {
      case null { return #err("Procurement not found: " # procurementId) };
      case (?p) { p };
    };
    // Validate transition order
    if (not ProcurementLib.isValidTransition(existing.status, status)) {
      return #err("Invalid status transition for procurement " # procurementId);
    };
    if (not ProcurementLib.updateProcurementStatus(procurements, procurementId, status)) {
      return #err("Failed to update procurement: " # procurementId);
    };
    // Build a human-readable status label for the notification
    let statusLabel = switch (status) {
      case (#Pending) { "Pending" };
      case (#Approved) { "Approved" };
      case (#Ordered) { "Ordered" };
      case (#Procured) { "Procured" };
      case (#ReadyForCollection) { "Ready for Collection" };
      case (#Issued) { "Issued" };
      case (#Returned) { "Returned" };
      case (#Cancelled) { "Cancelled" };
    };
    let msg = "Your procurement request for " # existing.bookTitle # " is now " # statusLabel;
    let now = Time.now();
    // Notify the student
    let _ = Notifications.createNotification(
      notifications, notificationCounter,
      existing.studentId, #ProcurementNeeded,
      "Procurement Update", msg, null, now,
    );
    #ok(());
  };

  /// Get all procurement requests. Admin only.
  public query func getAllProcurements(
    adminToken : Text,
  ) : async [ProcurementTypes.ProcurementRequest] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    ProcurementLib.getProcurementRequests(procurements);
  };

  /// Get procurement requests for the authenticated student.
  public query func getMyProcurements(
    token : Text,
  ) : async [ProcurementTypes.ProcurementRequest] {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { [] };
      case (?userId) {
        ProcurementLib.getProcurementsForStudent(procurements, userId);
      };
    };
  };
};
