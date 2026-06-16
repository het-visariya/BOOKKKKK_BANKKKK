import Map "mo:core/Map";
import Common "../types/common";
import UserTypes "../types/user";

/// Helper functions for the enhanced email-first registration flow.
module {

  // ── OTP rate limiting constants ───────────────────────────────────────────
  public let OTP_MAX_ATTEMPTS : Nat = 3;
  public let OTP_EXPIRY_MINUTES : Nat = 5;

  /// Validate that the email string looks like a well-formed address.
  public func isValidEmail(email : Text) : Bool {
    // Must contain exactly one '@' and at least one '.' in the domain
    let atParts = email.split(#char '@').toArray();
    if (atParts.size() != 2) { return false };
    let local = atParts[0];
    let domain = atParts[1];
    if (local.size() == 0) { return false };
    let domainParts = domain.split(#char '.').toArray();
    if (domainParts.size() < 2) { return false };
    for (part in domainParts.values()) {
      if (part.size() == 0) { return false };
    };
    true;
  };

  /// Return true if no PAID user account already uses this email.
  public func isEmailUnique(
    users : Map.Map<Common.UserId, UserTypes.User>,
    email : Text,
  ) : Bool {
    let lowerEmail = email.toLower();
    users.values().find(func(u) {
      u.membershipStatus == #PAID and u.email.toLower() == lowerEmail
    }) == null;
  };

  /// Return true if no PAID user account already has this Aadhaar.
  public func isAadhaarUnique(
    users : Map.Map<Common.UserId, UserTypes.User>,
    aadhaarNumber : Text,
  ) : Bool {
    users.values().find(func(u) {
      u.membershipStatus == #PAID and u.aadhaarNumber == aadhaarNumber
    }) == null;
  };

  /// Build a full display name from the four name parts.
  public func buildFullName(
    firstName : Text,
    middleName : Text,
    grandFatherName : Text,
    surname : Text,
  ) : Text {
    let parts = [firstName, middleName, grandFatherName, surname];
    var result = "";
    for (part in parts.values()) {
      if (part != "") {
        if (result != "") { result #= " " };
        result #= part;
      };
    };
    result;
  };
};
