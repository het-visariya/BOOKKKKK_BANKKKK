import Common "common";

module {
  public type ProcurementUrgency = { #Required; #Optional };
  /// Full procurement lifecycle matching the unified book decision status system.
  public type ProcurementStatus = {
    #Pending;              // request created, awaiting admin approval
    #Approved;             // admin approved procurement
    #Ordered;              // order placed with supplier
    #Procured;             // copy has arrived at the library
    #ReadyForCollection;   // book is ready for the student to collect
    #Issued;               // book has been issued to the student
    #Returned;             // book has been returned by the student
    #Cancelled;            // procurement cancelled
  };

  /// Request to procure a new/additional copy of a book for a student.
  public type ProcurementRequest = {
    id : Common.ProcurementId;
    studentId : Common.UserId;
    /// Free-text title when the book is not yet in the catalogue.
    bookTitle : Text;
    /// Set when the request is linked to an existing catalogue entry.
    bookId : ?Common.BookId;
    author : ?Text;
    edition : ?Text;
    publisher : ?Text;
    requestDate : Common.Timestamp;
    urgency : ProcurementUrgency;
    status : ProcurementStatus;
  };
};
