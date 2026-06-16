import Common "common";

module {
  /// A book transfer record when a returned book is reassigned to the next
  /// waiting student by an admin.
  public type Transfer = {
    id : Common.TransferId;
    fromStudentId : Common.UserId;
    toStudentId : Common.UserId;
    bookId : Common.BookId;
    transferDate : Common.Timestamp;
    adminNotes : ?Text;
    challanId : ?Common.ChallanId;
  };
};
