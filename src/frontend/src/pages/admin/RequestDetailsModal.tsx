import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookDetailItem } from "@/hooks/useBackend";
import {
  useApproveBook,
  useCompleteApproval,
  useGetRequestDetails,
  useRejectBook,
  useReserveBookForRequest,
  useSendNotification,
  useUpdateManualBookStatus,
} from "@/hooks/useBackend";
import type { BookRequest } from "@/types";
import {
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookDecisionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "reserved"
  | "ordered"
  | "purchased"
  | "readyforcollection"
  | "readyForCollection"
  | "ReadyForCollection"
  | "collected"
  | "returned"
  | "issued"
  | "arrived"
  | "specialorder"
  | "SpecialOrder"
  | "Ordered"
  | "Arrived"
  | "Issued"
  | "Returned"
  | "Approved"
  | "Rejected"
  | "Reserved"
  | "Pending"
  | "Purchased";

interface DecisionState {
  [key: string]: BookDecisionStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(val: string | bigint | undefined | null): string {
  if (!val) return "—";
  try {
    const ms =
      typeof val === "bigint"
        ? Number(val) / 1_000_000
        : typeof val === "number"
          ? val
          : Date.parse(val as string);
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function DecisionBadge({ status }: { status: BookDecisionStatus }) {
  const s = typeof status === "string" ? status.toLowerCase() : status;
  if (s === "approved")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs shrink-0">
        ✅ Approved
      </Badge>
    );
  if (s === "rejected")
    return (
      <Badge className="bg-red-100 text-red-700 border-0 text-xs shrink-0">
        ❌ Rejected
      </Badge>
    );
  if (s === "reserved")
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs shrink-0">
        🔖 Reserved
      </Badge>
    );
  if (s === "ordered")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs shrink-0">
        📦 Ordered
      </Badge>
    );
  if (s === "arrived")
    return (
      <Badge className="bg-purple-100 text-purple-700 border-0 text-xs shrink-0">
        📚 Arrived
      </Badge>
    );
  if (s === "readyforcollection" || s === "ready_for_collection")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs shrink-0">
        🎯 Ready for Collection
      </Badge>
    );
  if (s === "collected")
    return (
      <Badge className="bg-teal-100 text-teal-700 border-0 text-xs shrink-0">
        ✔ Collected
      </Badge>
    );
  if (s === "returned")
    return (
      <Badge className="bg-muted text-muted-foreground border-0 text-xs shrink-0">
        ↩️ Returned
      </Badge>
    );
  if (s === "issued")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs shrink-0">
        📗 Issued
      </Badge>
    );
  if (s === "purchased")
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs shrink-0">
        🛍 Purchased
      </Badge>
    );
  if (s === "specialorder")
    return (
      <Badge className="bg-orange-100 text-orange-700 border-0 text-xs shrink-0">
        📋 Special Order
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs shrink-0">
      ⏳ Pending
    </Badge>
  );
}

function normalizeDecision(raw: string | undefined | null): BookDecisionStatus {
  const d = String(raw ?? "").trim().toLowerCase();
  switch (d) {
    case "approved":
    case "accept":
      return "approved";
    case "rejected":
    case "reject":
      return "rejected";
    case "reserved":
    case "acceptreservation":
    case "accept_reservation":
      return "reserved";
    case "ordered":
      return "ordered";
    case "arrived":
    case "reached office":
    case "reachedoffice":
      return "arrived";
    case "readyforcollection":
    case "ready_for_collection":
      return "readyforcollection";
    case "collected":
      return "collected";
    case "returned":
      return "returned";
    case "issued":
      return "issued";
    case "purchased":
      return "purchased";
    case "specialorder":
      return "specialorder";
    default:
      return "pending";
  }
}

// ─── Inventory Book Card ────────────────────────────────────────────────────

