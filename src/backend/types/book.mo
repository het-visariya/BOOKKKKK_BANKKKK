import Common "common";

module {
  public type Book = {
    bookId : Common.BookId;
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    category : Text;
    /// Total physical copies owned by the library.
    totalQuantity : Nat;
    /// Copies currently available for issue.
    availableQuantity : Nat;
    /// Legacy fields kept for backwards compatibility.
    quantity : Nat;
    availableCount : Nat;
    /// Student IDs of students currently holding a copy.
    currentHolders : [Common.UserId];
    /// Ordered list of student IDs waiting for this book.
    waitingQueue : [Common.UserId];
    isAvailable : Bool;
    isDeleted : Bool;
    createdAt : Common.Timestamp;
  };

  public type BookInput = {
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    category : Text;
    quantity : Nat;
  };
};
