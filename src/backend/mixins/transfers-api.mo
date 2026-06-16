import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "mo:core/Types";
import TransferTypes "../types/transfer";
import ReservationTypes "../types/reservation";
import ChallanTypes "../types/challan";
import ProcurementTypes "../types/procurement";
import RequestTypes "../types/request";
import UserTypes "../types/user";
import BookTypes "../types/book";
import Common "../types/common";
import TransfersLib "../lib/transfers";
import ReservationsLib "../lib/reservations";
import ChallansLib "../lib/challans";
import AdminLib "../lib/admin";

mixin (
  users : Map.Map<Common.UserId, UserTypes.User>,
  books : Map.Map<Common.BookId, BookTypes.Book>,
  requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
  reservations : Map.Map<Common.ReservationId, ReservationTypes.Reservation>,
  challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
  transfers : Map.Map<Common.TransferId, TransferTypes.Transfer>,
  transferCounter : { var value : Nat },
  challanCounter : { var value : Nat },
) {
  /// Execute a full book transfer from one student to the next waiting student.
  /// Steps:
  ///  1. Mark current holder's request as Returned
  ///  2. Restore availableCount on the book (temporarily)
  ///  3. Create new IssuedBook request for next student (Approved + issue/return dates)
  ///  4. Decrement availableCount again
  ///  5. Fulfill the waiting reservation
  ///  6. Create Transfer record
  ///  7. Generate updated challan for next student
  public shared func transferBook(
    adminToken : Text,
    fromStudentId : Common.UserId,
    toStudentId : Common.UserId,
    bookId : Common.BookId,
    adminNotes : ?Text,
  ) : async Types.Result<TransferTypes.Transfer, Text> {
    if (not AdminLib.isAdminToken(adminToken)) {
      return #err("Unauthorized: Invalid admin token");
    };
    let now = Time.now();
    // 1. Find and mark fromStudent's active request for this book as Returned
    switch (TransfersLib.findActiveRequestForStudentBook(requests, fromStudentId, bookId)) {
      case null {}; // No active request found — continue anyway (manual transfer)
      case (?req) {
        let returnedReq = { req with status = "Returned"; returned = true };
        requests.add(req.requestId, returnedReq);
        // 2. Restore book's available count
        switch (books.get(bookId)) {
          case (?book) {
            books.add(bookId, { book with availableCount = book.availableCount + 1; availableQuantity = book.availableQuantity + 1 });
          };
          case null {};
        };
      };
    };
    // 3. Validate toStudent exists
    let toUser = switch (users.get(toStudentId)) {
      case null { return #err("Destination student not found: " # toStudentId) };
      case (?u) { u };
    };
    // 4. Create new request (Approved) for the next student
    let newRequestId = "TRANS-REQ-" # now.toText();
    let fourteenDays : Int = 14 * 24 * 60 * 60 * 1_000_000_000;
    let newRequest : RequestTypes.BookRequest = {
      requestId = newRequestId;
      userId = toStudentId;
      selectedBookIds = [bookId];
      requestedBooks = [];
      bookApprovals = [];
      status = "Approved";
      challanData = "";
      challanId = null;
      createdAt = now;
      issueDate = ?now;
      returnDate = ?(now + fourteenDays);
      returned = false;
      studentName = toUser.name;
      studentPhone = toUser.phone;
      studentCourse = toUser.course;
      studentAadhaar = toUser.aadhaarNumber;
      studentEmail = toUser.email;
      studentYear = toUser.academicYear;
      requestNumber = "TRANS-" # transferCounter.value.toText();
      collectionDate = "";
      collectionTime = "";
      collectionLocation = "";
      collectionOrderId = null;
      bookDecisions = [];
      specialRequests = [];
      studentId = toUser.studentId;
      updatedAt = now;
      adminId = null;
      adminName = null;
      requestNotes = null;
    };
    requests.add(newRequestId, newRequest);
    // 5. Decrement available count
    switch (books.get(bookId)) {
      case (?book) {
        let newAvail : Nat = if (book.availableCount > 0) { book.availableCount - 1 : Nat } else { 0 };
        let newAvailQty : Nat = if (book.availableQuantity > 0) { book.availableQuantity - 1 : Nat } else { 0 };
        books.add(bookId, { book with availableCount = newAvail; availableQuantity = newAvailQty; isAvailable = newAvail > 0 });
      };
      case null {};
    };
    // 6. Fulfill the waiting reservation if one exists
    switch (reservations.values().find(func(r) {
      r.studentId == toStudentId and r.bookId == bookId and r.status == #Waiting
    })) {
      case (?res) {
        let _ = ReservationsLib.fulfillReservation(reservations, books, res.id);
      };
      case null {};
    };
    // 7. Create Transfer record
    transferCounter.value += 1;
    let transferId = TransfersLib.generateTransferId(transferCounter.value);
    // 8. Generate updated challan for toStudent
    challanCounter.value += 1;
    let challanId = ChallansLib.generateChallanId(challanCounter.value);
    let bookTitle = switch (books.get(bookId)) {
      case (?b) { b.title };
      case null { bookId };
    };
    let expectedDate : ChallanTypes.BookAvailabilityDate = {
      bookId;
      bookTitle;
      expectedDate = now + fourteenDays;
    };
    let _challan = ChallansLib.createChallan(
      challans, challanId,
      "CHN-" # challanCounter.value.toText(),
      "", "Admin",
      toStudentId,
      toUser.name, toUser.email, toUser.phone, toUser.course,
      [bookId], [], [], [],
      [], [], [expectedDate], [expectedDate], 0, now,
    );
    let transfer : TransferTypes.Transfer = {
      id = transferId;
      fromStudentId;
      toStudentId;
      bookId;
      transferDate = now;
      adminNotes;
      challanId = ?challanId;
    };
    transfers.add(transferId, transfer);
    #ok(transfer);
  };

  /// Get all transfers for a specific book.
  public query func getTransfersForBook(
    bookId : Common.BookId,
  ) : async [TransferTypes.Transfer] {
    TransfersLib.getTransfersForBook(transfers, bookId);
  };

  /// Get full transfer history (admin).
  public query func getTransferHistory(
    adminToken : Text,
  ) : async [TransferTypes.Transfer] {
    if (not AdminLib.isAdminToken(adminToken)) {
      return [];
    };
    TransfersLib.getTransferHistory(transfers);
  };
};
