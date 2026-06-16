import { BookDecisionStatus } from "@/backend";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AdminPendingRequestSummary,
  ManualBookToPurchase,
} from "@/hooks/useBackend";
import {
  useAdminPendingRequests,
  useCompletedForms,
  useManualBooksToPurchase,
  useUpdateManualBookStatus,
} from "@/hooks/useBackend";
import { RequestDetailsModal } from "@/pages/admin/RequestDetailsModal";
import type { BookRequest } from "@/types";
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Package,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTs(ts: bigint | string | undefined): string {
  if (!ts) return "—";
  try {
    const ms =
      typeof ts === "bigint"
        ? Number(ts) / 1_000_000
        : Date.parse(ts as string);
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const MANUAL_STATUS_OPTIONS: { label: string; value: BookDecisionStatus }[] = [
  { label: "Requested", value: BookDecisionStatus.Pending },
  { label: "Approved", value: BookDecisionStatus.Approved },
  { label: "Ordered", value: BookDecisionStatus.Ordered },
  { label: "Reached Office", value: BookDecisionStatus.Arrived },
  {
    label: "Ready For Collection",
    value: BookDecisionStatus.ReadyForCollection,
  },
  { label: "Collected By Student", value: BookDecisionStatus.Issued },
  { label: "Returned", value: BookDecisionStatus.Returned },
];

function statusBadgeCls(status: string) {
  switch (status) {
    case "Ordered":
      return "bg-blue-100 text-blue-700";
    case "Procured":
      return "bg-emerald-100 text-emerald-700";
    case "ReadyForCollection":
      return "bg-teal-100 text-teal-700";
    case "Issued":
      return "bg-indigo-100 text-indigo-700";
    case "Returned":
      return "bg-muted text-muted-foreground";
    case "Approved":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "Procured":
      return "Reached Office";
    case "ReadyForCollection":
      return "Ready For Collection";
    case "Issued":
      return "Collected By Student";
    default:
      return status;
  }
}

// ─── Pending Request Card ──────────────────────────────────────────────────────

function PendingCard({
  item,
  idx,
  onOpen,
}: {
  item: AdminPendingRequestSummary;
  idx: number;
  onOpen: (requestId: string) => void;
}) {
  return (
    <div
      className="bg-card border border-sky-100 rounded-2xl shadow-sm overflow-hidden"
      data-ocid={`admin.requests.pending.item.${idx + 1}`}
    >
      <div className="px-4 py-4 bg-sky-50 border-b border-sky-100 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="font-semibold text-foreground text-sm truncate">
              {item.studentName || "Unknown Student"}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {item.studentId && (
                <span className="font-mono text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-lg">
                  {item.studentId}
                </span>
              )}
              <Badge className="text-xs bg-amber-100 text-amber-700 border-0">
                Pending
              </Badge>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-sky-200 shrink-0"
          onClick={() => onOpen(item.requestId)}
          data-ocid={`admin.requests.pending.view_button.${idx + 1}`}
        >
          View Challan
        </Button>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {item.phoneNumber && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" /> {item.phoneNumber}
          </span>
        )}
        {item.course && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 shrink-0" /> {item.course}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ClipboardList className="h-3 w-3 shrink-0" />{" "}
          {fmtTs(item.requestDate)}
        </span>
        <span className="flex items-center gap-1">
          <GraduationCap className="h-3 w-3 shrink-0" />
          {Number(item.totalBooksCount)} book
          {Number(item.totalBooksCount) !== 1 ? "s" : ""} requested
        </span>
      </div>
    </div>
  );
}

// ─── Completed Form Card ───────────────────────────────────────────────────────

function CompletedCard({
  request,
  idx,
  onOpen,
}: {
  request: BookRequest;
  idx: number;
  onOpen: (r: BookRequest) => void;
}) {
  const getReqNum = (id: string) => `REQ-${id.slice(-6).toUpperCase()}`;

  return (
    <div
      className="bg-card border border-sky-100 rounded-2xl shadow-sm overflow-hidden"
      data-ocid={`admin.requests.completed.item.${idx + 1}`}
    >
      <div className="px-4 py-4 bg-sky-50 border-b border-sky-100 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="font-semibold text-foreground text-sm truncate">
              {request.studentName || "Unknown Student"}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {request.studentId && (
                <span className="font-mono text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-lg">
                  {request.studentId}
                </span>
              )}
              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">
                Finalized
              </Badge>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-sky-200 shrink-0"
          onClick={() => onOpen(request)}
          data-ocid={`admin.requests.completed.view_button.${idx + 1}`}
        >
          View Challan
        </Button>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono">{getReqNum(request.requestId)}</span>
        <span>{fmtTs(request.createdAt as bigint | string | undefined)}</span>
        {request.studentCourse && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 shrink-0" /> {request.studentCourse}
          </span>
        )}
        <span>
          {(request.selectedBookIds?.length ?? 0) +
            (request.requestedBooks?.length ?? 0)}{" "}
          book
          {(request.selectedBookIds?.length ?? 0) +
            (request.requestedBooks?.length ?? 0) !==
          1
            ? "s"
            : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Manual Books Tab ──────────────────────────────────────────────────────────

function ManualBooksTab({
  onOpenRequest,
}: {
  onOpenRequest: (requestId: string) => void;
}) {
  const { data: items = [], isLoading, isError } = useManualBooksToPurchase();
  const updateStatus = useUpdateManualBookStatus();

  const handleStatusChange = async (
    item: ManualBookToPurchase,
    newStatus: BookDecisionStatus,
  ) => {
    try {
      await updateStatus.mutateAsync({
        requestId: item.requestId,
        bookTitle: `manual:${item.manualIndex}:${item.procurement.bookTitle}`,
        newStatus,
      });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );

  if (isError)
    return (
      <div
        className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
        data-ocid="admin.manual_books.error_state"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" /> Failed to load items.
      </div>
    );

  if (items.length === 0)
    return (
      <div
        className="flex flex-col items-center gap-2 py-16 text-center"
        data-ocid="admin.manual_books.empty_state"
      >
        <Package className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No books to purchase yet.
        </p>
        <p className="text-xs text-muted-foreground">
          Approved manual book requests will appear here.
        </p>
      </div>
    );

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={`${item.requestId}-${item.procurement.id}`}
          className="bg-card border border-sky-100 rounded-2xl shadow-sm overflow-hidden"
          data-ocid={`admin.manual_books.item.${i + 1}`}
        >
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm truncate">
                {item.procurement.bookTitle}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {item.studentName}
                </span>
                {item.studentId && (
                  <span className="font-mono text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                    {item.studentId}
                  </span>
                )}
                <Badge
                  className={`text-xs border-0 ${statusBadgeCls(item.procurement.status)}`}
                >
                  {statusLabel(item.procurement.status)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Select
                value={item.procurement.status}
                onValueChange={(v) =>
                  handleStatusChange(item, v as BookDecisionStatus)
                }
                disabled={
                  updateStatus.isPending ||
                  (item.procurement.status as string) === "Returned"
                }
              >
                <SelectTrigger
                  className="h-8 w-44 text-xs"
                  data-ocid={`admin.manual_books.status_select.${i + 1}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_STATUS_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-sky-200"
                onClick={() => onOpenRequest(item.requestId)}
                data-ocid={`admin.manual_books.view_button.${i + 1}`}
              >
                View Full Challan
              </Button>
            </div>
          </div>
          {(item.studentCourse || item.collectionDate) && (
            <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              {item.studentCourse && (
                <span>
                  {item.studentCourse} {item.studentYear}
                </span>
              )}
              {item.collectionDate && (
                <span>Collection: {item.collectionDate}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState("pending");

  // Modal state — can open from any tab
  const [modalRequest, setModalRequest] = useState<BookRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "readonly">("edit");

  const {
    data: pendingItems = [],
    isLoading: pendingLoading,
    isError: pendingError,
  } = useAdminPendingRequests();

  const {
    data: completedForms = [],
    isLoading: completedLoading,
    isError: completedError,
  } = useCompletedForms();

  const { data: manualItems = [] } = useManualBooksToPurchase();

  const pendingCount = pendingItems.length;

  const openPendingModal = (requestId: string) => {
    const summary = pendingItems.find((p) => p.requestId === requestId);
    if (!summary) return;
    // Pass selectedBookIds as a non-empty sentinel so the modal doesn't show
    // the "no library books" empty-state before useGetRequestDetails returns.
    // The actual books come from the hook, keyed by requestId.
    const req: BookRequest = {
      requestId: summary.requestId,
      userId: "",
      studentId: summary.studentId,
      studentName: summary.studentName,
      studentPhone: summary.phoneNumber,
      studentEmail: "",
      studentCourse: summary.course,
      studentYear: "",
      // Use a placeholder so the modal skips the "selectedBookIds.length===0" early-return
      // and instead waits for useGetRequestDetails to load the real books.
      selectedBookIds: ["__loading__"],
      selectedBooks: [],
      requestedBooks: [],
      status: "Pending",
      createdAt: summary.requestDate.toString(),
      challanGenerated: false,
    };
    setModalRequest(req);
    setModalMode("edit");
    setModalOpen(true);
  };

  const openCompletedModal = (request: BookRequest) => {
    setModalRequest(request);
    setModalMode("readonly");
    setModalOpen(true);
  };

  const openManualModal = (requestId: string) => {
    // First try completedForms, then try to build a minimal stub from manual items
    const req = completedForms.find((r) => r.requestId === requestId);
    if (req) {
      setModalRequest(req);
      setModalMode("readonly");
      setModalOpen(true);
      return;
    }
    // If not yet in completedForms (e.g. just approved), open with sentinel so
    // useGetRequestDetails loads the real data from the canister.
    const manualItem = manualItems.find((i) => i.requestId === requestId);
    const stub: BookRequest = {
      requestId,
      userId: "",
      studentId: manualItem?.studentId ?? "",
      studentName: manualItem?.studentName ?? "",
      studentPhone: manualItem?.studentPhone ?? "",
      studentEmail: "",
      studentCourse: manualItem?.studentCourse ?? "",
      studentYear: manualItem?.studentYear ?? "",
      selectedBookIds: ["__loading__"],
      selectedBooks: [],
      requestedBooks: [],
      status: "Approved",
      createdAt: new Date().toISOString(),
      challanGenerated: true,
    };
    setModalRequest(stub);
    setModalMode("readonly");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalRequest(null);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            Book Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student book requests and orders
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-sky-50 border border-sky-100 gap-1 h-10">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-sm"
              data-ocid="admin.requests.pending.tab"
            >
              Pending Requests
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700 data-[state=active]:bg-sky-500 data-[state=active]:text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-sm"
              data-ocid="admin.requests.completed.tab"
            >
              Completed Forms
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-sm"
              data-ocid="admin.requests.manual.tab"
            >
              Manual Books To Purchase
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : pendingError ? (
              <div
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
                data-ocid="admin.requests.pending.error_state"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" /> Failed to load
                requests.
              </div>
            ) : pendingItems.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-16 text-center"
                data-ocid="admin.requests.pending.empty_state"
              >
                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No pending requests.
                </p>
                <p className="text-xs text-muted-foreground">
                  New student requests will appear here.
                </p>
              </div>
            ) : (
              pendingItems.map((item, idx) => (
                <PendingCard
                  key={item.requestId}
                  item={item}
                  idx={idx}
                  onOpen={openPendingModal}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : completedError ? (
              <div
                className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
                data-ocid="admin.requests.completed.error_state"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" /> Failed to load
                completed forms.
              </div>
            ) : completedForms.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-16 text-center"
                data-ocid="admin.requests.completed.empty_state"
              >
                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No completed forms yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Finalized challans will appear here.
                </p>
              </div>
            ) : (
              completedForms.map((r, idx) => (
                <CompletedCard
                  key={r.requestId}
                  request={r}
                  idx={idx}
                  onOpen={openCompletedModal}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <ManualBooksTab onOpenRequest={openManualModal} />
          </TabsContent>
        </Tabs>

        {modalRequest && (
          <RequestDetailsModal
            request={modalRequest}
            open={modalOpen}
            onClose={closeModal}
            onFinalized={closeModal}
            requestIdx={0}
            mode={modalMode}
          />
        )}
      </div>
    </AdminLayout>
  );
}
