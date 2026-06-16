import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import BookTypes "../types/book";
import Common "../types/common";
import Types "mo:core/Types";
import BooksLib "../lib/books";
import AdminLib "../lib/admin";
import ReservationTypes "../types/reservation";
import Int "mo:core/Int";

mixin (
  books : Map.Map<Common.BookId, BookTypes.Book>,
  bookCounter : { var value : Nat },
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
) {
  /// Add a new book to the library. Requires valid adminToken.
  public shared func addBook(
    adminToken : Text,
    title : Text,
    author : Text,
    edition : Text,
    publisher : Text,
    category : Text,
    quantity : Nat,
  ) : async Types.Result<BookTypes.Book, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    bookCounter.value += 1;
    let bookId = BooksLib.generateBookId(bookCounter.value);
    let book = BooksLib.create(bookId, title, author, edition, publisher, category, quantity, Time.now());
    books.add(bookId, book);
    #ok(book);
  };

  /// Update an existing book's details. Requires valid adminToken.
  public shared func updateBook(
    adminToken : Text,
    bookId : Common.BookId,
    title : Text,
    author : Text,
    edition : Text,
    publisher : Text,
    category : Text,
    quantity : Nat,
    availableCount : Nat,
  ) : async Types.Result<BookTypes.Book, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (books.get(bookId)) {
      case (?book) {
        let updated = BooksLib.update(book, title, author, edition, publisher, category, quantity, availableCount);
        books.add(bookId, updated);
        #ok(updated);
      };
      case null { #err("Book not found: " # bookId) };
    };
  };

  /// Soft-delete a book from the library. Requires valid adminToken.
  public shared func deleteBook(
    adminToken : Text,
    bookId : Common.BookId,
  ) : async Types.Result<(), Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    switch (books.get(bookId)) {
      case (?book) {
        books.add(bookId, BooksLib.softDelete(book));
        #ok(());
      };
      case null { #err("Book not found: " # bookId) };
    };
  };

  /// Search books by title, author, or category. Excludes deleted books.
  public query func searchBooks(
    searchTerm : Text,
    course : Text,
  ) : async [BookTypes.Book] {
    BooksLib.search(books, searchTerm, course);
  };

  /// Get a single book by ID.
  public query func getBookById(
    bookId : Common.BookId,
  ) : async Types.Result<BookTypes.Book, Text> {
    switch (books.get(bookId)) {
      case (?book) { #ok(book) };
      case null { #err("Book not found: " # bookId) };
    };
  };

  /// Get book recommendations (same category/author as the given book).
  public query func getBookRecommendations(
    bookId : Common.BookId,
  ) : async [BookTypes.Book] {
    BooksLib.getRecommendations(books, bookId, bookId);
  };

  /// Get all books including deleted. Requires valid adminToken.
  public query func getAllBooks(adminToken : Text) : async [BookTypes.Book] {
    if (not AdminLib.isAdminToken(adminToken)) {
      Runtime.trap("Unauthorized: Invalid admin token");
    };
    books.values().toArray();
  };

  /// Check availability of a book and return expected return info for smart availability flow.
  public query func checkBookAvailability(
    bookId : Common.BookId,
  ) : async Types.Result<{ available : Bool; expectedReturnDate : ?Common.Timestamp; waitingCount : Nat; daysUntilReturn : ?Int }, Text> {
    switch (books.get(bookId)) {
      case null { #err("Book not found: " # bookId) };
      case (?book) {
        let available = book.availableCount > 0;
        let waitingCount = book.waitingQueue.size();
        let nowNs = Time.now();
        let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
        // Find the earliest expected return from active reservations' expectedAvailabilityDate
        let earliest : ?Common.Timestamp = reservations.values()
          .filter(func(r) { r.bookId == bookId and r.status == #Waiting })
          .foldLeft(
            null : ?Common.Timestamp,
            func(acc : ?Common.Timestamp, r : ReservationTypes.Reservation) : ?Common.Timestamp {
              switch (r.expectedAvailabilityDate) {
                case null { acc };
                case (?d) {
                  switch (acc) {
                    case null { ?d };
                    case (?a) { if (d < a) { ?d } else { ?a } };
                  };
                };
              };
            },
          );
        let daysUntilReturn : ?Int = switch (earliest) {
          case null { null };
          case (?d) { ?((d - nowNs) / dayNs) };
        };
        #ok({ available; expectedReturnDate = earliest; waitingCount; daysUntilReturn });
      };
    };
  };

  /// Bulk seed books from a data array. Requires valid adminToken.
  public shared func seedBooks(
    adminToken : Text,
    booksInput : [BookTypes.BookInput],
  ) : async Types.Result<Nat, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    var count = 0;
    for (input in booksInput.values()) {
      bookCounter.value += 1;
      let bookId = BooksLib.generateBookId(bookCounter.value);
      let book = BooksLib.create(bookId, input.title, input.author, input.edition, input.publisher, input.category, input.quantity, now);
      books.add(bookId, book);
      count += 1;
    };
    #ok(count);
  };
};
