import Common "common";

module {
  public type Payment = {
    paymentId : Common.PaymentId;
    userId : Common.UserId;
    stripePaymentId : Text;
    amount : Nat;
    status : Text;
    createdAt : Common.Timestamp;
  };
};
