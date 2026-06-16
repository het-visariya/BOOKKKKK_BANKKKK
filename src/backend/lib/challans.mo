import Map "mo:core/Map";
import ChallanTypes "../types/challan";
import ReservationTypes "../types/reservation";
import ProcurementTypes "../types/procurement";
import Common "../types/common";
import Int "mo:core/Int";

module {
  public func generateChallanId(counter : Nat) : Common.ChallanId {
    "CHAL" # counter.toText();
  };

  /// Create a new challan record.
  /// Create a new challan record.
  public func createChallan(
    challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
    challanId : Common.ChallanId,
    challanNumber : Text,
    requestNumber : Common.RequestId,
    adminName : Text,
    studentId : Common.UserId,
    studentName : Text,
    studentEmail : Text,
    studentPhone : Text,
    studentCourse : Text,
    issuedBookIds : [Common.BookId],
    approvedBooks : [ChallanTypes.ChallanBookEntry],
    rejectedBooks : [ChallanTypes.ChallanBookEntry],
    reservedBooks : [ChallanTypes.ChallanBookEntry],
    reservations : [ReservationTypes.Reservation],
    procurementRequests : [ProcurementTypes.ProcurementRequest],
    expectedDates : [ChallanTypes.BookAvailabilityDate],
    availabilityDates : [ChallanTypes.BookAvailabilityDate],
    totalAmount : Nat,
    now : Common.Timestamp,
  ) : ChallanTypes.Challan {
    let challan : ChallanTypes.Challan = {
      challanId;
      challanNumber;
      requestNumber;
      adminName;
      generatedAt = now;
      studentId;
      studentName;
      studentEmail;
      studentPhone;
      studentCourse;
      issuedBookIds;
      approvedBooks;
      rejectedBooks;
      reservedBooks;
      reservations;
      procurementRequests;
      expectedDates;
      availabilityDates;
      totalAmount;
      createdAt = now;
      status = "Active";
      bookDecisions = [];
      studentYear = "";
      manualBooks = [];
      orderedBooks = [];
      arrivedBooks = [];
      readyForCollectionBooks = [];
      issuedBooks = [];
      returnedBooks = [];
      specialRequests = [];
      collectionDate = "";
      collectionTime = "";
      collectionOrderNumber = "";
      qrCodeUrl = "";
      pdfUrl = null;
      qrCodeData = null;
      signatureAdmin = null;
      signatureStudent = null;
      trackedBookIds = issuedBookIds;
      trackingEvents = [];
    };
    challans.add(challanId, challan);
    challan;
  };

  /// Get a single challan by ID.
  public func getChallan(
    challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
    id : Common.ChallanId,
  ) : ?ChallanTypes.Challan {
    challans.get(id);
  };

  /// Get all challans for a specific student.
  public func getChallansForStudent(
    challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
    studentId : Common.UserId,
  ) : [ChallanTypes.Challan] {
    challans.values()
      .filter(func(c) { c.studentId == studentId })
      .toArray();
  };

  /// Update challan status.
  public func updateChallanStatus(
    challans : Map.Map<Common.ChallanId, ChallanTypes.Challan>,
    challanId : Common.ChallanId,
    status : Text,
  ) : Bool {
    switch (challans.get(challanId)) {
      case null { false };
      case (?c) {
        challans.add(challanId, { c with status });
        true;
      };
    };
  };
};
