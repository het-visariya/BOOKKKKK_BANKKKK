import Map "mo:core/Map";
import TransferTypes "../types/transfer";
import RequestTypes "../types/request";
import Common "../types/common";
import Int "mo:core/Int";

module {
  public func generateTransferId(counter : Nat) : Common.TransferId {
    "TRANS" # counter.toText();
  };

  /// Get all transfers for a specific book.
  public func getTransfersForBook(
    transfers : Map.Map<Common.TransferId, TransferTypes.Transfer>,
    bookId : Common.BookId,
  ) : [TransferTypes.Transfer] {
    transfers.values()
      .filter(func(t) { t.bookId == bookId })
      .toArray();
  };

  /// Get all transfers (history), sorted by most recent first.
  public func getTransferHistory(
    transfers : Map.Map<Common.TransferId, TransferTypes.Transfer>,
  ) : [TransferTypes.Transfer] {
    let arr = transfers.values().toArray();
    arr.sort(func(a, b) { Int.compare(b.transferDate, a.transferDate) });
  };

  /// Find the active (non-returned) request for a student+book combination.
  public func findActiveRequestForStudentBook(
    requests : Map.Map<Common.RequestId, RequestTypes.BookRequest>,
    studentId : Common.UserId,
    bookId : Common.BookId,
  ) : ?RequestTypes.BookRequest {
    requests.values().find(func(r) {
      r.userId == studentId and
      not r.returned and
      (r.status == "Approved" or r.status == "Procured") and
      r.selectedBookIds.find(func(bid) { bid == bookId }) != null
    });
  };
};
