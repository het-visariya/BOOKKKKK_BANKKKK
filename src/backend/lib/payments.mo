import Map "mo:core/Map";
import Types "../types/payment";
import Common "../types/common";

module {
  // Generate a unique payment ID
  public func generatePaymentId(counter : Nat) : Common.PaymentId {
    "PAY" # counter.toText();
  };

  // Create a new payment record
  public func create(
    paymentId : Common.PaymentId,
    userId : Common.UserId,
    stripePaymentId : Text,
    amount : Nat,
    now : Common.Timestamp,
  ) : Types.Payment {
    {
      paymentId;
      userId;
      stripePaymentId;
      amount;
      status = "completed";
      createdAt = now;
    };
  };

  // Find payment by user ID
  public func findByUser(
    payments : Map.Map<Common.PaymentId, Types.Payment>,
    userId : Common.UserId,
  ) : ?Types.Payment {
    payments.values().find(func(p) { p.userId == userId });
  };
};
