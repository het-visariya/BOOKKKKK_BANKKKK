import Map "mo:core/Map";
import Types "mo:core/Types";
import AuditTypes "../types/audit";
import Common "../types/common";
import AdminLib "../lib/admin";
import AuditLib "../lib/audit";

mixin (
  auditLog : Map.Map<Text, AuditTypes.AuditEntry>,
  auditCounter : { var value : Nat },
) {
  /// Get audit log entries. Admin only.
  public query func getAuditLog(
    adminToken : Text,
    actorIdFilter : ?Text,
    actionFilter : ?AuditTypes.AuditAction,
    startTime : ?Common.Timestamp,
    endTime : ?Common.Timestamp,
  ) : async Types.Result<[AuditTypes.AuditEntry], Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    #ok(AuditLib.getAuditLog(auditLog, actorIdFilter, actionFilter, startTime, endTime));
  };
};
