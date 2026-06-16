import Common "common";
import ReservationTypes "reservation";
import ProcurementTypes "procurement";
import BookDecisionTypes "book-decision";
import Nat "mo:core/Nat";

module {
  /// Expected availability dates per book, keyed by BookId.
  public type BookAvailabilityDate = {
    bookId : Common.BookId;
    bookTitle : Text;
    expectedDate : Common.Timestamp;
  };

  /// A book entry for challan display with full metadata and status.
  /// Never exposes internal database IDs — always carries human-readable details.
  public type ChallanBookEntry = {
    bookId : Common.BookId;
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    subject : Text;
    bookNumber : Text;
    status : BookDecisionTypes.BookDecisionStatus;
    reason : ?Text; // for rejected books
    currentHolder : ?Text; // for reserved books
    currentHolderStudentId : ?Text;
    expectedReturnDate : ?Common.Timestamp; // for reserved books
    queuePosition : ?Nat;
    expectedAvailabilityDate : ?Common.Timestamp; // for ordered / arrived books
  };

  public type Challan = {
    challanId : Common.ChallanId;
    /// Human-readable challan number (e.g. "CHN-00042").
    challanNumber : Text;
    requestNumber : Common.RequestId;
    studentId : Common.UserId;
    studentName : Text;
    studentEmail : Text;
    studentPhone : Text;
    studentCourse : Text;
    studentYear : Text;
    adminName : Text;
    generatedAt : Common.Timestamp;
    /// Total deposit / fee amount on this challan (in rupees).
    totalAmount : Nat;
    /// IDs of catalogue books directly issued.
    issuedBookIds : [Common.BookId];
    /// Approved books with full details.
    approvedBooks : [ChallanBookEntry];
    /// Rejected books with reason.
    rejectedBooks : [ChallanBookEntry];
    /// Reserved books with current holder and expected return.
    reservedBooks : [ChallanBookEntry];
    /// Manual / special book requests with their statuses.
    manualBooks : [ChallanBookEntry];
    /// Ordered books (procurement / special order placed).
    orderedBooks : [ChallanBookEntry];
    /// Arrived books (procured copy has arrived).
    arrivedBooks : [ChallanBookEntry];
    /// Ready for collection books.
    readyForCollectionBooks : [ChallanBookEntry];
    /// Issued books.
    issuedBooks : [ChallanBookEntry];
    /// Returned books.
    returnedBooks : [ChallanBookEntry];
    /// Reservations created for books not immediately available.
    reservations : [ReservationTypes.Reservation];
    /// Procurement requests for books needing urgent new copies.
    procurementRequests : [ProcurementTypes.ProcurementRequest];
    /// Expected availability dates for each reserved/procured book.
    expectedDates : [BookAvailabilityDate];
    /// Per-book availability dates for display.
    availabilityDates : [BookAvailabilityDate];
    createdAt : Common.Timestamp;
    status : Text; // "Active" | "Closed"
    /// Structured per-book decisions (v2 field; replaces separate approved/rejected/reserved lists).
    bookDecisions : [BookDecisionTypes.BookDecision];
    /// Manual / special requests with unified status.
    specialRequests : [BookDecisionTypes.SpecialRequest];
    /// Mandatory collection date set by admin (ISO 8601).
    collectionDate : Text;
    /// Mandatory collection time set by admin (e.g. "11:00 AM").
    collectionTime : Text;
    /// Linked collection order number (e.g. "CO-00042").
    collectionOrderNumber : Text;
    /// URL of the QR code linking to the student's digital page.
    qrCodeUrl : Text;
    /// Raw QR code data (e.g. a data URI or encoded string).
    qrCodeData : ?Text;
    /// URL to the generated PDF challan file.
    pdfUrl : ?Text;
    /// Admin signature on the challan.
    signatureAdmin : ?Text;
    /// Student signature on the challan.
    signatureStudent : ?Text;
    /// IDs of books being tracked in this challan.
    trackedBookIds : [Common.BookId];
    /// Lifecycle tracking events for each book.
    trackingEvents : [Text];
  };
};
