import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "mo:core/Types";
import ReservationTypes "../types/reservation";
import BookTypes "../types/book";
import RequestTypes "../types/request";
import NotifTypes "../types/notification";
import UserTypes "../types/user";
import Common "../types/common";
import ReservationsLib "../lib/reservations";
import UsersLib "../lib/users";
import AdminLib "../lib/admin";
import Notifications "../lib/notifications";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  books : Map.Map<Common.BookId, BookTypes.Book>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  reservationCounter : { var value : Nat },
  notifications : Map.Map<NotifTypes.NotificationId, NotifTypes.Notification>,
  notificationCounter : { var value : Nat },
) {
  /// Create a reservation for a book that is not immediately available.
  /// Adds student to the book's waitingQueue.
  /// Computes expectedAvailabilityDate from the current holder's returnDate if available.
  public shared func createReservation(
    token : Text,
    bookId : Common.BookId,
    expectedAvailabilityDate : ?Common.Timestamp,
  ) : async Types.Result<ReservationTypes.Reservation, Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid. Please log in again.") };
      case (?uid) { uid };
    };
    let user = switch (users.get(userId)) {
      case null { return #err("User not found.") };
      case (?u) { u };
    };
    switch (user.sessionToken) {
      case null { return #err("No active session.") };
      case (?t) { if (t != token) { return #err("Session mismatch.") } };
    };
    // Only allow reservation if book is actually not available
    switch (books.get(bookId)) {
      case null { return #err("Book not found: " # bookId) };
      case (?book) {
        if (book.availableCount > 0) {
          return #err("Book is currently available — please request it directly.");
        };
      };
    };
    // Prevent duplicate waiting reservation
    if (ReservationsLib.hasWaitingReservation(reservations, userId, bookId)) {
      return #err("You already have a waiting reservation for this book.");
    };
    // Compute expectedAvailabilityDate: use caller-supplied value, or derive from
    // the earliest active holder's returnDate, or fall back to now + 14 days.
    let defaultOffset : Int = 14 * 24 * 60 * 60 * 1_000_000_000;
    let computedDate : Common.Timestamp = switch (expectedAvailabilityDate) {
      case (?d) { d };
      case null {
        // Find the earliest returnDate among active requests for this book
        let sentinel : Int = 9_999_999_999_999_999_999;
        var earliest : Int = sentinel;
        for (r in requests.values()) {
          if (
            not r.returned and
            (r.status == "Approved" or r.status == "Procured") and
            r.selectedBookIds.find(func(bid) { bid == bookId }) != null
          ) {
            switch (r.returnDate) {
              case (?rd) { if (rd < earliest) { earliest := rd } };
              case null {};
            };
          };
        };
        if (earliest < sentinel) { earliest } else { now + defaultOffset };
      };
    };
    reservationCounter.value += 1;
    let reservationId = ReservationsLib.generateReservationId(reservationCounter.value);
    let reservation = ReservationsLib.createReservation(
      reservations, books, reservationId, userId, bookId, ?computedDate, now,
    );
    // Notify the student
    let dateText = computedDate.toText();
    let _ = Notifications.createNotification(
      notifications, notificationCounter,
      userId, #QueueUpdate,
      "Reservation Confirmed",
      "Reservation confirmed. Book expected around " # dateText,
      null, now,
    );
    // Notify admin
    let bookTitle = switch (books.get(bookId)) { case (?b) { b.title }; case null { bookId } };
    let _ = Notifications.createNotification(
      notifications, notificationCounter,
      "admin", #QueueUpdate,
      "New Reservation",
      user.name # " reserved " # bookTitle # " (expected " # dateText # ")",
      null, now,
    );
    #ok(reservation);
  };

  /// Cancel a reservation. Must be the reservation owner.
  public shared func cancelReservation(
    token : Text,
    reservationId : Common.ReservationId,
  ) : async Types.Result<(), Text> {
    let now = Time.now();
    let userId = switch (UsersLib.verifyToken(token, now)) {
      case null { return #err("Session expired or invalid.") };
      case (?uid) { uid };
    };
    switch (reservations.get(reservationId)) {
      case null { return #err("Reservation not found.") };
      case (?res) {
        if (res.studentId != userId) {
          return #err("Unauthorized: not your reservation.");
        };
        let _ = ReservationsLib.cancelReservation(reservations, books, reservationId);
        #ok(());
      };
    };
  };

  /// Get all reservations for the authenticated student.
  public query func getMyReservations(
    token : Text,
  ) : async [ReservationTypes.Reservation] {
    let now = Time.now();
    switch (UsersLib.verifyToken(token, now)) {
      case null { [] };
      case (?userId) {
        ReservationsLib.getReservationsForStudent(reservations, userId);
      };
    };
  };

  /// Get all waiting reservations for a book (public query).
  public query func getReservationsForBook(
    bookId : Common.BookId,
  ) : async [ReservationTypes.Reservation] {
    ReservationsLib.getReservationsForBook(reservations, bookId);
  };
};
