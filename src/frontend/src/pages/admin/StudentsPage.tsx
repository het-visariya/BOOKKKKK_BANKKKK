import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/useAuth";
import {
  useGetQrCodeData,
  useSearchRequests,
  useSearchStudents,
  useSetReturnDate,
  useUpdateStudent,
} from "@/hooks/useBackend";
import type { UserPublic } from "@/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  Camera,
  Pencil,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import QRCodeLib from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const COURSE_OPTIONS = [
  "All",
  "FYJC Science",
  "SYJC Science",
  "FYJC Commerce",
  "SYJC Commerce",
  "Medical",
  "Engineering",
  "Arts",
  "Other",
];

const MEMBERSHIP_OPTIONS = ["All", "Paid", "Pending"];

// ── QR Lookup Modal ─────────────────────────────────────────────────────

function StudentQrModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<"scan" | "manual">("scan");
  const [inputId, setInputId] = useState("");
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  const { data: matchedStudents, isLoading: studentLoading } =
    useSearchStudents(lookupId ?? "", null, null);
  const student = matchedStudents?.[0] ?? null;

  const { data: studentRequests, isLoading: reqLoading } = useSearchRequests(
    lookupId ?? "",
    null,
    null,
  );

  // Get student QR code data for the found student
  const { data: studentQrContent } = useGetQrCodeData(student?.studentId ?? "");
  const studentQrData = studentQrContent || student?.studentId || "";

  // Render QR onto the result canvas when student is found
  useEffect(() => {
    if (!student || !resultCanvasRef.current || !studentQrData) return;
    QRCodeLib.toCanvas(resultCanvasRef.current, studentQrData, {
      width: 100,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(console.error);
  }, [student, studentQrData]);

  const userRequests = (studentRequests ?? []).filter(
    (r) => student && r.userId === student.studentId,
  );

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Try BarcodeDetector (Chrome/Edge)
      if ("BarcodeDetector" in window) {
        // @ts-ignore — BarcodeDetector is not in TS lib yet
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue as string;
              stopCamera();
              setLookupId(value.trim());
              setTab("manual"); // switch to result view
              toast.success(`QR scanned: ${value.slice(0, 20)}…`);
            }
          } catch {
            // continue scanning
          }
        }, 500);
      } else {
        // BarcodeDetector not available — fallback message
        setCameraError(
          "Camera is active. If auto-detection fails, copy the QR value and use manual entry.",
        );
      }
    } catch (err) {
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access camera. Use manual entry instead.",
      );
    }
  }, [stopCamera]);

  // Stop camera when modal closes or tab changes away from scan
  useEffect(() => {
    if (!open) stopCamera();
  }, [open, stopCamera]);

  useEffect(() => {
    if (tab !== "scan") stopCamera();
  }, [tab, stopCamera]);

  const handleManualLookup = () => {
    const trimmed = inputId.trim();
    if (!trimmed) {
      toast.error("Please enter a Student ID");
      return;
    }
    setLookupId(trimmed);
  };

  const handleClose = () => {
    stopCamera();
    setInputId("");
    setLookupId(null);
    setTab("scan");
    setCameraError(null);
    onOpenChange(false);
  };

  const formatDate = (ts: string | bigint | undefined) =>
    ts
      ? (typeof ts === "string"
          ? new Date(ts)
          : new Date(Number(ts) / 1_000_000)
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="admin.students.qr_modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Student QR Scanner
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "scan" | "manual")}
          className="pt-1"
        >
          <TabsList className="w-full">
            <TabsTrigger
              value="scan"
              className="flex-1 gap-1.5"
              data-ocid="admin.students.qr_tab_scan"
            >
              <Camera className="h-4 w-4" /> Scan QR
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="flex-1 gap-1.5"
              data-ocid="admin.students.qr_tab_manual"
            >
              <Search className="h-4 w-4" /> Manual Lookup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Point the camera at a student's QR code to look up their profile.
            </p>
            {!scanning ? (
              <Button
                className="w-full gap-2"
                onClick={startCamera}
                data-ocid="admin.students.qr_start_camera"
              >
                <Camera className="h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={stopCamera}
                data-ocid="admin.students.qr_stop_camera"
              >
                <X className="h-4 w-4" /> Stop Camera
              </Button>
            )}
            {cameraError && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {cameraError}
              </p>
            )}
            <div
              className={`relative rounded-xl overflow-hidden border border-border bg-muted/20 ${
                scanning ? "" : "hidden"
              }`}
            >
              <video
                ref={videoRef}
                className="w-full h-56 object-cover"
                playsInline
                muted
                data-ocid="admin.students.qr_video"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 border-2 border-primary/60 rounded-xl" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 pt-3">
            <p className="text-sm text-muted-foreground">
              Enter the student's ID or the scanned QR value to look up their
              profile.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Student ID (e.g. SVGA-2024-001)"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                data-ocid="admin.students.qr_id_input"
              />
              <Button
                onClick={handleManualLookup}
                className="shrink-0"
                data-ocid="admin.students.qr_lookup_button"
              >
                Look up
              </Button>
            </div>

            {lookupId && (
              <div>
                {studentLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : !student ? (
                  <div
                    className="rounded-xl bg-red-50 border border-red-200 p-4 text-center text-sm text-red-700"
                    data-ocid="admin.students.qr_not_found"
                  >
                    No student found with ID "{lookupId}"
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Student Profile Card */}
                    <div className="rounded-xl bg-[#E8F4F8] border border-[#B8E0E8] p-4">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-14 w-14 border-2 border-[#88D4E0] shrink-0">
                          <AvatarImage
                            src={student.profileImageUrl || undefined}
                            alt={student.name}
                          />
                          <AvatarFallback className="bg-[#B8E0E8] text-[#5AC8D8] font-display font-bold text-lg">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-foreground text-base truncate">
                            {student.name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            {student.studentId}
                          </p>
                          <div className="mt-1">
                            <StatusBadge
                              status={
                                student.paymentStatus === "SUCCESS" ||
                                student.membershipStatus === "PAID"
                                  ? "Paid"
                                  : "unpaid"
                              }
                            />
                          </div>
                        </div>
                        <canvas
                          ref={resultCanvasRef}
                          className="rounded-lg border border-border shrink-0"
                          data-ocid="admin.students.qr_canvas"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          {
                            label: "Aadhaar",
                            value: student.aadhaarNumber
                              ? `xxxx-xxxx-${student.aadhaarNumber.slice(-4)}`
                              : "—",
                          },
                          { label: "Phone", value: student.phone },
                          { label: "Course", value: student.course },
                          { label: "College", value: student.college },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <span className="text-muted-foreground">
                              {label}:{" "}
                            </span>
                            <span className="font-medium text-foreground">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issued Books Table */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5 text-sm">
                        Issued Books / Requests
                        {reqLoading ? (
                          <Skeleton className="h-4 w-10 inline-block" />
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {userRequests.length}
                          </Badge>
                        )}
                      </h4>
                      {reqLoading ? (
                        <div className="space-y-2">
                          {["a", "b"].map((i) => (
                            <Skeleton
                              key={i}
                              className="h-10 w-full rounded-lg"
                            />
                          ))}
                        </div>
                      ) : userRequests.length === 0 ? (
                        <p
                          className="text-sm text-muted-foreground py-2"
                          data-ocid="admin.students.qr_no_requests"
                        >
                          No requests found for this student.
                        </p>
                      ) : (
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-[#E8F4F8]">
                              <tr>
                                {["Request ID", "Books", "Status", "Date"].map(
                                  (h) => (
                                    <th
                                      key={h}
                                      className="text-left px-3 py-2 font-semibold text-foreground"
                                    >
                                      {h}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {userRequests.map((req, i) => (
                                <tr
                                  key={req.requestId}
                                  className="border-t border-border"
                                  data-ocid={`admin.students.qr_request.item.${i + 1}`}
                                >
                                  <td className="px-3 py-2 font-mono text-muted-foreground">
                                    #{req.requestId.slice(-8).toUpperCase()}
                                  </td>
                                  <td className="px-3 py-2">
                                    {req.selectedBookIds.length +
                                      req.requestedBooks.length}
                                  </td>
                                  <td className="px-3 py-2">
                                    <StatusBadge status={req.status} />
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                    {formatDate(req.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StudentDetailSheet({
  student,
  open,
  onOpenChange,
}: {
  student: UserPublic | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const setReturnDate = useSetReturnDate();
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [returnDateInput, setReturnDateInput] = useState("");

  const formatDate = (ts: string | bigint | undefined) =>
    ts
      ? (typeof ts === "string"
          ? new Date(ts)
          : new Date(Number(ts) / 1_000_000)
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const handleSaveReturnDate = async (requestId: string) => {
    if (!returnDateInput) return;
    try {
      await setReturnDate.mutateAsync({
        requestId,
        returnDate: returnDateInput,
      });
      toast.success("Return date updated");
      setEditingReturnId(null);
    } catch {
      toast.error("Failed to update return date");
    }
  };

  if (!student) return null;

  const initials = student.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
        data-ocid="admin.students.detail_sheet"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display">Student Profile</SheetTitle>
        </SheetHeader>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage
                src={student.profileImageUrl || undefined}
                alt={student.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-display font-bold text-foreground">
                {student.name}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">
                {student.studentId}
              </p>
              <div className="mt-1">
                <StatusBadge
                  status={
                    student.paymentStatus === "SUCCESS" ||
                    student.membershipStatus === "PAID"
                      ? "Paid"
                      : "unpaid"
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 space-y-3">
            {[
              {
                label: "Aadhaar",
                value: student.aadhaarNumber
                  ? `xxxx-xxxx-${student.aadhaarNumber.slice(-4)}`
                  : "—",
              },
              { label: "Phone", value: student.phone },
              { label: "Course / Stream", value: student.course },
              { label: "College", value: student.college },
              {
                label: "Membership Since",
                value: formatDate(student.createdAt),
              },
              {
                label: "Membership Status",
                value: student.membershipStatus || "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-body">{label}</span>
                <span className="font-medium text-foreground text-right max-w-[60%] break-words">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {student.issuedBooksInfo && student.issuedBooksInfo.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" /> Issued Books
              </h4>
              <div className="space-y-2">
                {student.issuedBooksInfo.map((b) => (
                  <div
                    key={b.requestId}
                    className="bg-card border border-border rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {b.bookTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.returned ? "✓ Returned" : "Active"}
                        </p>
                      </div>
                      {!b.returned && editingReturnId !== b.requestId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs gap-1 shrink-0"
                          onClick={() => {
                            setEditingReturnId(b.requestId);
                            setReturnDateInput(
                              b.returnDate ? b.returnDate.split("T")[0] : "",
                            );
                          }}
                          data-ocid="admin.students.set_return_date_button"
                        >
                          <CalendarClock className="h-3 w-3" /> Set Return
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {b.issueDate && (
                        <span>Issued: {formatDate(b.issueDate)}</span>
                      )}
                      {b.returnDate && (
                        <span>Return: {formatDate(b.returnDate)}</span>
                      )}
                    </div>
                    {editingReturnId === b.requestId && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="date"
                          value={returnDateInput}
                          onChange={(e) => setReturnDateInput(e.target.value)}
                          className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          data-ocid="admin.students.return_date_input"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleSaveReturnDate(b.requestId)}
                          disabled={setReturnDate.isPending}
                          data-ocid="admin.students.save_return_date_button"
                        >
                          {setReturnDate.isPending ? "Saving…" : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => setEditingReturnId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                window.open(
                  `/student/qr/${student.studentId}`,
                  "_blank",
                  "noreferrer",
                )
              }
              data-ocid="admin.students.open_qr_sheet_button"
            >
              <QrCode className="h-4 w-4" /> Open QR / Challan Page
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function StudentsPage() {
  const navigate = useNavigate({ from: "/admin/students" });
  const searchParams = useSearch({ from: "/admin/students" });
  const search = searchParams.search ?? "";
  const courseFilter = searchParams.course ?? "All";
  const membershipFilter = searchParams.membership ?? "All";
  const [selected, setSelected] = useState<UserPublic | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<UserPublic | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const updateStudentMutation = useUpdateStudent();

  const setSearch = (v: string) =>
    navigate({
      to: "/admin/students",
      search: (prev) => ({ ...prev, search: v }),
    });
  const setCourseFilter = (v: string) =>
    navigate({
      to: "/admin/students",
      search: (prev) => ({ ...prev, course: v }),
    });
  const setMembershipFilter = (v: string) =>
    navigate({
      to: "/admin/students",
      search: (prev) => ({ ...prev, membership: v }),
    });

  const { isAdminAuthenticated } = useAdminAuth();
  const adminTokenPresent = isAdminAuthenticated();

  const {
    data: users,
    isLoading,
    isError: usersError,
  } = useSearchStudents(
    search,
    courseFilter !== "All" ? courseFilter : null,
    membershipFilter !== "All" ? membershipFilter : null,
  );

  const formatDate = (ts: string | bigint | undefined) =>
    ts
      ? (typeof ts === "string"
          ? new Date(ts)
          : new Date(Number(ts) / 1_000_000)
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const hasFilters =
    search || courseFilter !== "All" || membershipFilter !== "All";

  const clearAll = () =>
    navigate({
      to: "/admin/students",
      search: { search: "", course: "All", membership: "All" },
    });

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Registered Students
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {users?.length ?? 0} total members
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 shrink-0 border-[#88D4E0] text-[#5AC8D8] hover:bg-[#E8F4F8]"
            onClick={() => setQrOpen(true)}
            data-ocid="admin.students.qr_scan_button"
          >
            <QrCode className="h-4 w-4" />
            QR Lookup
          </Button>
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="admin.students.search_input"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger
                className="w-44"
                data-ocid="admin.students.course_filter"
              >
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={membershipFilter}
              onValueChange={setMembershipFilter}
            >
              <SelectTrigger
                className="w-40"
                data-ocid="admin.students.membership_filter"
              >
                <SelectValue placeholder="Membership" />
              </SelectTrigger>
              <SelectContent>
                {MEMBERSHIP_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filter badges */}
          {hasFilters ? (
            <div className="flex flex-wrap gap-2 items-center">
              {search && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setSearch("")}
                  data-ocid="admin.students.badge_search"
                >
                  Search: {search} <X className="h-3 w-3" />
                </Badge>
              )}
              {courseFilter !== "All" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setCourseFilter("All")}
                  data-ocid="admin.students.badge_course"
                >
                  Course: {courseFilter} <X className="h-3 w-3" />
                </Badge>
              )}
              {membershipFilter !== "All" && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => setMembershipFilter("All")}
                  data-ocid="admin.students.badge_membership"
                >
                  Membership: {membershipFilter} <X className="h-3 w-3" />
                </Badge>
              )}
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={clearAll}
                data-ocid="admin.students.clear_filters_button"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>

        {/* Session expiry / error warning */}
        {(!adminTokenPresent || usersError) && !isLoading && (
          <div
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
            data-ocid="admin.students.session_warning"
          >
            <Search className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Admin session may have expired or failed to load students.{" "}
              <a
                href="/admin/login"
                className="font-semibold underline underline-offset-2 hover:text-amber-900"
              >
                Log in again
              </a>{" "}
              to restore access.
            </span>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#E8F4F8] border-b border-border">
                  {[
                    "Student",
                    "Student ID",
                    "Email",
                    "Phone",
                    "Course",
                    "College",
                    "Payment",
                    "Membership",
                    "Registered",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i} className="border-b border-border">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (users?.length ?? 0) === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-muted-foreground"
                      data-ocid="admin.students.empty_state"
                    >
                      {hasFilters
                        ? "No students match your filters."
                        : "No students registered yet."}
                    </td>
                  </tr>
                ) : (
                  (users ?? []).map((user, i) => {
                    const initials = user.name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr
                        key={user.studentId}
                        className="border-b border-border last:border-0 hover:bg-[#E8F4F8]/40 cursor-pointer transition-colors"
                        onClick={() => setSelected(user)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setSelected(user)
                        }
                        tabIndex={0}
                        data-ocid={`admin.students.item.${i + 1}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage
                                src={user.profileImageUrl || undefined}
                              />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {user.studentId}
                        </td>
                        <td
                          className="px-4 py-3 text-muted-foreground max-w-[160px] truncate"
                          title={user.phone}
                        >
                          {user.phone}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.phone}
                        </td>
                        <td className="px-4 py-3">{user.course}</td>
                        <td
                          className="px-4 py-3 text-muted-foreground max-w-[140px] truncate"
                          title={user.college}
                        >
                          {user.college}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              user.paymentStatus === "SUCCESS" ||
                              user.membershipStatus === "PAID"
                                ? "Paid"
                                : "unpaid"
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          {user.membershipStatus === "PAID" ? (
                            <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 text-xs">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                          onKeyUp={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                              title="View digital QR sheet for this student"
                              aria-label="View QR sheet"
                              onClick={() =>
                                window.open(
                                  `/student/qr/${user.studentId}`,
                                  "_blank",
                                  "noreferrer",
                                )
                              }
                              data-ocid={`admin.students.view_qr_button.${i + 1}`}
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              QR
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-sky-200 hover:bg-sky-50"
                              title="Edit Student"
                              onClick={() => {
                                setEditStudent(user);
                                setEditForm({
                                  firstName: user.firstName || "",
                                  middleName: user.middleName || "",
                                  grandFatherName: user.grandFatherName || "",
                                  surname: user.surname || "",
                                  phone: user.phone || "",
                                  email: user.email || "",
                                  aadhaarNumber: user.aadhaarNumber || "",
                                  course: user.course || "",
                                  academicYear: user.academicYear || "",
                                  profileImageUrl: user.profileImageUrl || "",
                                  membershipStatus:
                                    user.membershipStatus || "NOT_PAID",
                                  issueStatus: user.issuedBooksInfo?.some(
                                    (b) => !b.returned,
                                  )
                                    ? "ISSUED"
                                    : "NOT_ISSUED",
                                });
                              }}
                            >
                              <Pencil className="w-3 h-3 text-sky-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <StudentDetailSheet
        student={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
      <StudentQrModal open={qrOpen} onOpenChange={setQrOpen} />
      {editStudent && (
        <Dialog
          open={!!editStudent}
          onOpenChange={(open) => {
            if (!open) setEditStudent(null);
          }}
        >
          <DialogContent
            className="max-w-xl max-h-[90vh] overflow-y-auto"
            data-ocid="admin.students.edit_dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-sky-800 font-display">
                Edit Student
              </DialogTitle>
            </DialogHeader>

            {/* Student ID — display only */}
            <div className="bg-muted/40 rounded-lg px-3 py-2 flex items-center justify-between text-sm border border-border">
              <span className="text-muted-foreground font-medium">
                Student ID
              </span>
              <span className="font-mono font-semibold text-foreground">
                {editStudent.studentId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              {(
                [
                  ["firstName", "First Name"],
                  ["middleName", "Middle Name"],
                  ["grandFatherName", "Grandfather's Name"],
                  ["surname", "Surname"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["aadhaarNumber", "Aadhaar Number"],
                  ["course", "Course"],
                  ["academicYear", "Academic Year / Year"],
                ] as [string, string][]
              ).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    value={editForm[field] || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    className="h-8 text-sm border-sky-200"
                    data-ocid={`admin.students.edit_${field}_input`}
                  />
                </div>
              ))}

              {/* Photo URL — full width */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Photo URL
                </Label>
                <div className="flex gap-2 items-center">
                  {editForm.profileImageUrl && (
                    <img
                      src={editForm.profileImageUrl}
                      alt="Preview"
                      className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
                    />
                  )}
                  <Input
                    value={editForm.profileImageUrl || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        profileImageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://…"
                    className="h-8 text-sm border-sky-200"
                    data-ocid="admin.students.edit_photo_input"
                  />
                </div>
              </div>

              {/* Deposit Status */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Deposit Status
                </Label>
                <Select
                  value={editForm.membershipStatus || "NOT_PAID"}
                  onValueChange={(v) =>
                    setEditForm((prev) => ({ ...prev, membershipStatus: v }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm border-sky-200"
                    data-ocid="admin.students.edit_membership_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">PAID</SelectItem>
                    <SelectItem value="NOT_PAID">NOT PAID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Issue Status */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Issue Status
                </Label>
                <Select
                  value={editForm.issueStatus || "NOT_ISSUED"}
                  onValueChange={(v) =>
                    setEditForm((prev) => ({ ...prev, issueStatus: v }))
                  }
                >
                  <SelectTrigger
                    className="h-8 text-sm border-sky-200"
                    data-ocid="admin.students.edit_issue_status_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISSUED">ISSUED</SelectItem>
                    <SelectItem value="NOT_ISSUED">NOT ISSUED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-sky-200"
                onClick={() => setEditStudent(null)}
                data-ocid="admin.students.edit_cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateStudentMutation.isPending}
                className="bg-sky-600 hover:bg-sky-700 text-white"
                onClick={() => {
                  if (!editStudent) return;
                  updateStudentMutation.mutate(
                    {
                      userId: editStudent.studentId,
                      firstName: editForm.firstName || "",
                      middleName: editForm.middleName || "",
                      grandFatherName: editForm.grandFatherName || "",
                      surname: editForm.surname || "",
                      phone: editForm.phone || "",
                      aadhaar: editForm.aadhaarNumber || "",
                      course: editForm.course || "",
                      academicYear: editForm.academicYear || "",
                      membershipStatusText:
                        editForm.membershipStatus || "NOT_PAID",
                      issueStatusText: editForm.issueStatus || "NOT_ISSUED",
                    },
                    {
                      onSuccess: () => {
                        toast.success("Student updated successfully");
                        setEditStudent(null);
                      },
                      onError: (err: Error) =>
                        toast.error(err?.message || "Failed to update student"),
                    },
                  );
                }}
                data-ocid="admin.students.edit_save_button"
              >
                {updateStudentMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
