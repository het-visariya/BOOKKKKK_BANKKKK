import { StudentLayout } from "@/components/layout/StudentLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useStudentAuth } from "@/hooks/useAuth";
import {
  useGetBookById,
  useGetCollectionOrderForRequest,
  useGetMyProcurements,
  useGetMyReservations,
  useMyRequests,
} from "@/hooks/useBackend";
import type {
  BookApproval,
  BookRequest,
  CollectionOrder,
  ProcurementRequest,
  Reservation,
} from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardList,
  Clock,
  Eye,
  GraduationCap,
  Hash,
  MapPin,
  Package,
  Phone,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

// ─── Shared status badge config (mirrors ChallanPage) ────────────────────────
const BOOK_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  Approved: {
    label: "✅ Approved",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Rejected: {
    label: "❌ Rejected",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  Reserved: {
    label: "⏳ Reserved",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Pending: {
    label: "🕐 Pending",
    classes: "bg-muted text-muted-foreground border-border",
  },
  SpecialOrder: {
    label: "📚 Special Order",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
  Ordered: {
    label: "📦 Ordered",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Procured: {
    label: "📚 Procured",
    classes: "bg-teal-50 text-teal-700 border-teal-200",
  },
  ReadyForCollection: {
    label: "🎯 Ready For Collection",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Issued: {
    label: "📗 Issued",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  Returned: {
    label: "↩️ Returned",
    classes: "bg-muted text-muted-foreground border-border",
  },
};

function InlineBadge({ status }: { status: string }) {
  const cfg = BOOK_STATUS_CONFIG[status] ?? BOOK_STATUS_CONFIG.Pending;
  return (
    <span
      className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Full book card (read-only, student view) ─────────────────────────────────
function ChallanBookCard({
  title,
  author,
  edition,
  publisher,
  bookNumber,
  status,
  expectedReturnDate,
  currentHolder,
  reason,
  index,
  ocid,
}: {
  title: string;
  author?: string;
  edition?: string;
  publisher?: string;
  bookNumber?: string;
  status: string;
  expectedReturnDate?: string;
  currentHolder?: string;
  reason?: string;
  index: number;
  ocid: string;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
      data-ocid={ocid}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-snug">
          {title}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
          {author && author !== "—" && <span>Author: {author}</span>}
          {edition && edition !== "—" && <span>Edition: {edition}</span>}
          {publisher && publisher !== "—" && publisher !== "null" && (
            <span>Publisher: {publisher}</span>
          )}
          {bookNumber && (
            <span className="font-mono">Book No: {bookNumber}</span>
          )}
        </div>
        {status === "Reserved" && (
          <div className="mt-2 text-xs text-amber-700 space-y-0.5">
            {currentHolder && (
              <p>
                Current Holder:{" "}
                <span className="font-medium">{currentHolder}</span>
              </p>
            )}
            {expectedReturnDate && (
              <p>
                Expected Return:{" "}
                <span className="font-medium">
                  {new Date(expectedReturnDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
        )}
        {status === "Rejected" && reason && (
          <p className="mt-1 text-xs text-red-600">Reason: {reason}</p>
        )}
      </div>
      <InlineBadge status={status} />
    </div>
  );
}

// ─── Library book row — fetches details by ID ─────────────────────────────────
function LibraryBookRow({
  bookId,
  index,
  approval,
  collectionDecision,
}: {
  bookId: string;
  index: number;
  approval?: BookApproval;
  collectionDecision?: CollectionOrder["bookDecisions"][number];
}) {
  const { data: book } = useGetBookById(bookId);
  const status = collectionDecision
    ? collectionDecision.decision
    : approval?.action === "Accept"
      ? "Approved"
      : approval?.action === "Reject"
        ? "Rejected"
        : approval?.action === "AcceptReservation"
          ? "Reserved"
          : approval?.action === "RejectReservation"
            ? "Rejected"
            : "Pending";
  return (
    <ChallanBookCard
      title={book?.title ?? collectionDecision?.bookName ?? bookId}
      author={book?.author}
      edition={book?.edition}
      bookNumber={collectionDecision?.bookNumber ?? book?.bookId}
      status={status}
      expectedReturnDate={
        collectionDecision?.expectedReturnDate ?? approval?.expectedDate
      }
      currentHolder={collectionDecision?.currentHolder}
      reason={collectionDecision?.reason}
      index={index}
      ocid={`request.library_book.${index + 1}`}
    />
  );
}

const PROCUREMENT_STATUS_STEPS: Array<{
  key: ProcurementRequest["status"];
  label: string;
}> = [
  { key: "Pending", label: "Pending Procurement" },
  { key: "Ordered", label: "Ordered" },
  { key: "Procured", label: "Procured" },
  { key: "ReadyForCollection", label: "Ready for Collection" },
  { key: "Issued", label: "Issued" },
];

const PROCUREMENT_STATUS_LABEL: Record<ProcurementRequest["status"], string> = {
  Pending: "Pending Procurement",
  Ordered: "Ordered",
  Procured: "Procured",
  ReadyForCollection: "Ready for Collection",
  Issued: "Issued",
  Approved: "Approved",
  Returned: "Returned",
  Arrived: "Arrived",
  Cancelled: "Cancelled",
};

type StatusFilter =
  | "All"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Procured"
  | "Returned";
const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "Pending",
  "Approved",
  "Procured",
  "Returned",
  "Rejected",
];

function normalizeManualDecision(raw?: string | null) {
  const status = String(raw ?? "").trim().toLowerCase();
  switch (status) {
    case "requested":
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "reserved":
    case "acceptreservation":
    case "accept_reservation":
      return "Reserved";
    case "ordered":
      return "Ordered";
    case "procured":
      return "Procured";
    case "arrived":
    case "reached office":
    case "reachedoffice":
      return "Arrived";
    case "readyforcollection":
    case "ready_for_collection":
      return "ReadyForCollection";
    case "issued":
    case "collected":
      return "Issued";
    case "returned":
      return "Returned";
    case "specialorder":
      return "SpecialOrder";
    default:
      return String(raw ?? "Pending");
  }
}

function ApprovedDeadlineInfo({ createdAt }: { createdAt: string }) {
  const issued = new Date(createdAt);
  const deadline = new Date(issued);
  deadline.setDate(deadline.getDate() + 90);
  const today = new Date();
  const daysLeft = Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 14;
  return (
    <div
      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
        isOverdue
          ? "bg-red-50 text-red-700 border border-red-200"
          : isUrgent
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      }`}
    >
      <Calendar className="h-3 w-3 shrink-0" />
      {isOverdue
        ? `Overdue by ${Math.abs(daysLeft)} day(s)`
        : `Return by ${deadline.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })} · ${daysLeft}d left`}
    </div>
  );
}

// ─── Full Challan View (inside expanded request card) ─────────────────────────
function FullChallanView({
  req,
  myProcurements,
}: { req: BookRequest; myProcurements: ProcurementRequest[] }) {
  const { currentUser: user } = useStudentAuth();
  const { data: collectionOrder } = useGetCollectionOrderForRequest(
    req.requestId,
  );
  const decisions = collectionOrder?.bookDecisions ?? [];

  // Format dates for display
  const dateStr = new Date(req.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const inventoryDecisions = decisions.filter(
    (d) => d.inventoryId && String(d.inventoryId).trim() !== "",
  );
  const manualDecisions = decisions.filter(
    (d) => !d.inventoryId || String(d.bookId).startsWith("manual_"),
  );

  const requestManualTitles = new Set(
    req.requestedBooks.map((b) => b.title.toLowerCase().trim()),
  );
  const matchedProcurements = myProcurements.filter((p) =>
    requestManualTitles.has(p.bookTitle.toLowerCase().trim()),
  );

  const manualBooksWithStatus = req.requestedBooks.map((b) => {
    const matchedDecision = manualDecisions.find(
      (d) =>
        String(d.bookName ?? "").toLowerCase().trim() ===
        b.title.toLowerCase().trim(),
    );
    const matched = matchedProcurements.find(
      (p) => p.bookTitle.toLowerCase().trim() === b.title.toLowerCase().trim(),
    );
    const directDecision = normalizeManualDecision(b.decision);

    const status: string = matchedDecision
      ? normalizeManualDecision(String(matchedDecision.decision))
      : matched
        ? matched.status === "Procured"
          ? "Procured"
          : matched.status === "Ordered"
            ? "Ordered"
            : matched.status === "ReadyForCollection"
              ? "ReadyForCollection"
              : matched.status === "Issued"
                ? "Issued"
                : matched.status === "Cancelled"
                  ? "Rejected"
                  : "Pending"
        : directDecision || "Pending";
    return { book: b, status };
  });

  const decisionsForDisplay = inventoryDecisions.filter(
    (d) => d.decision !== "SpecialOrder",
  );
  const useDecisions = decisionsForDisplay.length > 0;

  return (
    <div
      className="mt-4 pt-4 border-t border-border space-y-6"
      data-ocid={`request.challan_view.${req.requestId.slice(-6)}`}
    >
      {/* ── 1. Student Details ── */}
      <div className="rounded-xl bg-[#f0f9ff] border border-[#bae6fd] p-4">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          Student Details
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Hash className="h-3 w-3" />
              <p className="text-xs">Student ID</p>
            </div>
            <p className="font-mono font-bold text-primary">
              {user?.studentId ?? req.studentId ?? "—"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground mb-0.5">Name</p>
            <p className="font-semibold text-foreground">
              {req.studentName || user?.name || "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Phone className="h-3 w-3" />
              <p className="text-xs">Phone</p>
            </div>
            <p className="text-foreground text-xs">
              {user?.phone ?? req.studentPhone ?? "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <GraduationCap className="h-3 w-3" />
              <p className="text-xs">Course</p>
            </div>
            <p className="font-medium text-foreground">
              {req.studentCourse || user?.course || "—"}
            </p>
          </div>
          {user?.college && (
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                <Building2 className="h-3 w-3" />
                <p className="text-xs">College</p>
              </div>
              <p className="font-medium text-foreground">{user.college}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Library Books ── */}
      {req.selectedBookIds.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              Library Books
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              {req.selectedBookIds.length} book(s)
            </span>
          </div>
          <div className="space-y-2">
            {useDecisions
              ? decisionsForDisplay.map((d, i) => (
                  <ChallanBookCard
                    key={`${d.bookId}-${i}`}
                    title={d.bookName}
                    bookNumber={d.bookNumber}
                    status={d.decision}
                    expectedReturnDate={d.expectedReturnDate}
                    currentHolder={d.currentHolder}
                    reason={d.reason}
                    index={i}
                    ocid={`request.library_book.${i + 1}`}
                  />
                ))
              : req.selectedBookIds.map((id, i) => (
                  <LibraryBookRow
                    key={id}
                    bookId={id}
                    index={i}
                    approval={(req.bookApprovals ?? []).find(
                      (a: BookApproval) => a.bookId === id,
                    )}
                    collectionDecision={undefined}
                  />
                ))}
          </div>
        </div>
      )}

      {/* ── 3. Manual Books ── */}
      {manualBooksWithStatus.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-foreground">
              Manual Books
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              {manualBooksWithStatus.length} request(s)
            </span>
          </div>
          <div className="space-y-2">
            {manualBooksWithStatus.map(({ book, status }, i) => (
              <ChallanBookCard
                key={`${book.title}-${i}`}
                title={book.title}
                author={book.author}
                edition={book.edition}
                publisher={book.publisher}
                status={status}
                index={i}
                ocid={`request.manual_book.${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Collection Details ── */}
      {collectionOrder && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" /> Collection Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {collectionOrder.collectionDate && (
              <div>
                <p className="text-xs text-teal-700 mb-0.5">Collection Date</p>
                <p className="font-semibold text-teal-900">
                  {new Date(collectionOrder.collectionDate).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "long", year: "numeric" },
                  )}
                </p>
              </div>
            )}
            {collectionOrder.collectionTime && (
              <div>
                <p className="text-xs text-teal-700 mb-0.5">Collection Time</p>
                <p className="font-semibold text-teal-900">
                  {collectionOrder.collectionTime}
                </p>
              </div>
            )}
            {collectionOrder.collectionLocation && (
              <div>
                <div className="flex items-center gap-1 text-teal-700 mb-0.5">
                  <MapPin className="h-3 w-3" />
                  <p className="text-xs">Location</p>
                </div>
                <p className="font-semibold text-teal-900">
                  {collectionOrder.collectionLocation}
                </p>
              </div>
            )}
          </div>
          {collectionOrder.orderNumber && (
            <p className="text-xs text-teal-600 mt-2">
              Order No:{" "}
              <span className="font-mono font-semibold">
                {collectionOrder.orderNumber}
              </span>
            </p>
          )}
        </div>
      )}

      {/* ── 5. Status History ── */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" /> Status History
        </p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                Request Submitted
              </p>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
          </div>
          {(req.status === "Approved" || req.status === "Procured") && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Status: {req.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  Books ready for collection
                </p>
              </div>
            </div>
          )}
          {req.status === "Rejected" && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Circle className="h-3 w-3 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Request Rejected
                </p>
              </div>
            </div>
          )}
          {req.status === "Returned" && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Books Returned
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />
    </div>
  );
}

function RequestCard({
  req,
  index,
  myProcurements,
}: { req: BookRequest; index: number; myProcurements: ProcurementRequest[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const date = new Date(req.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        className="border border-border"
        data-ocid={`requests.item.${index}`}
      >
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-semibold text-foreground">
                  Request #{req.requestId.slice(-8).toUpperCase()}
                </span>
                <StatusBadge status={req.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{date}</span>
                {req.selectedBookIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs font-normal"
                  >
                    <BookOpen className="h-3 w-3" />
                    {req.selectedBookIds.length} library book(s)
                  </Badge>
                )}
                {req.requestedBooks.length > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs font-normal border-amber-300 text-amber-700 bg-amber-50"
                  >
                    <Package className="h-3 w-3" />
                    {req.requestedBooks.length} manual request(s)
                  </Badge>
                )}
              </div>
              {req.status === "Approved" && (
                <ApprovedDeadlineInfo createdAt={req.createdAt} />
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen((v) => !v)}
                className="gap-1.5 text-muted-foreground"
                data-ocid={`requests.expand_button.${index}`}
              >
                {open ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {open ? "Collapse" : "View Details"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  navigate({ to: `/student/challan/${req.requestId}` })
                }
                data-ocid={`requests.view_button.${index}`}
              >
                <Eye className="h-4 w-4" /> Full Challan
              </Button>
            </div>
          </div>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleContent>
              <FullChallanView req={req} myProcurements={myProcurements} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ReservationCard({ res, index }: { res: Reservation; index: number }) {
  const availDate = res.expectedAvailabilityDate
    ? new Date(res.expectedAvailabilityDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "TBD";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 rounded-xl border border-amber-200 bg-amber-50/60"
        data-ocid={`requests.reservation.item.${index + 1}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {(res as Reservation & { bookTitle?: string }).bookTitle ??
              "Reserved Book"}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Requested:{" "}
              {new Date(res.requestDate).toLocaleDateString("en-IN")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Expected: {availDate}
            </span>
          </div>
        </div>
        <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-300 gap-1">
          <Clock className="h-3 w-3" /> {res.status}
        </Badge>
      </div>
    </motion.div>
  );
}

function ProcurementCard({
  proc,
  index,
}: { proc: ProcurementRequest; index: number }) {
  const isUrgent = proc.urgency === "Required";
  const currentStepIndex = PROCUREMENT_STATUS_STEPS.findIndex(
    (s) => s.key === proc.status,
  );
  const isCancelled = proc.status === "Cancelled";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <div
        className={`px-4 py-4 rounded-xl border ${
          isUrgent
            ? "border-red-200 bg-red-50/50"
            : "border-orange-200 bg-orange-50/50"
        }`}
        data-ocid={`requests.procurement.item.${index + 1}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {proc.bookTitle}
              </p>
              {isUrgent ? (
                <Badge className="shrink-0 bg-red-100 text-red-700 border-red-300 gap-1 text-xs">
                  <Zap className="h-3 w-3" /> Urgent
                </Badge>
              ) : (
                <Badge className="shrink-0 bg-orange-100 text-orange-700 border-orange-300 gap-1 text-xs">
                  <Package className="h-3 w-3" /> Optional
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {proc.author && <span>by {proc.author}</span>}
              {proc.edition && <span>· {proc.edition}</span>}
              {proc.publisher && <span>· {proc.publisher}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requested:{" "}
              {new Date(proc.requestDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge
            className={`shrink-0 text-xs ${
              proc.status === "Issued" || proc.status === "Procured"
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : proc.status === "Cancelled"
                  ? "bg-muted text-muted-foreground"
                  : proc.status === "ReadyForCollection"
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-amber-100 text-amber-700 border-amber-300"
            }`}
          >
            {PROCUREMENT_STATUS_LABEL[proc.status]}
          </Badge>
        </div>
        {/* Progress steps */}
        {!isCancelled && (
          <div className="flex items-center gap-0 mt-2">
            {PROCUREMENT_STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const active = i === currentStepIndex;
              return (
                <div
                  key={step.key}
                  className="flex items-center flex-1 min-w-0"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? active
                            ? "bg-primary border-primary"
                            : "bg-primary/20 border-primary/40"
                          : "bg-card border-border"
                      }`}
                    >
                      {done && !active ? (
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      ) : active ? (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      ) : (
                        <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <span
                      className={`text-[9px] mt-0.5 text-center leading-tight max-w-[52px] ${
                        active
                          ? "text-primary font-semibold"
                          : done
                            ? "text-muted-foreground"
                            : "text-muted-foreground/50"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < PROCUREMENT_STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-0.5 mb-4 ${
                        i < currentStepIndex ? "bg-primary/40" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function RequestsPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () =>
      setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
  // isVisible state pauses background polling via refetchIntervalInBackground:false in hooks
  void isVisible;

  const { data: rawRequests = [], isLoading } = useMyRequests();
  const { data: reservations = [], isLoading: resLoading } =
    useGetMyReservations();
  const { data: procurements = [], isLoading: procLoading } =
    useGetMyProcurements();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [activeTab, setActiveTab] = useState<
    "requests" | "reservations" | "procurements"
  >("requests");

  if (isLoading && resLoading && procLoading)
    return (
      <StudentLayout>
        <PageLoader text="Loading your requests..." />
      </StudentLayout>
    );

  const sorted = [...rawRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const filtered =
    statusFilter === "All"
      ? sorted
      : sorted.filter((r) => r.status === statusFilter);
  const activeReservations = reservations.filter((r) => r.status === "Waiting");

  return (
    <StudentLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              My Requests
            </h1>
            <p className="text-muted-foreground">
              Track your book loans, reservations &amp; procurement requests
            </p>
          </div>
          <Button
            onClick={() =>
              navigate({
                to: "/student/books",
                search: {
                  author: "All",
                  edition: "All",
                  category: "All",
                  sort: "title-asc",
                },
              })
            }
            data-ocid="requests.new_request_button"
          >
            <BookOpen className="h-4 w-4 mr-2" /> New Request
          </Button>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex gap-1 p-1 bg-muted rounded-xl mb-6"
          data-ocid="requests.tab_switcher"
        >
          {[
            {
              id: "requests" as const,
              label: "Book Requests",
              count: rawRequests.length,
            },
            {
              id: "reservations" as const,
              label: "Reservations",
              count: reservations.length,
            },
            {
              id: "procurements" as const,
              label: "Procurement",
              count: procurements.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-subtle"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`requests.${tab.id}.tab`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted-foreground/10 text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Book Requests Tab */}
        {activeTab === "requests" && (
          <>
            {rawRequests.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mb-6"
                data-ocid="requests.filter.tab"
              >
                {STATUS_FILTERS.map((s) => {
                  const count =
                    s === "All"
                      ? rawRequests.length
                      : rawRequests.filter((r) => r.status === s).length;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth border ${
                        statusFilter === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {s}
                      {count > 0 && (
                        <span
                          className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            statusFilter === s
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {rawRequests.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No requests yet"
                description="Browse the library and submit your first book request."
                actionLabel="Browse Books"
                onAction={() =>
                  navigate({
                    to: "/student/books",
                    search: {
                      author: "All",
                      edition: "All",
                      category: "All",
                      sort: "title-asc",
                    },
                  })
                }
                data-ocid="requests.empty_state"
              />
            ) : filtered.length === 0 ? (
              <div
                className="py-12 text-center"
                data-ocid="requests.empty_state"
              >
                <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No {statusFilter.toLowerCase()} requests
                </p>
                <button
                  type="button"
                  onClick={() => setStatusFilter("All")}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Show all requests
                </button>
              </div>
            ) : (
              <div className="space-y-4" data-ocid="requests.list">
                {filtered.map((req, idx) => (
                  <RequestCard
                    key={req.requestId}
                    req={req}
                    index={idx + 1}
                    myProcurements={procurements}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <div>
            {resLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted/50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No reservations"
                description="When a book is unavailable, you can join the waiting list. It will appear here."
                actionLabel="Browse Books"
                onAction={() =>
                  navigate({
                    to: "/student/books",
                    search: {
                      author: "All",
                      edition: "All",
                      category: "All",
                      sort: "title-asc",
                    },
                  })
                }
                data-ocid="requests.reservations.empty_state"
              />
            ) : (
              <div className="space-y-3" data-ocid="requests.reservations.list">
                {activeReservations.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Active Waiting
                    </p>
                    {activeReservations.map((res, idx) => (
                      <ReservationCard key={res.id} res={res} index={idx} />
                    ))}
                  </div>
                )}
                {reservations.filter((r) => r.status !== "Waiting").length >
                  0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Completed / Cancelled
                    </p>
                    {reservations
                      .filter((r) => r.status !== "Waiting")
                      .map((res, idx) => (
                        <ReservationCard key={res.id} res={res} index={idx} />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Procurement Tab */}
        {activeTab === "procurements" && (
          <div>
            {procLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted/50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : procurements.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No procurement requests"
                description="Procurement requests are created when you urgently need a book not in the library."
                actionLabel="Browse Books"
                onAction={() =>
                  navigate({
                    to: "/student/books",
                    search: {
                      author: "All",
                      edition: "All",
                      category: "All",
                      sort: "title-asc",
                    },
                  })
                }
                data-ocid="requests.procurements.empty_state"
              />
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">
                    Admin will procure these books. You will be notified when
                    ready.
                  </p>
                </div>
                <div
                  className="space-y-3"
                  data-ocid="requests.procurements.list"
                >
                  {procurements.map((proc, idx) => (
                    <ProcurementCard key={proc.id} proc={proc} index={idx} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
