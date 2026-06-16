import Map "mo:core/Map";
import ReservationTypes "../types/reservation";
import BookTypes "../types/book";
import Common "../types/common";
import Int "mo:core/Int";

module {
  public func generateReservationId(counter : Nat) : Common.ReservationId {
    "RES" # counter.toText();
  };

  /// Create a new reservation and add the student to the book's waitingQueue.
  public func createReservation(
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    books : Map.Map<Common.BookId, BookTypes.Book>,
    reservationId : Common.ReservationId,
    studentId : Common.UserId,
    bookId : Common.BookId,
    expectedAvailabilityDate : ?Common.Timestamp,
    now : Common.Timestamp,
  ) : ReservationTypes.Reservation {
    let reservation : ReservationTypes.Reservation = {
      id = reservationId;
      studentId;
      bookId;
      requestDate = now;
      expectedAvailabilityDate;
      status = #Waiting;
    };
    reservations.add(reservationId, reservation);
    // Append student to book's waitingQueue
    switch (books.get(bookId)) {
      case (?book) {
        let newQueue = book.waitingQueue.concat([studentId]);
        books.add(bookId, { book with waitingQueue = newQueue });
      };
      case null {};
    };
    reservation;
  };

  /// Mark a reservation as fulfilled and remove from book's waitingQueue.
  public func fulfillReservation(
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    books : Map.Map<Common.BookId, BookTypes.Book>,
    reservationId : Common.ReservationId,
  ) : Bool {
    switch (reservations.get(reservationId)) {
      case null { false };
      case (?res) {
        let updated = { res with status = #Fulfilled };
        reservations.add(reservationId, updated);
        // Remove student from book's waitingQueue
        switch (books.get(res.bookId)) {
          case (?book) {
            let newQueue = book.waitingQueue.filter(func(uid) { uid != res.studentId });
            books.add(res.bookId, { book with waitingQueue = newQueue });
          };
          case null {};
        };
        true;
      };
    };
  };

  /// Cancel a reservation and remove from book's waitingQueue.
  public func cancelReservation(
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    books : Map.Map<Common.BookId, BookTypes.Book>,
    reservationId : Common.ReservationId,
  ) : Bool {
    switch (reservations.get(reservationId)) {
      case null { false };
      case (?res) {
        let updated = { res with status = #Cancelled };
        reservations.add(reservationId, updated);
        // Remove student from book's waitingQueue
        switch (books.get(res.bookId)) {
          case (?book) {
            let newQueue = book.waitingQueue.filter(func(uid) { uid != res.studentId });
            books.add(res.bookId, { book with waitingQueue = newQueue });
          };
          case null {};
        };
        true;
      };
    };
  };

  /// Get all waiting reservations for a specific book (ordered by requestDate).
  public func getReservationsForBook(
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    bookId : Common.BookId,
  ) : [ReservationTypes.Reservation] {
    let result = reservations.values()
      .filter(func(r) { r.bookId == bookId and r.status == #Waiting })
      .toArray();
    result.sort(func(a, b) { Int.compare(a.requestDate, b.requestDate) });
  };

  /// Get all reservations for a specific student.
  public func getReservationsForStudent(
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    studentId : Common.UserId,
  ) : [ReservationTypes.Reservation] {
    reservations.values()
      .filter(func(r) { r.studentId == studentId })
      .toArray();
  };

  /// Check if a student already has a waiting reservation for this book.
  public func hasWaitingReservation(
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    studentId : Common.UserId,
    bookId : Common.BookId,
  ) : Bool {
    switch (reservations.values().find(func(r) {
      r.studentId == studentId and r.bookId == bookId and r.status == #Waiting
    })) {
      case null { false };
      case _ { true };
    };
  };
};
