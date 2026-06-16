import Common "common";
import BookDecisionTypes "book-decision";

/// A Collection Order is generated once the admin has finished per-book decisions
/// and set the mandatory collection date + time. The student uses this to collect books.
module {
  public type CollectionOrderStatus = {
    #Pending;
    #Completed;
    #Collected;
    #Cancelled;
  };

  public type CollectionOrder = {
    /// Unique order number e.g. "CO-00042".
    orderNumber : Text;
    /// Internal id for canister storage.
    orderId : Text;
    requestId : Common.RequestId;
    challanId : ?Common.ChallanId;
    studentId : Common.UserId;
    studentName : Text;
    studentEmail : Text;
    studentPhone : Text;
    studentCourse : Text;
    studentYear : Text;
    adminName : Text;
    /// Timestamp when this order was generated (nanoseconds).
    generatedAt : Common.Timestamp;
    /// Mandatory collection date set by admin (ISO 8601, e.g. "2026-07-15").
    collectionDate : Text;
    /// Mandatory collection time set by admin (e.g. "11:00 AM").
    collectionTime : Text;
    /// Office / location where student must collect books.
    collectionLocation : Text;
    /// Per-book decisions for every inventory book in the request.
    bookDecisions : [BookDecisionTypes.BookDecision];
    /// Books manually typed by the student that are not in inventory.
    specialRequests : [BookDecisionTypes.SpecialRequest];
    /// Grouped book entries for quick frontend rendering (derived from bookDecisions).
    approvedBooks : [BookDecisionTypes.BookDecision];
    rejectedBooks : [BookDecisionTypes.BookDecision];
    reservedBooks : [BookDecisionTypes.BookDecision];
    orderedBooks : [BookDecisionTypes.BookDecision];
    arrivedBooks : [BookDecisionTypes.BookDecision];
    readyForCollectionBooks : [BookDecisionTypes.BookDecision];
    issuedBooks : [BookDecisionTypes.BookDecision];
    returnedBooks : [BookDecisionTypes.BookDecision];
    /// Overall status of the order.
    status : {
      #Pending;     // admin has not yet completed approval
      #Completed;   // admin set collection date and all decisions made
      #Collected;   // student confirmed collection
      #Cancelled;
    };
  };
};