function InventoryBookCard({
  book,
  index,
  requestIdx,
  requestId,
  isPending,
  localStatus,
  onDecision,
  mode = "edit",
}: {
  book: BookDetailItem;
  index: number;
  requestIdx: number;
  requestId: string;
  isPending: boolean;
  localStatus: BookDecisionStatus;
  onDecision: (bookId: string, status: BookDecisionStatus) => void;
  mode?: "edit" | "readonly";
}) {
  const approveBook = useApproveBook();
  const rejectBook = useRejectBook();
  const reserveBook = useReserveBookForRequest();
  const [reserveDate, setReserveDate] = useState("");
  const [showReserveInput, setShowReserveInput] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "approve" | "reject" | "reserve" | null
  >(null);

  const isUnavailable =
    book.availabilityStatus.toLowerCase().includes("unavailable") ||
    book.availabilityStatus.toLowerCase().includes("issued") ||
    book.availabilityStatus.toLowerCase().includes("checked out") ||
    book.availabilityStatus.toLowerCase().includes("not available");

  const isDecided = localStatus !== "pending";
  const isReserved = localStatus === "reserved";

  const handleApprove = async () => {
    setLoadingAction("approve");
    const prev = localStatus;
    onDecision(book.bookId, "approved");
    try {
      await approveBook.mutateAsync({ requestId, bookId: book.bookId });
      toast.success(`"${book.title}" approved`);
    } catch (err) {
      onDecision(book.bookId, prev);
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction("reject");
    const prev = localStatus;
    onDecision(book.bookId, "rejected");
    try {
      await rejectBook.mutateAsync({ requestId, bookId: book.bookId });
      toast.success(`"${book.title}" rejected`);
    } catch (err) {
      onDecision(book.bookId, prev);
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReserve = async () => {
    setLoadingAction("reserve");
    const prev = localStatus;
    onDecision(book.bookId, "reserved");
    try {
      await reserveBook.mutateAsync({
        requestId,
        bookId: book.bookId,
        expectedAvailabilityDate: reserveDate || undefined,
      });
      toast.success(`"${book.title}" reserved`);
      setShowReserveInput(false);
    } catch (err) {
      onDecision(book.bookId, prev);
      toast.error(err instanceof Error ? err.message : "Failed to reserve");
    } finally {
      setLoadingAction(null);
    }
  };

  const cardBg = isDecided
    ? localStatus === "approved"
      ? "bg-emerald-50 border-emerald-200"
      : localStatus === "rejected"
        ? "bg-red-50 border-red-200"
        : "bg-indigo-50 border-indigo-200"
    : isUnavailable
      ? "bg-amber-50 border-amber-200"
      : "bg-card border-border";

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-colors ${cardBg}`}
      data-ocid={`admin.requests.book_card.${requestIdx + 1}.${index + 1}`}
    >
      {/* Book info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="font-semibold text-sm text-foreground">
            {book.title}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {book.bookNumber && (
              <span>
                <span className="font-medium text-foreground">Book No:</span>{" "}
                {book.bookNumber}
              </span>
            )}
            {book.author && (
              <span>
                <span className="font-medium text-foreground">Author:</span>{" "}
                {book.author}
              </span>
            )}
            {book.edition && (
              <span>
                <span className="font-medium text-foreground">Edition:</span>{" "}
                {book.edition}
              </span>
            )}
            {book.subject && (
              <span>
                <span className="font-medium text-foreground">Subject:</span>{" "}
                {book.subject}
              </span>
            )}
            {book.publisher && (
              <span>
                <span className="font-medium text-foreground">Publisher:</span>{" "}
                {book.publisher}
              </span>
            )}
          </div>
          {isUnavailable && book.currentHolder && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-amber-700 flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="font-medium">Current Holder:</span>{" "}
                {book.currentHolder}
              </div>
              {book.expectedReturnDate && (
                <div className="text-xs text-amber-700 flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  <span className="font-medium">Expected Return:</span>{" "}
                  {fmtDate(book.expectedReturnDate)}
                </div>
              )}
              {book.queueLength > 0 && (
                <div className="text-xs text-indigo-600 flex items-center gap-1">
                  <span className="font-medium">Queue Position:</span>{" "}
                  {book.queueLength} student{book.queueLength !== 1 ? "s" : ""}{" "}
                  waiting
                </div>
              )}
            </div>
          )}
          {isReserved && book.currentHolder && (
            <div className="mt-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200 space-y-1">
              <div className="text-xs font-semibold text-indigo-700">
                Reservation Details
              </div>
              <div className="text-xs text-indigo-600 flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="font-medium">Current Holder:</span>{" "}
                {book.currentHolder}
              </div>
              {book.expectedReturnDate && (
                <div className="text-xs text-indigo-600 flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  <span className="font-medium">Expected Return:</span>{" "}
                  {fmtDate(book.expectedReturnDate)}
                </div>
              )}
              {book.queueLength > 0 && (
                <div className="text-xs text-indigo-600">
                  <span className="font-medium">Queue Position:</span> #
                  {book.queueLength}
                </div>
              )}
            </div>
          )}
        </div>
        <DecisionBadge status={localStatus} />
      </div>

      {/* Action buttons — only when request is pending */}
      {isPending && mode !== "readonly" && (
        <div className="border-t border-border/60 pt-3">
          {!isDecided && !showReserveInput && (
            <div className="flex gap-2 flex-wrap">
              {!isUnavailable ? (
                <>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={handleApprove}
                    disabled={loadingAction !== null}
                    data-ocid={`admin.requests.book_approve_button.${requestIdx + 1}.${index + 1}`}
                  >
                    {loadingAction === "approve" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                    onClick={handleReject}
                    disabled={loadingAction !== null}
                    data-ocid={`admin.requests.book_reject_button.${requestIdx + 1}.${index + 1}`}
                  >
                    {loadingAction === "reject" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                    onClick={() => setShowReserveInput(true)}
                    disabled={loadingAction !== null}
                    data-ocid={`admin.requests.book_reserve_button.${requestIdx + 1}.${index + 1}`}
                  >
                    <Check className="h-3 w-3" /> Reserve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                    onClick={handleReject}
                    disabled={loadingAction !== null}
                    data-ocid={`admin.requests.book_reject_button.${requestIdx + 1}.${index + 1}`}
                  >
                    {loadingAction === "reject" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Reject
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Reserve date input */}
          {!isDecided && showReserveInput && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                className="h-8 text-xs rounded-md border border-input px-2 flex-1 min-w-0 bg-background"
                value={reserveDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setReserveDate(e.target.value)}
                placeholder="Expected availability date"
                data-ocid={`admin.requests.book_reserve_date.${requestIdx + 1}.${index + 1}`}
              />
              <Button
                size="sm"
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleReserve}
                disabled={loadingAction !== null}
                data-ocid={`admin.requests.book_reserve_confirm.${requestIdx + 1}.${index + 1}`}
              >
                {loadingAction === "reserve" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Confirm Reserve"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setShowReserveInput(false)}
                disabled={loadingAction !== null}
                data-ocid={`admin.requests.book_reserve_cancel.${requestIdx + 1}.${index + 1}`}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Change decision buttons when already decided */}
          {isDecided && (
            <div className="flex gap-2 flex-wrap">
              {localStatus !== "approved" && !isUnavailable && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  onClick={handleApprove}
                  disabled={loadingAction !== null}
                  data-ocid={`admin.requests.book_approve_button.${requestIdx + 1}.${index + 1}`}
                >
                  {loadingAction === "approve" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Approve
                </Button>
              )}
              {localStatus !== "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                  onClick={handleReject}
                  disabled={loadingAction !== null}
                  data-ocid={`admin.requests.book_reject_button.${requestIdx + 1}.${index + 1}`}
                >
                  {loadingAction === "reject" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  Reject
                </Button>
              )}
              <span className="text-xs text-muted-foreground self-center">
                Change decision
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Manual Book Card ─────────────────────────────────────────────────────────

const SPECIAL_REQUEST_LIFECYCLE: {
  key: string;
  label: string;
  icon: string;
}[] = [
  { key: "requested", label: "Requested", icon: "📋" },
  { key: "approved", label: "Approved", icon: "✅" },
  { key: "ordered", label: "Ordered", icon: "📦" },
  { key: "arrived", label: "Arrived", icon: "📚" },
  { key: "readyForCollection", label: "Ready For Collection", icon: "🎯" },
  { key: "issued", label: "Issued", icon: "📗" },
  { key: "returned", label: "Returned", icon: "↩️" },
];

function resolveLifecycleStage(status: BookDecisionStatus | string): number {
  const s = typeof status === "string" ? status.toLowerCase() : status;
  if (s === "returned") return 6;
  if (s === "issued") return 5;
  if (
    s === "readyforcollection" ||
    s === "ready_for_collection" ||
    s === "ready"
  )
    return 4;
  if (s === "arrived") return 3;
  if (s === "ordered") return 2;
  if (s === "approved") return 1;
  return 0; // requested / pending
}

function SpecialRequestLifecycle({
  status,
}: { status: BookDecisionStatus | string }) {
  const activeIdx = resolveLifecycleStage(status);
  return (
    <div className="mt-3 pt-3 border-t border-border/60">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Procurement Lifecycle
      </div>
      <div className="flex items-center gap-0">
        {SPECIAL_REQUEST_LIFECYCLE.map((stage, i) => (
          <div key={stage.key} className="flex items-center">
            <div
              className={`flex flex-col items-center ${
                i <= activeIdx ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  i < activeIdx
                    ? "bg-emerald-500 text-white"
                    : i === activeIdx
                      ? "bg-sky-600 text-white ring-2 ring-sky-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < activeIdx ? "✓" : stage.icon.slice(0, 1)}
              </div>
              <span
                className={`text-[9px] mt-0.5 text-center leading-tight max-w-[40px] ${
                  i === activeIdx
                    ? "font-semibold text-sky-700"
                    : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < SPECIAL_REQUEST_LIFECYCLE.length - 1 && (
              <div
                className={`h-[2px] w-3 mx-0.5 mb-4 ${
                  i < activeIdx ? "bg-emerald-400" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ManualBookCard({
  book,
  index,
  requestIdx,
  requestId,
  studentId,
  isPending,
  localStatus,
  onDecision,
  mode = "edit",
}: {
  book: {
    title: string;
    author?: string;
    edition?: string;
    publisher?: string;
  };
  index: number;
  requestIdx: number;
  requestId: string;
  studentId: string;
  isPending: boolean;
  localStatus: BookDecisionStatus;
  onDecision: (key: string, status: BookDecisionStatus) => void;
  mode?: "edit" | "readonly";
}) {
  const updateManualBookStatus = useUpdateManualBookStatus();
  const sendNotification = useSendNotification();
  const [loadingAction, setLoadingAction] = useState<
    "approve" | "reject" | "buy" | "status" | null
  >(null);

  const key = `manual_${index}`;
  const isDecided = localStatus !== "pending";

  // For manual books, we use the index-based key since they have no real inventory ID
  const bookId = `manual:${index}:${book.title}`;

  const SPECIAL_REQUEST_STATUS_OPTIONS: { value: BookDecisionStatus; label: string }[] = [
    { value: "pending", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "ordered", label: "Ordered" },
    { value: "arrived", label: "Reached Office" },
    { value: "readyforcollection", label: "Ready For Collection" },
    { value: "issued", label: "Collected By Student" },
    { value: "returned", label: "Returned" },
  ];

  const handleApprove = async () => {
    setLoadingAction("approve");
    const prev = localStatus;
    onDecision(key, "approved");
    try {
      await updateManualBookStatus.mutateAsync({
        requestId,
        bookTitle: bookId,
        newStatus: "approved",
      });
      toast.success(`"${book.title}" marked as approved`);
    } catch (err) {
      onDecision(key, prev);
      toast.error(
        err instanceof Error ? err.message : `Failed to mark "${book.title}" approved`,
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction("reject");
    const prev = localStatus;
    onDecision(key, "rejected");
    try {
      await updateManualBookStatus.mutateAsync({
        requestId,
        bookTitle: bookId,
        newStatus: "rejected",
      });
      toast.success(`"${book.title}" marked as rejected`);
    } catch (err) {
      onDecision(key, prev);
      toast.error(
        err instanceof Error ? err.message : `Failed to mark "${book.title}" rejected`,
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBuy = async () => {
    setLoadingAction("buy");
    const prev = localStatus;
    onDecision(key, "ordered");
    try {
      await updateManualBookStatus.mutateAsync({
        requestId,
        bookTitle: bookId,
        newStatus: "ordered",
      });
      await sendNotification.mutateAsync({
        userId: studentId,
        eventType: "procurement_needed",
        channels: ["website"],
        data: {
          title: "Special request purchased",
          message: `Your special request for "${book.title}" has been ordered and is being processed.`,
        },
      });
      toast.success(`"${book.title}" marked as purchased`);
    } catch (err) {
      onDecision(key, prev);
      toast.error(err instanceof Error ? err.message : "Failed to mark as purchased");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStatusChange = async (newStatus: BookDecisionStatus) => {
    setLoadingAction("status");
    const prev = localStatus;
    onDecision(key, newStatus);
    try {
      await updateManualBookStatus.mutateAsync({
        requestId,
        bookTitle: bookId,
        newStatus,
      });
      toast.success(`"${book.title}" updated to ${newStatus}`);
    } catch (err) {
      onDecision(key, prev);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoadingAction(null);
    }
  };

  const cardBg = isDecided
    ? localStatus === "approved"
      ? "bg-emerald-50 border-emerald-200"
      : "bg-red-50 border-red-200"
    : "bg-orange-50 border-orange-200";

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-colors ${cardBg}`}
      data-ocid={`admin.requests.manual_book_card.${requestIdx + 1}.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="font-semibold text-sm text-foreground">
            {book.title}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {book.author && (
              <span>
                <span className="font-medium text-foreground">Author:</span>{" "}
                {book.author}
              </span>
            )}
            {book.edition && (
              <span>
                <span className="font-medium text-foreground">Edition:</span>{" "}
                {book.edition}
              </span>
            )}
            {book.publisher && (
              <span>
                <span className="font-medium text-foreground">Publisher:</span>{" "}
                {book.publisher}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {!isDecided && (
              <Badge className="bg-orange-100 text-orange-700 text-xs border-0 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Special Request
              </Badge>
            )}
            {isDecided && localStatus === "approved" && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">
                📦 Procurement Created
              </Badge>
            )}
          </div>
        </div>
        <DecisionBadge status={localStatus} />
      </div>
      <SpecialRequestLifecycle status={localStatus} />

      {isPending && mode !== "readonly" && (
        <div className="border-t border-border/60 pt-3">
          <div className="flex gap-2 flex-wrap">
            {localStatus !== "approved" && localStatus !== "ordered" && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApprove}
                disabled={loadingAction !== null}
                data-ocid={`admin.requests.manual_book_approve_button.${requestIdx + 1}.${index + 1}`}
              >
                {loadingAction === "approve" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Approve
              </Button>
            )}
            {localStatus !== "rejected" && localStatus !== "ordered" && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-sky-600 hover:bg-sky-700 text-white"
                onClick={handleBuy}
                disabled={loadingAction !== null}
                data-ocid={`admin.requests.manual_book_buy_button.${requestIdx + 1}.${index + 1}`}
              >
                {loadingAction === "buy" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3 w-3" />
                )}
                Buy
              </Button>
            )}
            {localStatus !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50 gap-1"
                onClick={handleReject}
                disabled={loadingAction !== null}
                data-ocid={`admin.requests.manual_book_reject_button.${requestIdx + 1}.${index + 1}`}
              >
                {loadingAction === "reject" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                Reject
              </Button>
            )}
            {isDecided && (
              <span className="text-xs text-muted-foreground self-center">
                Change decision
              </span>
            )}
          </div>
          {localStatus !== "rejected" && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground">
                Procurement lifecycle
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                  value={localStatus}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as BookDecisionStatus)
                  }
                  disabled={loadingAction !== null}
                  data-ocid={`admin.requests.manual_book_lifecycle_dropdown.${requestIdx + 1}.${index + 1}`}
                >
                  {SPECIAL_REQUEST_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {loadingAction === "status" && (
                  <span className="text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export interface RequestDetailsModalProps {
  request: BookRequest;
  open: boolean;
  onClose: () => void;
  onFinalized?: () => void;
  requestIdx?: number;
  mode?: "edit" | "readonly";
}

export function RequestDetailsModal({
  request,
  open,
  onClose,
  onFinalized,
  requestIdx = 0,
  mode = "edit",
}: RequestDetailsModalProps) {
  const { data: details, isLoading: detailsLoading } = useGetRequestDetails(
    open ? request.requestId : "",
  );
  const completeApproval = useCompleteApproval();
  const loadedRequest = details?.request ?? request;
  const bookDetails = details?.books;

  const today = new Date().toISOString().split("T")[0];
  const [collectionDate, setCollectionDate] = useState(today);
  const [collectionTime, setCollectionTime] = useState("10:00");
  const [collectionLocation, setCollectionLocation] = useState(
    "SVGA Book Bank Office",
  );
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Local per-book decision state — gives instant visual feedback
  const [decisions, setDecisions] = useState<DecisionState>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize local decision state from backend data
  useEffect(() => {
    const init: DecisionState = {};
    if (bookDetails) {
      for (const b of bookDetails) {
        init[b.bookId] = normalizeDecision(b.decision);
      }
    }
    if (loadedRequest.requestedBooks?.length) {
      loadedRequest.requestedBooks.forEach((book, i) => {
        init[`manual_${i}`] = normalizeDecision(book.decision);
      });
    }
    setDecisions(init);
  }, [bookDetails, loadedRequest.requestedBooks]);

  // Scroll lock when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setFinalized(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !finalizing) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finalizing, onClose]);

  if (!open) return null;

  const isPending =
    loadedRequest.status === "Pending" || loadedRequest.status === "Approved";
  const isCompleted =
    loadedRequest.status === "Returned" ||
    loadedRequest.status === "Procured" ||
    finalized;

  const canSubmit =
    !isCompleted &&
    collectionDate.trim() !== "" &&
    collectionTime.trim() !== "" &&
    collectionLocation.trim() !== "";

  const handleDecision = (key: string, status: BookDecisionStatus) => {
    setDecisions((prev) => ({ ...prev, [key]: status }));
  };

  const handleFinalSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    // Validate all inventory books have a decision
    const inventoryPending = bookDetails?.some(
      (b) => (decisions[b.bookId] ?? "pending") === "pending",
    );
    // Validate all manual/special books have a decision
    const manualPending = loadedRequest.requestedBooks.some((_, i) => {
      const s = decisions[`manual_${i}`] ?? "pending";
      return s === "pending" || s === "Pending";
    });
    if (inventoryPending || manualPending) {
      setSubmitError(
        "Please approve or reject all requested books before submitting.",
      );
      return;
    }
    setFinalizing(true);
    try {
      await completeApproval.mutateAsync({
        requestId: request.requestId,
        collectionDate,
        collectionTime,
        collectionLocation: collectionLocation.trim(),
        adminName: "Admin",
      });
      setFinalized(true);
      toast.success("Request finalized! Challan generated.");
      setTimeout(() => {
        onFinalized?.();
        onClose();
      }, 2000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to finalize request",
      );
    } finally {
      setFinalizing(false);
    }
  };

  const getRequestNumber = (id: string) => `REQ-${id.slice(-6).toUpperCase()}`;

  const formatDateStr = (ts: string | bigint | undefined) => fmtDate(ts);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pb-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !finalizing) onClose();
      }}
      onKeyDown={(e) => {
        if (
          e.target === e.currentTarget &&
          (e.key === "Enter" || e.key === " ")
        )
          onClose();
      }}
      data-ocid="admin.requests.modal"
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        data-ocid="admin.requests.modal_panel"
      >
        {/* ── Modal Header ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-sky-700 to-sky-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium opacity-75 uppercase tracking-wider mb-0.5">
                SVGA Book Bank
              </div>
              <h2 className="text-xl font-bold font-display">
                Book Request Challan
              </h2>
              <div className="text-sm opacity-90 mt-0.5 font-mono">
                {getRequestNumber(loadedRequest.requestId)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => !finalizing && onClose()}
              className="mt-1 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Close modal"
              data-ocid="admin.requests.close_button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable content ───────────────────────────── */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] divide-y divide-border">
          {/* ── Section A: Student Details ───────────────── */}
          <section className="px-6 py-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-sky-600" /> Student Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">
                  Student Name
                </div>
                <div className="font-semibold text-foreground">
                  {loadedRequest.studentName || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Student ID</div>
                <div className="font-mono font-semibold text-sky-700">
                  {loadedRequest.studentId || loadedRequest.userId?.slice(0, 10) || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Mobile Number
                </div>
                <div className="font-medium">{loadedRequest.studentPhone || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email Address
                </div>
                <div className="font-medium break-all">
                  {loadedRequest.studentEmail || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Course
                </div>
                <div className="font-medium">
                  {loadedRequest.studentCourse || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" /> Year / Standard
                </div>
                <div className="font-medium">{loadedRequest.studentYear || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Request Number
                </div>
                <div className="font-mono text-sky-700 font-semibold">
                  {getRequestNumber(loadedRequest.requestId)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Request Date
                </div>
                <div className="font-medium">
                  {formatDateStr(loadedRequest.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      loadedRequest.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : loadedRequest.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : loadedRequest.status === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {loadedRequest.status}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section B: Books Requested ───────────────── */}
          <section className="px-6 py-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-600" /> Library Books
              {bookDetails && bookDetails.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({bookDetails.length} book
                  {bookDetails.length !== 1 ? "s" : ""})
                </span>
              )}
            </h3>

            {detailsLoading ? (
              <div
                className="space-y-3"
                data-ocid="admin.requests.books_loading_state"
              >
                {[1, 2].map((n) => (
                  <Skeleton key={n} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : bookDetails && bookDetails.length > 0 ? (
              <div className="space-y-3">
                {bookDetails.map((book, i) => (
                  <InventoryBookCard
                    key={book.bookId}
                    book={book}
                    index={i}
                    requestIdx={requestIdx}
                    requestId={request.requestId}
                    isPending={isPending}
                    localStatus={decisions[book.bookId] ?? "pending"}
                    onDecision={handleDecision}
                    mode={mode}
                  />
                ))}
              </div>
            ) : !detailsLoading &&
              bookDetails !== undefined &&
              bookDetails.length === 0 &&
              (request.selectedBookIds?.length ?? 0) === 0 ? (
              <div
                className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4 text-center"
                data-ocid="admin.requests.books_empty_state"
              >
                No library books in this request.
              </div>
            ) : null}
          </section>

          {/* ── Section C: Manual Book Requests ──────────── */}
          {loadedRequest.requestedBooks.length > 0 && (
            <section className="px-6 py-5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" /> Special Book
                Requests
                <span className="text-xs text-muted-foreground font-normal">
                  ({loadedRequest.requestedBooks.length}) — not in inventory
                </span>
              </h3>
              <div className="space-y-3">
                {loadedRequest.requestedBooks.map((book, i) => (
                  <ManualBookCard
                    key={`manual-${book.title}-${i}`}
                    book={book}
                    index={i}
                    requestIdx={requestIdx}
                    requestId={loadedRequest.requestId}
                    studentId={loadedRequest.studentId}
                    isPending={isPending}
                    localStatus={decisions[`manual_${i}`] ?? "pending"}
                    onDecision={handleDecision}
                    mode={mode}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Section D: Collection Details ────────────── */}
          <section className="px-6 py-5 bg-sky-50/60">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-sky-600" /> Collection
              Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-collection-date"
                  className="text-sm font-medium"
                >
                  Collection Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-collection-date"
                  type="date"
                  value={collectionDate}
                  min={today}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  disabled={isCompleted}
                  className="bg-background"
                  data-ocid="admin.requests.collection_date_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-collection-time"
                  className="text-sm font-medium"
                >
                  Collection Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-collection-time"
                  type="time"
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value)}
                  disabled={isCompleted}
                  className="bg-background"
                  data-ocid="admin.requests.collection_time_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="modal-collection-location"
                  className="text-sm font-medium"
                >
                  Collection Location{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-collection-location"
                    type="text"
                    value={collectionLocation}
                    onChange={(e) => setCollectionLocation(e.target.value)}
                    placeholder="SVGA Book Bank Office"
                    className="pl-9 bg-background"
                    disabled={isCompleted}
                    data-ocid="admin.requests.collection_location_input"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-500" />
              Only approved books will be included in collection.
            </p>
          </section>
        </div>

        {/* ── Section E: Final Submit ───────────────────── */}
        {mode !== "readonly" && (
          <div className="px-6 py-4 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {finalized ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Request finalized!
                  Challan generated.
                </span>
              ) : isCompleted ? (
                <span>This request has already been completed.</span>
              ) : (
                <span>
                  Review books above, then fill collection details and click
                  Final Submit.
                </span>
              )}
            </div>
            {submitError && (
              <div className="text-red-600 text-sm mt-1 text-right">
                {submitError}
              </div>
            )}
            <Button
              type="button"
              size="lg"
              className="bg-sky-700 hover:bg-sky-800 text-white font-bold px-8 gap-2 min-w-[180px]"
              onClick={handleFinalSubmit}
              disabled={!canSubmit || finalizing || finalized}
              data-ocid="admin.requests.final_submit_button"
            >
              {finalizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : finalized ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Finalized!
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  FINAL SUBMIT
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestDetailsModal;
