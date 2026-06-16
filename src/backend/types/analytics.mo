import Common "common";

module {
  /// Row type for CSV bulk book import.
  public type BookCsvRow = {
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    totalCopies : Nat;
    availableCopies : Nat;
    category : Text;
  };

  /// Result returned by importBooksFromCsv.
  public type CsvImportResult = {
    processed : Nat;
    skipped : Nat;
    errors : [Text];
  };

  /// Analytics aggregate returned by getAnalyticsData.
  public type AnalyticsData = {
    totalStudents : Nat;
    activeStudents : Nat;
    totalBooks : Nat;
    pendingRequests : Nat;
    approvedRequests : Nat;
    rejectedRequests : Nat;
    returnedRequests : Nat;
    lowStockBooks : Nat;
    booksByCategory : [(Text, Nat)];
    requestsOverTime : [(Text, Nat)];
    totalReservations : Nat;
    totalProcurements : Nat;
    booksOverdue : Nat;
    booksIssued : Nat;
    booksAvailable : Nat;
    reservedBooks : Nat;
    waitingListCount : Nat;
    dueReturns : Nat;
  };
};
