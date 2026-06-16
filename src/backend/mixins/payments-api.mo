import Map "mo:core/Map";
import Time "mo:core/Time";
import PaymentTypes "../types/payment";
import UserTypes "../types/user";
import Common "../types/common";
import Types "mo:core/Types";
import PaymentsLib "../lib/payments";
import UsersLib "../lib/users";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  payments : Map.Map<Common.PaymentId, PaymentTypes.Payment>,
  paymentCounter : { var value : Nat },
) {
  /// Record a completed payment for the ₹200 membership fee.
  /// jwtToken: the student's JWT session token.
  public shared func recordPayment(
    jwtToken : Text,
    stripePaymentId : Text,
    amount : Nat,
  ) : async Types.Result<PaymentTypes.Payment, Text> {
    let user = switch (UsersLib.findByToken(users, jwtToken)) { //sessionToken lookup
      case (?u) { u };
      case null { return #err("User not registered or session expired. Please log in again.") };
    };
    // If already paid, just return success (idempotent)
    if (user.membershipStatus == #PAID) {
      switch (PaymentsLib.findByUser(payments, user.studentId)) {
        case (?existing) { return #ok(existing) };
        case null {}; // edge case: paid flag set but no payment record — continue to create one
      };
    };
    paymentCounter.value += 1;
    let paymentId = PaymentsLib.generatePaymentId(paymentCounter.value);
    let now = Time.now();
    let payment = PaymentsLib.create(paymentId, user.studentId, stripePaymentId, amount, now);
    payments.add(paymentId, payment);
    // Update user payment status to PAID
    let updatedUser = UsersLib.withPayment(user, paymentId, stripePaymentId, now);
    users.add(user.studentId, updatedUser);
    #ok(payment);
  };

  /// Get the student's current payment/membership status by JWT token.
  public query func getPaymentStatus(jwtToken : Text) : async Types.Result<PaymentTypes.Payment, Text> {
    let user = switch (UsersLib.findByToken(users, jwtToken)) { //sessionToken lookup
      case (?u) { u };
      case null { return #err("User not registered or session expired") };
    };
    switch (PaymentsLib.findByUser(payments, user.studentId)) {
      case (?payment) { #ok(payment) };
      case null { #err("No payment found for user") };
    };
  };
};
