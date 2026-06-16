import Map "mo:core/Map";
import UserTypes "../types/user";
import BookTypes "../types/book";
import RequestTypes "../types/request";
import Common "../types/common";
import AnalyticsTypes "../types/analytics";
import Time "mo:core/Time";

module {
  /// Compute full analytics data over the current stable maps.
  public func computeAnalytics(
    users : Map.Map<Common.UserId, UserTypes.User>,
    books : Map.Map<Common.BookId, BookTypes.Book>,
    requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
    totalReservations : Nat,
    totalProcurements : Nat,
  ) : AnalyticsTypes.AnalyticsData {
    // Count all registered students
    let totalStudents = users.size();

    // Active students = paid membership
    let activeStudents = users.values()
      .filter(func(u) { u.membershipStatus == #PAID })
      .size();

    // Count non-deleted books
    let totalBooks = books.values()
      .filter(func(b) { not b.isDeleted })
      .size();

    // booksIssued = total currentHolders count (approved non-returned requests sum of selectedBookIds)
    var booksIssued = 0;
    requests.values().forEach(func(r) {
      if ((r.status == "Approved" or r.status == "Procured") and not r.returned) {
        booksIssued += r.selectedBookIds.size();
      };
    });

    // booksAvailable = sum of availableCount across non-deleted books
    var booksAvailable = 0;
    books.values().forEach(func(b) {
      if (not b.isDeleted) { booksAvailable += b.availableCount };
    });

    // reservedBooks = count of active (Waiting) reservations
    let reservedBooks = totalReservations;

    // waitingListCount = total entries in all books' waitingQueue
    var waitingListCount = 0;
    books.values().forEach(func(b) {
      if (not b.isDeleted) { waitingListCount += b.waitingQueue.size() };
    });

    // Count requests by status
    var pending = 0;
    var approved = 0;
    var rejected = 0;
    var returned = 0;
    requests.values().forEach(func(r) {
      if (r.status == "Pending") { pending += 1 }
      else if (r.status == "Approved") { approved += 1 }
      else if (r.status == "Rejected") { rejected += 1 }
      else if (r.status == "Returned") { returned += 1 };
    });

    // Count overdue books (returnDate < now and not returned)
    let nowNs = Time.now();
    let sevenDaysNs : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
    let booksOverdue = requests.values()
      .filter(func(r) {
        not r.returned and
        (r.status == "Approved" or r.status == "Procured") and
        (switch (r.returnDate) { case (?rd) { rd < nowNs }; case null { false } })
      })
      .size();

    // dueReturns = books due within 7 days
    let dueReturns = requests.values()
      .filter(func(r) {
        not r.returned and
        (r.status == "Approved" or r.status == "Procured") and
        (switch (r.returnDate) { case (?rd) { rd >= nowNs and rd <= nowNs + sevenDaysNs }; case null { false } })
      })
      .size();

    // Count low-stock books (availableCount <= 2 and not deleted)
    let lowStockBooks = books.values()
      .filter(func(b) { not b.isDeleted and b.availableCount <= 2 })
      .size();

    // Group books by category
    let categoryMap = Map.empty<Text, Nat>();
    books.values().forEach(func(b) {
      if (not b.isDeleted) {
        let current = switch (categoryMap.get(b.category)) {
          case (?n) { n };
          case null { 0 };
        };
        categoryMap.add(b.category, current + 1);
      };
    });
    let booksByCategory = categoryMap.entries().toArray();

    // Requests over time: count per day (last 30 days)
    let dayMap = Map.empty<Text, Nat>();
    let oneDayNs : Int = 86_400_000_000_000;
    requests.values().forEach(func(r) {
      let dayIndex = r.createdAt / oneDayNs;
      let dayKey = dayIndex.toText();
      let current = switch (dayMap.get(dayKey)) {
        case (?n) { n };
        case null { 0 };
      };
      dayMap.add(dayKey, current + 1);
    });
    let requestsOverTime = dayMap.entries().toArray();

    {
      totalStudents;
      activeStudents;
      totalBooks;
      pendingRequests = pending;
      approvedRequests = approved;
      rejectedRequests = rejected;
      returnedRequests = returned;
      lowStockBooks;
      booksByCategory;
      requestsOverTime;
      totalReservations;
      totalProcurements;
      booksOverdue;
      booksIssued;
      booksAvailable;
      reservedBooks;
      waitingListCount;
      dueReturns;
    };
  };
};
