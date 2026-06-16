import Common "common";

module {
  /// An entry in the book collection queue — approved but not yet picked up.
  public type CollectionEntry = {
    entryId : Text;
    studentId : Common.UserId;
    studentName : Text;
    bookId : Common.BookId;
    bookTitle : Text;
    requestId : Common.RequestId;
    approvalDate : Common.Timestamp;
    collectionDeadline : Common.Timestamp;
    collected : Bool;
  };

  /// Course-level return deadline configuration.
  public type CourseReturnConfig = {
    courseName : Text;
    returnMonth : Nat; // 1-12
    returnDay : Nat;   // 1-31
  };

  /// Year-promotion choice by a student.
  public type YearPromotionChoice = { #ReturnBooks; #ContinueNextYear };
};
