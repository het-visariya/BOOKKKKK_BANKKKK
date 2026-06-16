import Common "common";

module {
  public type ReservationStatus = { #Waiting; #Fulfilled; #Cancelled };

  /// A student's reservation (waiting queue entry) for a book.
  public type Reservation = {
    id : Common.ReservationId;
    studentId : Common.UserId;
    bookId : Common.BookId;
    requestDate : Common.Timestamp;
    /// Estimated date the book will become available.
    expectedAvailabilityDate : ?Common.Timestamp;
    status : ReservationStatus;
  };
};
