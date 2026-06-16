import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";
import Nat "mo:core/Nat";
import BookDecisionTypes "../types/book-decision";

module {
  public type RequestedBook = {
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    bookImage : Storage.ExternalBlob;
  };

  // Shared-safe version for API (no ExternalBlob)
  public type RequestedBookPublic = {
    title : Text;
    author : Text;
    edition : Text;
    publisher : Text;
    imageUrl : Text;
  };

  /// Possible states for a book request.
  public type RequestStatus = {
    #pending;
    #approved;
    #rejected;
    #procured;
    #returned;
  };

  public type BookRequest = {
    requestId : Common.RequestId;
    userId : Common.UserId;
    selectedBookIds : [Common.BookId];
    requestedBooks : [RequestedBookPublic];
    status : Text;
    challanData : Text;
    challanId : ?Common.ChallanId; // linked challan if generated
    createdAt : Common.Timestamp;
    issueDate : ?Common.Timestamp;
    returnDate : ?Common.Timestamp;
    returned : Bool;
    // Denormalized student fields for admin display
    studentName : Text;
    studentPhone : Text;
    studentCourse : Text;
    studentAadhaar : Text;
    // Per-book approval status: bookId -> "Pending" | "Approved" | "Rejected" | "Reserved"
    // DEPRECATED: use bookDecisions for new code; kept for backward compatibility.
    bookApprovals : [(Common.BookId, Text)];
    // Extended admin display fields (new)
    studentEmail : Text;
    studentYear : Text;
    requestNumber : Text; // human-readable e.g. "REQ-00042"
    // Mandatory collection scheduling (set by admin before completing approval)
    collectionDate : Text;  // ISO date e.g. "2026-07-15"
    collectionTime : Text;  // e.g. "11:00 AM"
    collectionLocation : Text; // e.g. "SVGA Book Bank Office"
    collectionOrderId : ?Text; // linked CollectionOrder id
    // Unified per-book decisions for ALL books in the request (inventory + manual).
    // This replaces bookApprovals and is the source of truth for status sync.
    bookDecisions : [BookDecisionTypes.BookDecision];
    // Special / manual book requests with unified status.
    specialRequests : [BookDecisionTypes.SpecialRequest];
    // Student ID in S00001 format.
    studentId : Text;
    // Timestamp when the request was last updated.
    updatedAt : Common.Timestamp;
    // Admin who processed the request.
    adminId : ?Text;
    // Admin name who processed the request.
    adminName : ?Text;
    // Additional notes from admin during processing.
    requestNotes : ?Text;
  };

  /// Per-book lifecycle record embedded in IssuedBookInfo.
  public type IssuedBookInfo = {
    requestId : Common.RequestId;
    userId : Common.UserId;
    studentName : Text;
    bookId : Common.BookId;
    bookTitle : Text;
    issueDate : Common.Timestamp;
    expectedReturnDate : Common.Timestamp;
    returnDate : ?Common.Timestamp;
    returned : Bool;
    status : Text; // "Issued" | "Returned" | "Overdue"
    bookIds : [Common.BookId];
  };

  /// Return Timeline entry enriched with urgency calculation.
  public type ReturnTimelineEntry = {
    requestId : Common.RequestId;
    studentId : Common.UserId;
    studentName : Text;
    studentCourse : Text;
    bookTitles : [Text];
    issueDate : Common.Timestamp;
    returnDate : ?Common.Timestamp;
    returned : Bool;
    daysUntilReturn : Int;
    nextReservedStudent : ?Text;
    phone : Text;
  };

  /// Shared-safe public view of a BookRequest.
  public type BookRequestPublic = BookRequest;
};
