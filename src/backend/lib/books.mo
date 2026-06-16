import Map "mo:core/Map";
import Types "../types/book";
import Common "../types/common";

module {
  // Generate a unique book ID
  public func generateBookId(counter : Nat) : Common.BookId {
    "BOOK" # counter.toText();
  };

  // Create a new book
  public func create(
    bookId : Common.BookId,
    title : Text,
    author : Text,
    edition : Text,
    publisher : Text,
    category : Text,
    quantity : Nat,
    now : Common.Timestamp,
  ) : Types.Book {
    {
      bookId;
      title;
      author;
      edition;
      publisher;
      category;
      quantity;
      availableCount = quantity;
      totalQuantity = quantity;
      availableQuantity = quantity;
      currentHolders = [];
      waitingQueue = [];
      isAvailable = quantity > 0;
      isDeleted = false;
      createdAt = now;
    };
  };

  // Search books by query and optional course filter
  public func search(
    books : Map.Map<Common.BookId, Types.Book>,
    searchTerm : Text,
    _course : Text,
  ) : [Types.Book] {
    let lower = searchTerm.toLower();
    books.values()
      .filter(func(b) {
        not b.isDeleted and (
          lower == "" or
          b.title.toLower().contains(#text lower) or
          b.author.toLower().contains(#text lower) or
          b.category.toLower().contains(#text lower)
        );
      })
      .toArray();
  };

  // Get book recommendations (same category or author, excluding the given book)
  public func getRecommendations(
    books : Map.Map<Common.BookId, Types.Book>,
    bookId : Common.BookId,
    excludeBookId : Common.BookId,
  ) : [Types.Book] {
    let source = switch (books.get(bookId)) {
      case (?b) { b };
      case null { return [] };
    };
    books.values()
      .filter(func(b) {
        not b.isDeleted and
        b.bookId != excludeBookId and
        (b.category == source.category or b.author == source.author);
      })
      .take(3)
      .toArray();
  };

  // Soft-delete a book
  public func softDelete(book : Types.Book) : Types.Book {
    { book with isDeleted = true };
  };

  // Decrement available count on borrow
  public func decrementAvailable(book : Types.Book) : Types.Book {
    let newAvail : Nat = if (book.availableCount > 0) { book.availableCount - 1 : Nat } else { 0 };
    let newAvailQty : Nat = if (book.availableQuantity > 0) { book.availableQuantity - 1 : Nat } else { 0 };
    { book with availableCount = newAvail; availableQuantity = newAvailQty; isAvailable = newAvail > 0 };
  };

  // Update book fields
  public func update(
    book : Types.Book,
    title : Text,
    author : Text,
    edition : Text,
    publisher : Text,
    category : Text,
    quantity : Nat,
    availableCount : Nat,
  ) : Types.Book {
    { book with title; author; edition; publisher; category; quantity; availableCount; totalQuantity = quantity; availableQuantity = availableCount; isAvailable = availableCount > 0 };
  };
};
