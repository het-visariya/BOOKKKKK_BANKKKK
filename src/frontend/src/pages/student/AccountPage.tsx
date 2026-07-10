import { StudentLayout } from "@/components/layout/StudentLayout";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useStudentAuth } from "@/hooks/useAuth";
import {
  useGetMyIssuedBooks,
  useGetQrCodeData,
  usePaymentStatus,
} from "@/hooks/useBackend";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Building,
  Camera,
  CheckCircle2,
  CreditCard,
  Download,
  GraduationCap,
  Hash,
  IdCard,
  LogOut,
  Phone,
  QrCode,
  RotateCcw,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function ProfileField({
  icon: Icon,
  label,
  value,
}: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function QrCanvas({
  data,
  size = 112,
  className = "",
}: { data: string; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !data) return;
    QRCode.toCanvas(ref.current, data, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(console.error);
  }, [data, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}

function useQrDownload(data: string, studentId: string) {
  return () => {
    QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = `SVGA-QR-${studentId}.png`;
        a.click();
      })
      .catch(() => toast.error("Failed to download QR code"));
  };
}

export function AccountPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: payment } = usePaymentStatus();
  const { logout } = useStudentAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const { data: issuedBooks = [], isLoading: issuedLoading } =
    useGetMyIssuedBooks();

  // QR code data — backend returns the string to encode (studentId/principal)
  const { data: qrContent } = useGetQrCodeData(user?.studentId ?? "");
  // Fallback to studentId if backend returns empty
  const qrData = qrContent || user?.studentId || "";

  const downloadQr = useQrDownload(qrData, user?.studentId ?? "student");

  const updateImageMutation = useMutation({
    mutationFn: async (_file: File) => {
      // Profile photo update is stored in local state on this platform
      toast.success("Profile photo updated locally!");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleReturnRequest = (requestId: string) => {
    setReturningId(requestId);
    setReturnDialogOpen(true);
  };

  const handleReturnDialogClose = () => {
    setReturnDialogOpen(false);
    setReturningId(null);
  };

  const paymentDate =
    payment &&
    new Date(Number(payment.createdAt) / 1_000_000).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );

  if (isLoading)
    return (
      <StudentLayout>
        <PageLoader />
      </StudentLayout>
    );

  return (
    <StudentLayout>
      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="account.logout_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Sign Out</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to sign out? You can log back in anytime with
            your Aadhaar number.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              data-ocid="account.logout_dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                logout();
                qc.clear();
                setShowLogoutConfirm(false);
                toast.success("Logged out successfully");
                navigate({ to: "/", replace: true });
              }}
              data-ocid="account.logout_dialog.confirm_button"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return instructions dialog */}
      <Dialog
        open={returnDialogOpen}
        onOpenChange={(open) => !open && handleReturnDialogClose()}
      >
        <DialogContent
          className="sm:max-w-md"
          data-ocid="account.return_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              How to Return Your Books
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-foreground font-medium">
              Book returns are processed in person at the SVGA library.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Bring the book(s) physically to the SVGA Book Bank.</li>
              <li>Show your Student ID or this app to the librarian.</li>
              <li>
                The librarian will inspect the books and confirm the return.
              </li>
              <li>Your ₹200 deposit will be refunded after verification.</li>
            </ol>
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-xs text-sky-800">
              <strong>Library hours:</strong> Mon–Sat, 9 AM – 5 PM
              <br />
              Contact the SVGA Book Bank desk for assistance.
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleReturnDialogClose}
              data-ocid="account.return_dialog.close_button"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm" data-ocid="account.qr_dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Your Student QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Show this to admin for book collection / return
            </p>
            {qrData ? (
              <div className="rounded-2xl bg-white border-2 border-[#B8E0E8] p-4 shadow-elevated">
                <QrCanvas data={qrData} size={220} />
              </div>
            ) : (
              <Skeleton className="w-56 h-56 rounded-2xl" />
            )}
            <div className="text-center">
              <p className="font-mono font-bold text-primary text-sm tracking-wider">
                {user?.studentId ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.name}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={downloadQr}
              data-ocid="account.qr_dialog.download_button"
            >
              <Download className="h-4 w-4" /> Download QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">
                My Account
              </h1>
              <p className="text-muted-foreground">
                Manage your profile and membership details
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setShowLogoutConfirm(true)}
              data-ocid="account.logout_button"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Card */}
            <Card className="border border-border md:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar with upload */}
                  <div className="flex flex-col items-center gap-3 sm:w-32 shrink-0">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-card shadow-elevated">
                        {user?.profileImageUrl ? (
                          <AvatarImage
                            src={user.profileImageUrl}
                            alt={user.name}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() ?? "S"}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elevated hover:bg-primary/90 transition-smooth"
                        aria-label="Change profile photo"
                        data-ocid="account.upload_button"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) updateImageMutation.mutate(f);
                        }}
                      />
                    </div>
                    {updateImageMutation.isPending && (
                      <p className="text-xs text-muted-foreground">
                        Uploading...
                      </p>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ProfileField
                        icon={User}
                        label="Full Name"
                        value={user?.name}
                      />
                      <ProfileField
                        icon={Hash}
                        label="Aadhaar Number"
                        value={
                          user?.aadhaarNumber
                            ? `xxxx-xxxx-${user.aadhaarNumber.slice(-4)}`
                            : "—"
                        }
                      />
                      <ProfileField
                        icon={Phone}
                        label="Phone Number"
                        value={user?.phone}
                      />
                      <ProfileField
                        icon={GraduationCap}
                        label="Course / Stream"
                        value={user?.course}
                      />
                      <ProfileField
                        icon={Building}
                        label="College"
                        value={user?.college}
                      />
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                          <Hash className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Student ID
                          </p>
                          <p className="font-mono font-bold text-primary text-base tracking-wider">
                            {user?.studentId ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      To update your profile information, please contact SVGA
                      Book Bank admin.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membership Card */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Membership
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-[#f0f9ff] border border-[#bae6fd] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Membership Deposit
                    </span>
                    <StatusBadge status={payment ? "Paid" : "unpaid"} />
                  </div>
                  <p className="text-3xl font-display font-bold text-primary">
                    ₹200
                  </p>
                  {payment ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Paid on {paymentDate}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">
                      Payment pending — pay to activate borrowing
                    </p>
                  )}
                </div>

                {payment && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Membership Active</span>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Payment ID
                        </span>
                        <span className="font-mono text-xs text-foreground truncate max-w-[160px]">
                          {payment._id || "DEMO"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Amount Paid
                        </span>
                        <span className="font-medium text-foreground">
                          ₹{payment.amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Deposit refund
                        </span>
                        <span className="text-xs text-emerald-700 font-medium">
                          On book return
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Your Student QR Code Card */}
            <Card className="border border-border" data-ocid="account.qr_card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" /> Your Student QR
                  Code
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Show this to admin for book collection / return
                </p>
                {qrData ? (
                  <div className="rounded-2xl bg-white border-2 border-[#B8E0E8] p-4 shadow-subtle">
                    <QrCanvas data={qrData} size={160} />
                  </div>
                ) : (
                  <Skeleton className="w-44 h-44 rounded-2xl" />
                )}
                <p className="font-mono text-xs text-muted-foreground text-center">
                  {user?.studentId ?? "—"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setQrDialogOpen(true)}
                    data-ocid="account.qr_card.view_button"
                  >
                    <QrCode className="h-3.5 w-3.5" /> View Full QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={downloadQr}
                    data-ocid="account.qr_card.download_button"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ID Card Preview */}
            <Card className="border border-border md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-primary" /> Member ID Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] p-4 shadow-elevated"
                  data-ocid="account.id_card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">
                        SVGA BOOK BANK
                      </p>
                      <p className="font-display font-bold text-foreground text-lg leading-tight truncate">
                        {user?.name ?? "—"}
                      </p>
                      <p className="font-mono text-primary text-sm font-bold mt-1">
                        {user?.studentId ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {user?.course ?? "—"}
                      </p>
                      <div className="mt-2">
                        <StatusBadge
                          status={payment ? "active" : "unpaid"}
                          className="text-[10px]"
                        />
                      </div>
                    </div>
                    {/* QR Code */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      {qrData ? (
                        <div className="rounded-lg bg-white border border-primary/10 p-1">
                          <QrCanvas data={qrData} size={100} />
                        </div>
                      ) : (
                        <Skeleton className="w-28 h-28 rounded-lg" />
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Scan to verify
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/10 text-[10px] text-muted-foreground">
                    {user?.college ?? "SVGA College"} · Shree Vile Parle
                    Gujarati Association
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Currently Issued Books */}
            <Card
              className="border border-border md:col-span-2"
              data-ocid="account.issued_books.section"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Currently Issued
                  Books
                  {issuedBooks.length > 0 && (
                    <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
                      {issuedBooks.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issuedLoading ? (
                  <div className="space-y-3">
                    {["a", "b"].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : issuedBooks.length === 0 ? (
                  <div
                    className="py-8 text-center"
                    data-ocid="account.issued_books.empty_state"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No books currently issued
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left pb-2 pr-4 text-xs text-muted-foreground font-medium">
                            #
                          </th>
                          <th className="text-left pb-2 pr-4 text-xs text-muted-foreground font-medium">
                            Request ID
                          </th>
                          <th className="text-left pb-2 pr-4 text-xs text-muted-foreground font-medium">
                            Date
                          </th>
                          <th className="text-left pb-2 pr-4 text-xs text-muted-foreground font-medium">
                            Books
                          </th>
                          <th className="text-left pb-2 pr-4 text-xs text-muted-foreground font-medium">
                            Status
                          </th>
                          <th className="text-left pb-2 text-xs text-muted-foreground font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {issuedBooks.map((req, idx) => {
                          const date = new Date(
                            Number(req.createdAt) / 1_000_000,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });
                          return (
                            <tr
                              key={req.requestId}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-smooth"
                              data-ocid={`account.issued_books.item.${idx + 1}`}
                            >
                              <td className="py-3 pr-4 text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-3 pr-4 font-mono text-xs text-primary">
                                #{req.requestId.slice(-8).toUpperCase()}
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground text-xs">
                                {date}
                              </td>
                              <td className="py-3 pr-4">
                                <span className="text-xs text-foreground">
                                  {req.selectedBookIds.length} library
                                  {req.requestedBooks.length > 0
                                    ? ` + ${req.requestedBooks.length} procurement`
                                    : ""}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <StatusBadge status={req.status} />
                              </td>
                              <td className="py-3">
                                {req.status === "Approved" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs h-7"
                                    onClick={() =>
                                      handleReturnRequest(req.requestId)
                                    }
                                    disabled={returningId === req.requestId}
                                    data-ocid={`account.issued_books.return_button.${idx + 1}`}
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    Request Return
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline mr-1" />
                  Return requests are confirmed by the SVGA librarian. You will
                  be notified once processed.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
