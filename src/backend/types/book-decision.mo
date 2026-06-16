import Common "common";

/// Per-book decision type — tracks each individual book's approve/reject/reserve outcome
/// within a multi-book request. Stored as part of the CollectionOrder and returned
/// by getRequestDetails for the admin request details view.
module {
  /// Unified status for every book in a request — covers inventory books,
  /// manual/special requests, and the full lifecycle from request to return.
  public type BookDecisionStatus = {
    #Pending;              // not yet acted on
    #Approved;             // admin approved; book to be issued
    #Rejected;             // admin rejected
    #Reserved;             // book unavailable; student joined waiting list
    #Ordered;              // procurement / special order placed
    #Purchased;            // procured copy has been purchased (between Ordered and Arrived)
    #Arrived;              // procured copy has arrived at the library
    #ReadyForCollection;   // book is ready for the student to collect
    #Issued;               // book has been issued to the student
    #Returned;             // book has been returned by the student
    #SpecialOrder;          // book not in inventory; procurement approved (legacy alias for #Ordered)
  };

  /// Full per-book decision record embedded in requests, collection orders and challans.
  /// Never exposes internal database IDs to the frontend — always carries human-readable
  /// book names, numbers, and full metadata.
  public type BookDecision = {
    bookId : Common.BookId;     // empty string when book is not in inventory
    bookName : Text;
    bookNumber : Text;          // e.g. "PHY-102"
    author : Text;
    edition : Text;
    publisher : Text;
    subject : Text;
    inventoryId : Text;         // e.g. "INV-102"; empty when not in inventory
    decision : BookDecisionStatus;
    /// Reason supplied by admin on rejection.
    reason : ?Text;
    /// When #Reserved: current holder's display name.
    currentHolder : ?Text;
    /// When #Reserved: current holder's student ID.
    currentHolderStudentId : ?Text;
    /// When #Reserved: expected return date (nanoseconds).
    expectedReturnDate : ?Common.Timestamp;
    /// When #Reserved: student's position in the waiting queue.
    queuePosition : ?Nat;
    /// When #SpecialOrder / procurement: whether a procurement was created.
    procurementCreated : Bool;
    /// When #SpecialOrder / procurement: linked procurement ID.
    procurementId : ?Common.ProcurementId;
  };

  /// A book that the student typed manually and is not found in the inventory.
  /// Uses the same unified status system as inventory books so the UI can render
  /// manual requests with identical cards, badges, and approval flows.
  public type SpecialRequest = {
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    /// Admin decision for the special request — same lifecycle as inventory books.
    status : BookDecisionStatus;
    procurementId : ?Common.ProcurementId;
    /// Reason supplied by admin on rejection.
    reason : ?Text;
    /// Expected availability date when status is #Ordered / #Arrived.
    expectedAvailabilityDate : ?Common.Timestamp;
  };
};
