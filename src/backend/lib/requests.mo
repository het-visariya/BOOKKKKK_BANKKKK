import Map "mo:core/Map";
import Types "../types/request";
import Common "../types/common";

module {
  // Generate a unique request ID
  public func generateRequestId(counter : Nat) : Common.RequestId {
    "REQ" # counter.toText();
  };

  // Create a new book request with denormalized student fields
  public func create(
    requestId : Common.RequestId,
    userId : Common.UserId,
    selectedBookIds : [Common.BookId],
    requestedBooks : [Types.RequestedBookPublic],
    now : Common.Timestamp,
    studentName : Text,
    studentPhone : Text,
    studentCourse : Text,
    studentAadhaar : Text,
    studentEmail : Text,
    studentYear : Text,
  ) : Types.BookRequest {
    // Initialize bookApprovals array with all selected books set to "Pending"
    let bookApprovals : [(Common.BookId, Text)] = selectedBookIds.map<Common.BookId, (Common.BookId, Text)>(func(bid) { (bid, "Pending") });
    let requestNumber = "REQ-" # requestId;
    {
      requestId;
      userId;
      selectedBookIds;
      requestedBooks;
      status = "Pending";
      challanData = "";
      challanId = null;
      createdAt = now;
      issueDate = null;
      returnDate = null;
      returned = false;
      studentName;
      studentPhone;
      studentCourse;
      studentAadhaar;
      studentEmail;
      studentYear;
      requestNumber;
      collectionDate = "";
      collectionTime = "";
      collectionLocation = "";
      collectionOrderId = null;
      bookApprovals;
      bookDecisions = [];
      specialRequests = [];
      studentId = userId;
      updatedAt = now;
      adminId = null;
      adminName = null;
      requestNotes = null;
    };
  };

  // Generate challan text data for a request
  public func buildChallanData(
    request : Types.BookRequest,
    studentName : Text,
    studentId : Common.UserId,
  ) : Text {
    var lines = "{";
    lines #= "\"requestNumber\":\"" # request.requestId # "\",";
    lines #= "\"studentId\":\"" # studentId # "\",";
    lines #= "\"studentName\":\"" # studentName # "\",";
    lines #= "\"date\":\"" # request.createdAt.toText() # "\",";
    lines #= "\"selectedBookIds\":" # debug_show(request.selectedBookIds) # ",";
    lines #= "\"requestedBooks\":" # debug_show(request.requestedBooks) # ",";
    lines #= "\"bookApprovals\":" # debug_show(request.bookApprovals);
    lines #= "}";
    lines;
  };


  // Update per-book approval status within a request
  public func updateBookApproval(
    request : Types.BookRequest,
    bookId : Common.BookId,
    approvalStatus : Text,
  ) : Types.BookRequest {
    let newApprovals = request.bookApprovals.map(
      func((bid, status)) {
        if (bid == bookId) { (bid, approvalStatus) } else { (bid, status) }
      }
    );
    { request with bookApprovals = newApprovals };
  };

  // Update request status
  public func withStatus(
    request : Types.BookRequest,
    status : Text,
  ) : Types.BookRequest {
    { request with status };
  };

  // Get requests for a specific user
  public func forUser(
    requests : Map.Map<Common.RequestId, Types.BookRequest>,
    userId : Common.UserId,
  ) : [Types.BookRequest] {
    requests.values()
      .filter(func(r) { r.userId == userId })
      .toArray();
  };
};
