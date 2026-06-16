import Map "mo:core/Map";
import UserTypes "../types/user";
import BookTypes "../types/book";
import RequestTypes "../types/request";
import Common "../types/common";
import AnalyticsTypes "../types/analytics";
import Types "mo:core/Types";
import AnalyticsLib "../lib/analytics";
import BooksLib "../lib/books";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
import AdminLib "../lib/admin";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  books : Map.Map<Common.BookId, BookTypes.Book>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
  bookCounter : { var value : Nat },
) {
  /// Returns aggregate analytics for the admin dashboard. Admin only.
  public query func getAnalyticsData(adminToken : Text) : async AnalyticsTypes.AnalyticsData {
    if (not AdminLib.isAdminToken(adminToken)) {
      Runtime.trap("Unauthorized: Invalid admin token");
    };
    AnalyticsLib.computeAnalytics(users, books, requests, reservations.size(), procurements.size());
  };

  /// Bulk import books from CSV rows. Admin only.
  public shared func importBooksFromCsv(
    adminToken : Text,
    rows : [AnalyticsTypes.BookCsvRow],
  ) : async Types.Result<AnalyticsTypes.CsvImportResult, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    var processed = 0;
    var skipped = 0;
    let errors = List.empty<Text>();
    let now = Time.now();
    for (row in rows.values()) {
      if (row.title == "" or row.author == "") {
        skipped += 1;
        errors.add("Skipped row with empty title or author: " # row.title);
      } else {
        bookCounter.value += 1;
        let bookId = BooksLib.generateBookId(bookCounter.value);
        let qty = if (row.totalCopies > 0) { row.totalCopies } else { 1 };
        let book = BooksLib.create(bookId, row.title, row.author, row.edition, row.publisher, row.category, qty, now);
        books.add(bookId, book);
        processed += 1;
      };
    };
    #ok({ processed; skipped; errors = errors.toArray() });
  };

  /// Get the QR code data string for a student + request pair. Public query.
  public query func getQrCodeData(
    studentId : Text,
    requestId : Common.RequestId,
  ) : async Text {
    let userData = switch (users.get(studentId)) {
      case (?u) {
        "{\"studentId\":\"" # u.studentId # "\",\"name\":\"" # u.name # "\",\"course\":\"" # u.course # "\",\"college\":\"" # u.college # "\",\"paymentStatus\":\"" # u.paymentStatus # "\"}"
      };
      case null { "{\"studentId\":\"" # studentId # "\",\"error\":\"not found\"}" };
    };
    let requestData = switch (requests.get(requestId)) {
      case (?r) {
        "{\"requestId\":\"" # r.requestId # "\",\"status\":\"" # r.status # "\",\"books\":" # debug_show(r.requestedBooks) # "}"
      };
      case null { "{\"requestId\":\"" # requestId # "\",\"error\":\"not found\"}" };
    };
    "{\"user\":" # userData # ",\"request\":" # requestData # "}";
  };

  /// Search and filter books in the inventory. Accessible to all.
  public query func searchInventory(
    searchQuery : Text,
    category : ?Text,
    availabilityFilter : ?Text,
  ) : async [BookTypes.Book] {
    let lower = searchQuery.toLower();
    books.values()
      .filter(func(b) {
        if (b.isDeleted) { return false };
        let matchesQuery = lower == "" or
          b.title.toLower().contains(#text lower) or
          b.author.toLower().contains(#text lower) or
          b.edition.toLower().contains(#text lower) or
          b.publisher.toLower().contains(#text lower);
        let matchesCategory = switch (category) {
          case (?cat) { b.category == cat };
          case null { true };
        };
        let matchesAvailability = switch (availabilityFilter) {
          case (?("available")) { b.availableCount > 0 };
          case (?("unavailable")) { b.availableCount == 0 };
          case _ { true };
        };
        matchesQuery and matchesCategory and matchesAvailability;
      })
      .toArray();
  };
};
