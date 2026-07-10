import { StudentLayout } from "@/components/layout/StudentLayout";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAnonActor } from "@/hooks/useAnonActor";
import { useStudentAuth } from "@/hooks/useAuth";
import {
  useGetBookById,
  useGetCollectionOrderForRequest,
  useGetMyProcurements,
  useGetMyReservations,
} from "@/hooks/useBackend";
import type {
  BookRequest,
  CollectionOrder,
  ProcurementRequest,
  RequestedBook,
  Reservation,
} from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Building,
  CalendarCheck,
  Clock,
  GraduationCap,
  Hash,
  MapPin,
  Package,
  Phone,
  Printer,
  QrCode,
  User,
  Zap,
} from "lucide-react";

function BookCard({
  book,
  index,
  status,
  reason,
  expectedReturnDate,
  currentHolder,
  queuePosition,
  author,
  edition,
  publisher,
  bookNumber,
  dataOcid,
}: {
  book?: {
    title: string;
    author?: string;
    edition?: string;
    publisher?: string;
    bookId?: string;
  };
  index: number;
  status:
    | "Approved"
    | "Rejected"
    | "Reserved"
    | "Pending"
    | "SpecialOrder"
    | "Ordered"
    | "Procured"
    | "ReadyForCollection"
    | "Issued"
    | "Returned";
  reason?: string;
  expectedReturnDate?: string;
  currentHolder?: string;
  queuePosition?: number;
  author?: string;
  edition?: string;
  publisher?: string;
  bookNumber?: string;
  dataOcid: string;
}) {
  const title = book?.title ?? "Unknown Book";
  const bookAuthor = author ?? book?.author ?? "—";
  const bookEdition = edition ?? book?.edition ?? "—";
  const bookPublisher = publisher ?? book?.publisher ?? "—";

  const statusConfig: Record<string, { label: string; classes: string }> = {
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
  const cfg = statusConfig[status] ?? statusConfig.Pending;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
      data-ocid={dataOcid}
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-snug">
          {title}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
          {bookAuthor !== "—" && <span>Author: {bookAuthor}</span>}
          {bookEdition !== "—" && <span>Edition: {bookEdition}</span>}
          {bookPublisher !== "—" && bookPublisher !== "null" && (
            <span>Publisher: {bookPublisher}</span>
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
            {queuePosition !== undefined && (
              <p>
                Queue Position:{" "}
                <span className="font-medium">#{queuePosition}</span>
              </p>
            )}
          </div>
        )}
        {reason && (
          <p className="mt-1 text-xs text-muted-foreground">
            Note: {reason}
          </p>
        )}
      </div>
      <span
        className={`self-start flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.classes}`}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function BookRowById({
  bookId,
  index,
  approval,
}: {
  bookId: string;
  index: number;
  approval?: import("@/types").BookApproval;
}) {
  const { data: book } = useGetBookById(bookId);
  const status =
    approval?.action === "Accept"
      ? "Approved"
      : approval?.action === "Reject"
        ? "Rejected"
        : approval?.action === "AcceptReservation"
          ? "Reserved"
          : approval?.action === "RejectReservation"
            ? "Rejected"
            : "Pending";
  return (
    <BookCard
      book={book ?? undefined}
      index={index}
      status={status as "Approved" | "Rejected" | "Reserved" | "Pending"}
      expectedReturnDate={approval?.expectedDate}
      dataOcid={`challan.selected_book.${index + 1}`}
    />
  );
}

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

function QrSection({
  studentId,
  collectionOrderNumber,
}: { studentId: string; collectionOrderNumber?: string }) {
  // Prefer QR pointing to collection order when available
  const qrTarget = collectionOrderNumber
    ? `${window.location.origin}/collection-order/${collectionOrderNumber}`
    : studentId
      ? `${window.location.origin}/student/qr/${studentId}`
      : "";
  const apiUrl = qrTarget
    ? `https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=${encodeURIComponent(qrTarget)}`
    : "";

  if (!qrTarget) {
    return (
      <div className="w-28 h-28 flex items-center justify-center bg-muted/50 rounded-lg border border-border">
        <QrCode className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <img
        src={apiUrl}
        alt="Challan QR Code"
        className="w-28 h-28 object-contain rounded-lg"
        crossOrigin="anonymous"
      />
      <p className="text-[10px] text-muted-foreground">
        {collectionOrderNumber
          ? "Scan for collection order"
          : "Scan for digital ID"}
      </p>
    </div>
  );
}

function ReservationCard({
  reservation,
  index,
}: { reservation: Reservation; index: number }) {
  const { data: book } = useGetBookById(reservation.bookId);
  return (
    <BookCard
      book={book ?? undefined}
      index={index}
      status="Reserved"
      expectedReturnDate={reservation.expectedAvailabilityDate}
      queuePosition={reservation.queuePosition}
      dataOcid={`challan.reservation.${index + 1}`}
    />
  );
}

function ProcurementCard({
  proc,
  index,
}: { proc: ProcurementRequest; index: number }) {
  const status =
    proc.status === "Ordered"
      ? "Ordered"
      : proc.status === "Procured"
        ? "Procured"
        : proc.status === "ReadyForCollection"
          ? "ReadyForCollection"
          : proc.status === "Issued"
            ? "Issued"
            : "SpecialOrder";
  return (
    <BookCard
      book={{ title: proc.bookTitle }}
      index={index}
      status={
        status as
          | "Ordered"
          | "Procured"
          | "ReadyForCollection"
          | "Issued"
          | "SpecialOrder"
      }
      author={proc.author}
      edition={proc.edition}
      publisher={proc.publisher}
      dataOcid={`challan.procurement.${index + 1}`}
    />
  );
}

function BooksGroupedByStatus({
  decisions,
  requestedBooks,
  reservations,
}: {
  decisions: import("@/types").BookDecision[];
  requestedBooks: RequestedBook[];
  reservations: Reservation[];
}) {
  const libraryDecisions = decisions.filter(
    (d) => d.inventoryId && String(d.inventoryId).trim() !== "",
  );
  const manualDecisions = decisions.filter(
    (d) => !d.inventoryId || String(d.bookId).startsWith("manual_"),
  );

  const approved = libraryDecisions.filter((d) => d.decision === "Approved");
  const rejected = libraryDecisions.filter((d) => d.decision === "Rejected");
  const reserved = libraryDecisions.filter((d) => d.decision === "Reserved");
  const pendingLibrary = libraryDecisions.filter((d) => d.decision === "Pending");

  const specialOrder = manualDecisions.filter(
    (d) => d.decision === "SpecialOrder",
  );
  const approvedManual = manualDecisions.filter((d) => d.decision === "Approved");
  const ordered = manualDecisions.filter((d) => d.decision === "Ordered");
  const procured = manualDecisions.filter((d) => d.decision === "Procured");
  const readyForCollection = manualDecisions.filter(
    (d) => d.decision === "ReadyForCollection",
  );
  const issued = manualDecisions.filter((d) => d.decision === "Issued");
  const returned = manualDecisions.filter((d) => d.decision === "Returned");
  const rejectedManual = manualDecisions.filter((d) => d.decision === "Rejected");
  const pendingManual = requestedBooks
    .filter(
      (b) =>
        !manualDecisions.some(
          (d) =>
            String(d.bookName ?? "").toLowerCase().trim() ===
            b.title.toLowerCase().trim(),
        ),
    )
    .map((b, i) => ({
      bookId: `manual_pending_${i}`,
      bookName: b.title,
      bookNumber: String(i + 1),
      inventoryId: "",
      decision: "Pending",
      reason: b.note,
      expectedReturnDate: undefined,
      currentHolder: undefined,
      procurementCreated: false,
    } as import("@/types").BookDecision));
  const pendingManualDecisions = manualDecisions.filter(
    (d) => d.decision === "Pending",
  );

  function renderGroup(
    title: string,
    items: import("@/types").BookDecision[],
    status: string,
    icon: React.ReactNode,
    ocidPrefix: string,
  ) {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <span className="ml-auto text-xs text-muted-foreground">
            {items.length} book(s)
          </span>
        </div>
        <div className="space-y-2">
          {items.map((d, i) => (
            <BookCard
              key={`${d.bookId}-${i}`}
              book={{ title: d.bookName, bookId: d.bookId }}
              index={i}
              status={
                status as
                  | "Approved"
                  | "Rejected"
                  | "Reserved"
                  | "Pending"
                  | "SpecialOrder"
                  | "Ordered"
                  | "Procured"
                  | "ReadyForCollection"
                  | "Issued"
                  | "Returned"
              }
              bookNumber={d.bookNumber}
              reason={d.reason}
              expectedReturnDate={d.expectedReturnDate}
              currentHolder={d.currentHolder}
              dataOcid={`challan.${ocidPrefix}.${i + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {renderGroup(
        "Library - Approved",
        approved,
        "Approved",
        <BookOpen className="h-4 w-4 text-emerald-600" />,
        "approved_book",
      )}
      {renderGroup(
        "Library - Reserved",
        reserved,
        "Reserved",
        <Clock className="h-4 w-4 text-amber-500" />,
        "reserved_book",
      )}
      {renderGroup(
        "Library - Pending",
        pendingLibrary,
        "Pending",
        <BookOpen className="h-4 w-4 text-muted-foreground" />,
        "pending_book",
      )}
      {renderGroup(
        "Library - Rejected",
        rejected,
        "Rejected",
        <BookOpen className="h-4 w-4 text-red-500" />,
        "rejected_book",
      )}

      {renderGroup(
        "Special Requests - Pending",
        [...pendingManual, ...pendingManualDecisions],
        "Pending",
        <Package className="h-4 w-4 text-purple-500" />,
        "manual_pending",
      )}
      {renderGroup(
        "Special Requests - Approved",
        approvedManual,
        "Approved",
        <Package className="h-4 w-4 text-emerald-600" />,
        "manual_approved",
      )}
      {renderGroup(
        "Special Requests - Requested",
        specialOrder,
        "SpecialOrder",
        <Package className="h-4 w-4 text-violet-600" />,
        "manual_special_order",
      )}
      {renderGroup(
        "Special Requests - Ordered",
        ordered,
        "Ordered",
        <Package className="h-4 w-4 text-blue-600" />,
        "manual_ordered",
      )}
      {renderGroup(
        "Special Requests - Procured",
        procured,
        "Procured",
        <Package className="h-4 w-4 text-teal-700" />,
        "manual_procured",
      )}
      {renderGroup(
        "Special Requests - Ready for Collection",
        readyForCollection,
        "ReadyForCollection",
        <Package className="h-4 w-4 text-emerald-700" />,
        "manual_ready",
      )}
      {renderGroup(
        "Special Requests - Issued",
        issued,
        "Issued",
        <Package className="h-4 w-4 text-green-700" />,
        "manual_issued",
      )}
      {renderGroup(
        "Special Requests - Returned",
        returned,
        "Returned",
        <Package className="h-4 w-4 text-muted-foreground" />,
        "manual_returned",
      )}
      {renderGroup(
        "Special Requests - Rejected",
        rejectedManual,
        "Rejected",
        <Package className="h-4 w-4 text-red-500" />,
        "manual_rejected",
      )}

      {reservations.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-foreground">
              Waiting List Reservations
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              {reservations.length} book(s)
            </span>
          </div>
          <div className="space-y-2">
            {reservations.map((res, i) => (
              <ReservationCard key={res.id} reservation={res} index={i} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ChallanContent({
  request,
  userName,
  course,
  college,
  studentId,
  phone,
  paymentStatus,
  reservations,
  procurements,
  collectionDate,
  collectionTime,
  collectionLocation,
  collectionOrderNumber,
  collectionOrderProp,
}: {
  request: BookRequest;
  userName: string;
  course: string;
  college: string;
  studentId: string;
  phone: string;
  paymentStatus: string;
  reservations: Reservation[];
  procurements: ProcurementRequest[];
  collectionDate?: string;
  collectionTime?: string;
  collectionLocation?: string;
  collectionOrderNumber?: string;
  collectionOrderProp?: CollectionOrder | null;
}) {
  const dateStr = new Date(request.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="print-challan">
      {/* Challan Header */}
      <div className="text-center border-b-2 border-border pb-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-display font-bold text-foreground tracking-tight">
              SVGA BOOK BANK
            </p>
            <p className="text-sm text-muted-foreground">
              Shree Vile Parle Gujarati Association — Book Loan Challan
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Challan No: </span>
            <strong className="font-mono">
              {request.requestId.slice(-8).toUpperCase()}
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground">Date: </span>
            <strong>{dateStr}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status: </span>
            <StatusBadge status={request.status} />
          </div>
          {collectionOrderNumber && (
            <div>
              <span className="text-muted-foreground">Order No: </span>
              <strong className="font-mono">{collectionOrderNumber}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Student Info + QR */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 rounded-xl bg-[#f0f9ff] border border-[#bae6fd] p-5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            Student Details
          </p>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <User className="h-3 w-3" />
                <p className="text-xs">Student Name</p>
              </div>
              <p className="font-semibold text-foreground">{userName}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <Hash className="h-3 w-3" />
                <p className="text-xs">Student ID</p>
              </div>
              <p className="font-mono font-bold text-primary text-base">
                {studentId}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <GraduationCap className="h-3 w-3" />
                <p className="text-xs">Course</p>
              </div>
              <p className="font-medium text-foreground">{course}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <Building className="h-3 w-3" />
                <p className="text-xs">College</p>
              </div>
              <p className="font-medium text-foreground">{college}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                <Phone className="h-3 w-3" />
                <p className="text-xs">Phone</p>
              </div>
              <p className="text-foreground text-xs">{phone}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="sm:w-36 flex items-center justify-center sm:justify-end">
          <QrSection
            studentId={studentId}
            collectionOrderNumber={collectionOrderNumber}
          />
        </div>
      </div>

      {/* Collection Details (shown when admin has finalized) */}
      {(collectionDate || collectionTime || collectionLocation) && (
        <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" /> Collection Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {collectionDate && (
              <div>
                <p className="text-xs text-teal-700 mb-0.5">Collection Date</p>
                <p className="font-semibold text-teal-900">
                  {new Date(collectionDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {collectionTime && (
              <div>
                <p className="text-xs text-teal-700 mb-0.5">Collection Time</p>
                <p className="font-semibold text-teal-900">{collectionTime}</p>
              </div>
            )}
            {collectionLocation && (
              <div>
                <div className="flex items-center gap-1 text-teal-700 mb-0.5">
                  <MapPin className="h-3 w-3" />
                  <p className="text-xs">Location</p>
                </div>
                <p className="font-semibold text-teal-900">
                  {collectionLocation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Books Section — grouped by status from collection order decisions */}
      {collectionOrderProp?.bookDecisions &&
      collectionOrderProp.bookDecisions.length > 0 ? (
        <BooksGroupedByStatus
          decisions={collectionOrderProp.bookDecisions}
          requestedBooks={request.requestedBooks}
          reservations={reservations}
        />
      ) : (
        <>
          {/* Fallback: show raw selected books with individual approval status */}
          {request.selectedBookIds.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  Requested Books
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {request.selectedBookIds.length} book(s)
                </span>
              </div>
              <div className="space-y-2">
                {request.selectedBookIds.map((id, i) => (
                  <BookRowById
                    key={id}
                    bookId={id}
                    index={i}
                    approval={request.bookApprovals?.find(
                      (a) => a.bookId === id,
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Manually requested books */}
          {request.requestedBooks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-foreground">
                  Special Book Requests 📚
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {request.requestedBooks.length} request(s)
                </span>
              </div>
              <div className="space-y-2">
                {request.requestedBooks.map((b, i) => (
                  <BookCard
                    key={`${b.title}-${i}`}
                    book={{
                      title: b.title,
                      author: b.author,
                      edition: b.edition,
                      publisher: b.publisher,
                    }}
                    index={i}
                    status={normalizeManualDecision(b.decision) as
                      | "Approved"
                      | "Rejected"
                      | "Reserved"
                      | "Pending"
                      | "SpecialOrder"
                      | "Ordered"
                      | "Procured"
                      | "ReadyForCollection"
                      | "Issued"
                      | "Returned"}
                    author={b.author}
                    edition={b.edition}
                    publisher={b.publisher}
                    reason={b.note}
                    dataOcid={`challan.manual_book.${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reservations */}
          {reservations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-foreground">
                  Reserved Books ⏳
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {reservations.length} reservation(s)
                </span>
              </div>
              <div className="space-y-2">
                {reservations.map((res, i) => (
                  <ReservationCard key={res.id} reservation={res} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Procurement */}
          {procurements.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-red-500" />
                <p className="text-sm font-semibold text-foreground">
                  Procurement Requests
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {procurements.length} request(s)
                </span>
              </div>
              <div className="space-y-2">
                {procurements.map((proc, i) => (
                  <ProcurementCard key={proc.id} proc={proc} index={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Status */}
      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Payment Details
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Membership Deposit
            </p>
            <p className="font-bold text-primary">₹200</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Payment Status
            </p>
            <StatusBadge
              status={paymentStatus === "completed" ? "Paid" : "unpaid"}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Refund Policy
            </p>
            <p className="text-xs text-emerald-700 font-medium">
              Refundable on return
            </p>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Signatures
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-4 min-h-[80px] flex flex-col justify-between">
            <div className="h-10" />
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Admin Signature
              </p>
              <p className="text-xs text-muted-foreground text-center mt-0.5">
                Date: ___________
              </p>
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 min-h-[80px] flex flex-col justify-between">
            <div className="h-10" />
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Student Signature
              </p>
              <p className="text-xs text-muted-foreground text-center mt-0.5">
                Date: ___________
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Separator />
      <div className="pt-4 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          This is a system-generated challan. Please bring this document when
          collecting your books from SVGA Book Bank.
        </p>
        <p className="text-xs text-muted-foreground">
          Membership Deposit:{" "}
          <strong className="text-foreground">
            ₹200 (Refundable on return)
          </strong>
        </p>
      </div>
    </div>
  );
}

export function ChallanPage() {
  // Support both /student/challan/$requestId and /collection-order/$orderNumber
  const params = useParams({ strict: false }) as {
    requestId?: string;
    orderNumber?: string;
  };
  const requestId = params.requestId ?? "";
  const navigate = useNavigate();
  const { currentUser: user, token } = useStudentAuth();
  const { data: reservations = [] } = useGetMyReservations();
  const { data: procurements = [] } = useGetMyProcurements();
  const { actor, isFetching: actorFetching } = useAnonActor();
  const { data: collectionOrder } = useGetCollectionOrderForRequest(
    requestId ?? "",
  );

  // Accept both svga_token (real) and legacy session token
  const effectiveToken =
    token ||
    localStorage.getItem("svga_token") ||
    (() => {
      try {
        const raw = localStorage.getItem("svga_student_session");
        if (!raw) return null;
        const s = JSON.parse(raw) as { token: string };
        return s.token || null;
      } catch {
        return null;
      }
    })();

  const isFakeToken = !effectiveToken || effectiveToken.startsWith("pending_");

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery<BookRequest | null>({
    queryKey: ["request", requestId],
    queryFn: async () => {
      if (!requestId || isFakeToken || !actor) return null;
      const result = await actor.getRequestById(effectiveToken!, requestId);
      if (result.__kind__ === "err") throw new Error(result.err);
      const r = result.ok;
      return {
        _id: r.requestId,
        requestId: r.requestId,
        userId: r.userId,
        studentName: r.studentName,
        studentAadhaar: r.studentAadhaar,
        studentCourse: r.studentCourse,
        studentId: r.studentId,
        studentEmail: r.studentEmail ?? "",
        studentYear: r.studentYear ?? "",
        selectedBookIds: r.selectedBookIds,
        selectedBooks: [],
        requestedBooks: r.requestedBooks.map((rb) => ({
          title: rb.title,
          author: rb.author,
          edition: rb.edition,
          publisher: rb.publisher,
          note: (rb as any).note,
          imageUrl: rb.imageUrl,
          decision: String((rb as any).decision ?? ""),
        })),
        bookDecisions: r.bookDecisions ?? [],
        specialRequests: r.specialRequests ?? [],
        status: r.status as BookRequest["status"],
        challanGenerated: !!r.challanData,
        challanData: r.challanData,
        createdAt: new Date(Number(r.createdAt) / 1_000_000).toISOString(),
      } as BookRequest;
    },
    enabled: !!requestId && !isFakeToken && !!actor && !actorFetching,
    retry: 1,
    refetchInterval: 10000,
  });

  if (isLoading)
    return (
      <StudentLayout>
        <PageLoader text="Loading challan..." />
      </StudentLayout>
    );

  if (isFakeToken)
    return (
      <StudentLayout>
        <div
          className="max-w-3xl mx-auto p-8 text-center"
          data-ocid="challan.session_error_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground mb-2">
            Account setup in progress
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Your account is still being created. Please log in with your
            credentials to view the challan.
          </p>
          <Button
            onClick={() => navigate({ to: "/student/login" })}
            data-ocid="challan.login_button"
          >
            Log In
          </Button>
        </div>
      </StudentLayout>
    );

  if (isError || !request)
    return (
      <StudentLayout>
        <div
          className="max-w-3xl mx-auto p-8 text-center"
          data-ocid="challan.error_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground mb-2">
            Challan not found
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">
            We couldn't load this challan. It may still be processing or the
            link may have expired.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/student/requests" })}
              data-ocid="challan.back_button"
            >
              Back to Requests
            </Button>
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
              data-ocid="challan.select_books_button"
            >
              Select Books
            </Button>
          </div>
        </div>
      </StudentLayout>
    );

  return (
    <StudentLayout>
      {/* Print-hide controls */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/student/requests" })}
            data-ocid="challan.back_button"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Requests
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
            data-ocid="challan.print_button"
          >
            <Printer className="h-4 w-4" /> Print Challan
          </Button>
        </div>
      </div>

      {/* Challan Card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="border border-border shadow-elevated print:shadow-none print:border-none">
          <CardContent className="p-8">
            <ChallanContent
              request={request}
              userName={user?.name ?? "—"}
              course={user?.course ?? "—"}
              college={user?.college ?? "—"}
              studentId={user?.studentId ?? "—"}
              phone={user?.phone ?? "—"}
              paymentStatus={user?.paymentStatus ?? ""}
              reservations={reservations}
              procurements={procurements}
              collectionDate={collectionOrder?.collectionDate}
              collectionTime={collectionOrder?.collectionTime}
              collectionLocation={collectionOrder?.collectionLocation}
              collectionOrderNumber={collectionOrder?.orderNumber}
              collectionOrderProp={collectionOrder ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
