import Map "mo:core/Map";
import Common "../types/common";
import UserTypes "../types/user";
import BookTypes "../types/book";
import RequestTypes "../types/request";
import ChallanTypes "../types/challan";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import BookDecisionTypes "../types/book-decision";

/// Pure helper functions for building Challan records from request state.
module {

  /// Generate the next sequential challan number string, e.g. "CHN-00042".
  public func generateChallanNumber(counter : Nat) : Text {
    let padded = if (counter < 10) { "0000" # counter.toText() }
      else if (counter < 100) { "000" # counter.toText() }
      else if (counter < 1000) { "00" # counter.toText() }
      else if (counter < 10000) { "0" # counter.toText() }
      else { counter.toText() };
    "CHN-" # padded;
  };

  /// Build a ChallanBookEntry for an approved book.
  public func makeApprovedEntry(
    book : BookTypes.Book,
  ) : ChallanTypes.ChallanBookEntry {
    {
      bookId = book.bookId;
      title = book.title;
      author = book.author;
      edition = book.edition;
      publisher = book.publisher;
      subject = book.category;
      bookNumber = book.bookId;
      status = #Approved;
      reason = null;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      expectedAvailabilityDate = null;
    };
  };

  /// Build a ChallanBookEntry for a rejected book with reason.
  public func makeRejectedEntry(
    book : BookTypes.Book,
    reason : ?Text,
  ) : ChallanTypes.ChallanBookEntry {
    {
      bookId = book.bookId;
      title = book.title;
      author = book.author;
      edition = book.edition;
      publisher = book.publisher;
      subject = book.category;
      bookNumber = book.bookId;
      status = #Rejected;
      reason;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      expectedAvailabilityDate = null;
    };
  };

  /// Build a ChallanBookEntry for a reserved book (shows current holder + expected return).
  public func makeReservedEntry(
    book : BookTypes.Book,
    currentHolder : ?Text,
    expectedReturnDate : ?Common.Timestamp,
  ) : ChallanTypes.ChallanBookEntry {
    {
      bookId = book.bookId;
      title = book.title;
      author = book.author;
      edition = book.edition;
      publisher = book.publisher;
      subject = book.category;
      bookNumber = book.bookId;
      status = #Reserved;
      reason = null;
      currentHolder;
      currentHolderStudentId = null;
      expectedReturnDate;
      queuePosition = null;
      expectedAvailabilityDate = null;
    };
  };

  /// Build a ChallanBookEntry from a BookDecision.
  public func makeEntryFromDecision(
    decision : BookDecisionTypes.BookDecision,
  ) : ChallanTypes.ChallanBookEntry {
    {
      bookId = decision.bookId;
      title = decision.bookName;
      author = decision.author;
      edition = decision.edition;
      publisher = decision.publisher;
      subject = decision.subject;
      bookNumber = decision.bookNumber;
      status = decision.decision;
      reason = decision.reason;
      currentHolder = decision.currentHolder;
      currentHolderStudentId = decision.currentHolderStudentId;
      expectedReturnDate = decision.expectedReturnDate;
      queuePosition = decision.queuePosition;
      expectedAvailabilityDate = null;
    };
  };

  /// Build a ChallanBookEntry from a SpecialRequest.
  public func makeEntryFromSpecialRequest(
    special : BookDecisionTypes.SpecialRequest,
  ) : ChallanTypes.ChallanBookEntry {
    {
      bookId = "";
      title = special.title;
      author = special.author;
      edition = special.edition;
      publisher = special.publisher;
      subject = "";
      bookNumber = "";
      status = special.status;
      reason = special.reason;
      currentHolder = null;
      currentHolderStudentId = null;
      expectedReturnDate = null;
      queuePosition = null;
      expectedAvailabilityDate = special.expectedAvailabilityDate;
    };
  };

  /// Assemble a full Challan from request + approval map + related entities.
  public func buildChallan(
    challanId : Common.ChallanId,
    challanNumber : Text,
    request : RequestTypes.BookRequest,
    user : UserTypes.User,
    books : Map.Map<Common.BookId, BookTypes.Book>,
    reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
    procurements : Map.Map<Common.ProcurementId, ProcurementTypes.ProcurementRequest>,
    adminName : Text,
    now : Common.Timestamp,
  ) : ChallanTypes.Challan {
    // Build approved, rejected, and reserved book entry lists from per-book approvals
    var approvedBooks : [ChallanTypes.ChallanBookEntry] = [];
    var rejectedBooks : [ChallanTypes.ChallanBookEntry] = [];
    var reservedBooks : [ChallanTypes.ChallanBookEntry] = [];
    var issuedBookIds : [Common.BookId] = [];
    var availabilityDates : [ChallanTypes.BookAvailabilityDate] = [];

    for ((bookId, decision) in request.bookApprovals.vals()) {
      switch (books.get(bookId)) {
        case null {};
        case (?book) {
          if (decision == "Approved") {
            approvedBooks := approvedBooks.concat([makeApprovedEntry(book)]);
            issuedBookIds := issuedBookIds.concat([bookId]);
          } else if (decision == "Rejected") {
            rejectedBooks := rejectedBooks.concat([makeRejectedEntry(book, null)]);
          } else if (decision == "Reserved") {
            // Find the reservation for this book and student to get expected date
            let resv = reservations.values().find(
              func(r : ReservationTypes.Reservation) : Bool {
                r.bookId == bookId and r.studentId == user.studentId
              }
            );
            let expectedDate = switch (resv) {
              case (?r) { r.expectedAvailabilityDate };
              case null { null };
            };
            // Find current holder from book's currentHolders
            let holder = if (book.currentHolders.size() > 0) {
              ?book.currentHolders[0]
            } else { null };
            reservedBooks := reservedBooks.concat([makeReservedEntry(book, holder, expectedDate)]);
            // Add availability date entry
            switch (expectedDate) {
              case (?ed) {
                availabilityDates := availabilityDates.concat([{
                  bookId;
                  bookTitle = book.title;
                  expectedDate = ed;
                }]);
              };
              case null {};
            };
          };
        };
      };
    };

    // Collect related reservations for this request's student
    let relatedReservations = Iter.toArray(
      reservations.values().filter(
        func(r : ReservationTypes.Reservation) : Bool {
          r.studentId == user.studentId and r.status == #Waiting
        }
      )
    );

    // Collect related procurement requests for this student
    let relatedProcurements = Iter.toArray(
      procurements.values().filter(
        func(p : ProcurementTypes.ProcurementRequest) : Bool {
          p.studentId == user.studentId and p.status == #Pending
        }
      )
    );

    // Compute full display name
    let parts = [user.firstName, user.middleName, user.grandFatherName, user.surname];
    var studentName = "";
    for (part in parts.vals()) {
      if (part != "") {
        if (studentName != "") { studentName #= " " };
        studentName #= part;
      };
    };
    if (studentName == "") { studentName := user.name };

    // Build structured bookDecisions from request.bookDecisions
    var bookDecisions : [BookDecisionTypes.BookDecision] = [];
    for (decision in request.bookDecisions.vals()) {
      bookDecisions := bookDecisions.concat([decision]);
    };

    // Build specialRequests from request.specialRequests
    var specialRequests : [BookDecisionTypes.SpecialRequest] = [];
    for (special in request.specialRequests.vals()) {
      specialRequests := specialRequests.concat([special]);
    };

    // Build manualBooks, orderedBooks, arrivedBooks, readyForCollectionBooks,
    // issuedBooks, returnedBooks from bookDecisions and specialRequests
    var manualBooks : [ChallanTypes.ChallanBookEntry] = [];
    var orderedBooks : [ChallanTypes.ChallanBookEntry] = [];
    var arrivedBooks : [ChallanTypes.ChallanBookEntry] = [];
    var readyForCollectionBooks : [ChallanTypes.ChallanBookEntry] = [];
    var issuedBooks : [ChallanTypes.ChallanBookEntry] = [];
    var returnedBooks : [ChallanTypes.ChallanBookEntry] = [];

    for (decision in bookDecisions.vals()) {
      let entry = makeEntryFromDecision(decision);
      switch (decision.decision) {
        case (#Pending) {};
        case (#Approved) {};
        case (#Rejected) {};
        case (#Reserved) {};
        case (#Ordered) { orderedBooks := orderedBooks.concat([entry]) };
        case (#Purchased) { orderedBooks := orderedBooks.concat([entry]) };
        case (#Arrived) { arrivedBooks := arrivedBooks.concat([entry]) };
        case (#ReadyForCollection) { readyForCollectionBooks := readyForCollectionBooks.concat([entry]) };
        case (#Issued) { issuedBooks := issuedBooks.concat([entry]) };
        case (#Returned) { returnedBooks := returnedBooks.concat([entry]) };
        case (#SpecialOrder) { orderedBooks := orderedBooks.concat([entry]) };
      };
    };

    for (special in specialRequests.vals()) {
      let entry = makeEntryFromSpecialRequest(special);
      switch (special.status) {
        case (#Pending) { manualBooks := manualBooks.concat([entry]) };
        case (#Approved) { manualBooks := manualBooks.concat([entry]) };
        case (#Rejected) { manualBooks := manualBooks.concat([entry]) };
        case (#Reserved) { manualBooks := manualBooks.concat([entry]) };
        case (#Ordered) { orderedBooks := orderedBooks.concat([entry]) };
        case (#Purchased) { orderedBooks := orderedBooks.concat([entry]) };
        case (#Arrived) { arrivedBooks := arrivedBooks.concat([entry]) };
        case (#ReadyForCollection) { readyForCollectionBooks := readyForCollectionBooks.concat([entry]) };
        case (#Issued) { issuedBooks := issuedBooks.concat([entry]) };
        case (#Returned) { returnedBooks := returnedBooks.concat([entry]) };
        case (#SpecialOrder) { orderedBooks := orderedBooks.concat([entry]) };
      };
    };

    {
      challanId;
      challanNumber;
      requestNumber = request.requestId;
      studentId = user.studentId;
      studentName;
      studentEmail = user.email;
      studentPhone = user.phone;
      studentCourse = user.course;
      studentYear = user.academicYear;
      adminName;
      generatedAt = now;
      totalAmount = 200;
      issuedBookIds;
      approvedBooks;
      rejectedBooks;
      reservedBooks;
      manualBooks;
      orderedBooks;
      arrivedBooks;
      readyForCollectionBooks;
      issuedBooks;
      returnedBooks;
      reservations = relatedReservations;
      procurementRequests = relatedProcurements;
      expectedDates = availabilityDates;
      availabilityDates;
      createdAt = now;
      status = "Active";
      bookDecisions;
      collectionDate = request.collectionDate;
      collectionTime = request.collectionTime;
      collectionOrderNumber = "";
      qrCodeUrl = "";
      qrCodeData = null;
      pdfUrl = null;
      signatureAdmin = null;
      signatureStudent = null;
      trackedBookIds = issuedBookIds;
      trackingEvents = [];
      specialRequests;
    };
  };
};
