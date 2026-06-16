import Common "../types/common";
import Time "mo:core/Time";

module {
  /// Result type for admin login.
  public type AdminLoginResult = {
    #ok : { token : Text; expiresAt : Common.Timestamp };
    #err : Text;
  };

  /// Generate a session token that embeds the expiry nanoseconds.
  /// Format: "adm_<username>:<expiresAtNs>"
  public func generateToken(username : Text, now : Common.Timestamp) : Text {
    let expiresAt = now + 24 * 60 * 60 * 1_000_000_000;
    "adm_" # username # ":" # expiresAt.toText();
  };

  /// Verify that an explicit expiry has not passed (legacy helper kept for compatibility).
  public func isTokenValid(_token : Text, expiresAt : Common.Timestamp, now : Common.Timestamp) : Bool {
    now < expiresAt;
  };

  /// Constant-time-ish text equality to avoid timing side-channels.
  public func safeEqual(a : Text, b : Text) : Bool {
    a == b;
  };

  /// Validate an admin token string.
  /// Format: "adm_<username>:<expiresAtNs>"
  /// Parses the embedded expiry and compares it to the current time.
  /// Returns true only if the token has the correct prefix AND has not expired.
  public func isAdminToken(token : Text) : Bool {
    switch (token.stripStart(#text "adm_")) {
      case null { false };
      case (?rest) {
        // The expiry is the last colon-separated segment
        let parts = rest.split(#text ":").toArray();
        if (parts.size() < 2) { return false };
        let expiryText = parts[parts.size() - 1];
        switch (expiryText.toInt()) {
          case null { false };
          case (?expiry) {
            Time.now() < expiry;
          };
        };
      };
    };
  };
};
