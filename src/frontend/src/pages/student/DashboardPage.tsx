import { StudentLayout } from "@/components/layout/StudentLayout";
import { ChallanHistory } from "@/components/student/ChallanHistory";
import { NotificationPanel } from "@/components/student/NotificationPanel";
import { ProfileCard } from "@/components/student/ProfileCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembershipStatus, useStudentAuth } from "@/hooks/useAuth";
import {
  useGetMyNotifications,
  useGetMyReservations,
  useGetStudentQrUrl,
  useGetUnreadCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyRequests,
  usePaymentStatus,
} from "@/hooks/useBackend";
import type { IssuedBookInfo, Notification, Reservation } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  GraduationCap,
  ListOrdered,
  Mail,
  QrCode,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

function QrCanvas({ data, size = 112 }: { data: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !data) return;
    QRCode.toCanvas(ref.current, data, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(console.error);
  }, [data, size]);
  return <canvas ref={ref} width={size} height={size} className="rounded-lg" />;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <Card className="border border-border hover-lift transition-smooth">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
              {label}
            </p>
            <p
              className={`text-2xl font-display font-bold truncate ${colorClass}`}
            >
              {value}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ${bgClass}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(ts: bigint | string | undefined): string {
  if (!ts) return "—";
  if (typeof ts === "string")
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysRemaining(
  returnDateTs: bigint | string | undefined,
): number | null {
  if (!returnDateTs) return null;
  const now = Date.now();
  const returnMs =
    typeof returnDateTs === "string"
      ? new Date(returnDateTs).getTime()
      : Number(returnDateTs) / 1_000_000;
  return Math.floor((returnMs - now) / (1000 * 60 * 60 * 24));
}

type Urgency = "overdue" | "urgent" | "warning" | "normal";
function getUrgency(days: number | null): Urgency {
  if (days === null) return "normal";
  if (days < 0) return "overdue";
  if (days <= 2) return "urgent";
  if (days <= 5) return "warning";
  return "normal";
}

const urgencyConfig: Record<
  Urgency,
  { label: string; className: string; icon: React.ElementType }
> = {
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
  },
  urgent: {
    label: "Due Soon",
    className: "bg-red-50 text-red-600 border-red-200",
    icon: AlertCircle,
  },
  warning: {
    label: "Due Soon",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  normal: {
    label: "On Time",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

function IssuedBookCard({
  book,
  index,
}: { book: IssuedBookInfo; index: number }) {
  const days = getDaysRemaining(book.returnDate);
  const urgency = book.returned ? "normal" : getUrgency(days);
  const cfg = urgencyConfig[urgency];
  const UrgencyIcon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.07 }}
    >
      <Card
        className="border border-border hover:border-primary/30 transition-smooth"
        data-ocid={`dashboard.issued_book.item.${index + 1}`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {book.bookTitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Issued:{" "}
                  {formatDate(book.issueDate)}
                </span>
                {book.returnDate && (
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3" /> Due:{" "}
                    {formatDate(book.returnDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {book.returned ? (
                <Badge className="bg-muted text-muted-foreground border-border gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Returned
                </Badge>
              ) : (
                <Badge className={`gap-1 font-medium border ${cfg.className}`}>
                  <UrgencyIcon className="h-3 w-3" />
                  {days !== null
                    ? days < 0
                      ? `${Math.abs(days)}d overdue`
                      : days === 0
                        ? "Due today"
                        : `${days}d left`
                    : "Issued"}
                </Badge>
              )}
            </div>
          </div>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/60"
        data-ocid={`dashboard.reservation.item.${index + 1}`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            Book ID:{" "}
            <span className="font-mono text-primary">
              {res.bookId.slice(-10)}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {res.queuePosition != null && (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <ListOrdered className="h-3 w-3" /> Position #
                {res.queuePosition} in queue
              </span>
            )}
            <span>Expected by: {availDate}</span>
          </div>
        </div>
        <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-300 gap-1">
          <Clock className="h-3 w-3" /> Waiting
        </Badge>
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    currentUser: user,
    isLoading: authLoading,
    userId,
  } = useStudentAuth();
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

  const { data: requests = [], isLoading: reqLoading } = useMyRequests();
  const { data: payment, isLoading: paymentLoading } = usePaymentStatus();
  const membershipStatus = useMembershipStatus();
  const { data: reservations = [] } = useGetMyReservations();
  const { data: qrUrlPath } = useGetStudentQrUrl(userId ?? "");
  const { data: notifications = [] } = useGetMyNotifications();
  const { data: unreadCount = 0 } = useGetUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [notifOpen, setNotifOpen] = useState(false);
  const qrData = qrUrlPath
    ? `${window.location.origin}${qrUrlPath}`
    : userId
      ? `${window.location.origin}/student/qr/${userId}`
      : "";
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Polling handled via refetchIntervalInBackground:false in hooks
  useEffect(() => {
    if (!authLoading) {
      const t = setTimeout(() => {
        sessionStorage.removeItem("svga_registration_complete");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  const isLoading = authLoading || paymentLoading;
  const isPaid = membershipStatus === "PAID" || !!payment;
  const issuedBooks: IssuedBookInfo[] = user?.issuedBooksInfo ?? [];
  const activeReservations = reservations.filter((r) => r.status === "Waiting");

  const maskedAadhaar = user?.aadhaarNumber
    ? `XXXX-XXXX-${user.aadhaarNumber.slice(-4)}`
    : null;

  const recentRequests = [...requests]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  const issuedCount = issuedBooks.length;
  const returnedCount = issuedBooks.filter((b) => b.returned).length;
  const activeCount = issuedCount - returnedCount;

  const paymentDate =
    payment &&
    new Date(payment.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <StudentLayout>
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={(id) => markRead.mutate(id)}
        onMarkAllRead={() => markAllRead.mutate()}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* Welcome Section */}
        {isLoading ? (
          <div className="rounded-2xl bg-gradient-to-br from-[#88D4E0] to-[#5AC8D8] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-full shrink-0 bg-white/30" />
              <div className="space-y-3">
                <Skeleton className="h-7 w-48 bg-white/30" />
                <Skeleton className="h-4 w-32 bg-white/30" />
                <Skeleton className="h-6 w-28 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-gradient-to-br from-[#88D4E0] to-[#5AC8D8] border-0 p-6 sm:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 blur-[60px] pointer-events-none" />
            {/* Notification bell */}
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors relative"
              aria-label="Open notifications"
              data-ocid="dashboard.notifications_bell"
            >
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
              <Avatar
                className="h-20 w-20 border-4 border-white/30 shadow-elevated shrink-0"
                data-ocid="dashboard.avatar"
              >
                {user?.profileImageUrl ? (
                  <AvatarImage
                    src={user.profileImageUrl}
                    alt={
                      [
                        user.firstName,
                        user.middleName,
                        user.grandFatherName,
                        user.surname,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      user.name ||
                      "Student"
                    }
                  />
                ) : null}
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                  {(user?.firstName || user?.name)?.charAt(0)?.toUpperCase() ??
                    "S"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    Welcome,{" "}
                    {user?.firstName || user?.name?.split(" ")[0] || "Student"}!
                    👋
                  </h1>
                  {isPaid ? (
                    <Badge className="bg-emerald-500 text-white border-emerald-400 gap-1 px-3 py-1 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active Member
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-400 text-amber-900 border-amber-300 gap-1 px-3 py-1 font-semibold">
                      <Clock className="h-3.5 w-3.5" /> Pending Payment
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  {user?.course && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> {user.course}
                    </span>
                  )}
                  {user?.academicYear && (
                    <span className="flex items-center gap-1 text-white/60">
                      <span className="text-xs">Year: {user.academicYear}</span>
                    </span>
                  )}
                  {maskedAadhaar && (
                    <span className="font-mono text-white/60 text-xs">
                      {maskedAadhaar}
                    </span>
                  )}
                  {user?.phone && (
                    <span className="flex items-center gap-1 text-white/60">
                      <span className="text-xs">📞 {user.phone}</span>
                    </span>
                  )}
                  {(user as typeof user & { email?: string })?.email && (
                    <span className="flex items-center gap-1 text-white/60">
                      <Mail className="h-3 w-3" />
                      <span className="text-xs">
                        {(user as typeof user & { email?: string }).email}
                      </span>
                    </span>
                  )}
                </div>
                {user?.studentId && (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs text-white/60">Student ID:</span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-sm tracking-wider bg-white/20 text-white border-white/30 px-3 py-1"
                      data-ocid="dashboard.student_id_badge"
                    >
                      {user.studentId}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {user && (
          <ProfileCard user={user} isPaid={isPaid} issuedCount={issuedCount} />
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-7 w-12" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.05 }}
              >
                <StatCard
                  label="Membership"
                  value={isPaid ? "Active" : "Pending"}
                  icon={CreditCard}
                  colorClass={isPaid ? "text-emerald-600" : "text-amber-600"}
                  bgClass={isPaid ? "bg-emerald-50" : "bg-amber-50"}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.1 }}
              >
                <StatCard
                  label="Total Issued"
                  value={String(issuedCount)}
                  icon={BookOpen}
                  colorClass="text-[#0ea5e9]"
                  bgClass="bg-[#e0f2fe]"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.15 }}
              >
                <StatCard
                  label="Currently Held"
                  value={String(activeCount)}
                  icon={ClipboardList}
                  colorClass="text-[#3b82f6]"
                  bgClass="bg-[#dbeafe]"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.2 }}
              >
                <StatCard
                  label="Reservations"
                  value={String(activeReservations.length)}
                  icon={Clock}
                  colorClass="text-amber-600"
                  bgClass="bg-amber-50"
                />
              </motion.div>
            </>
          )}
        </div>

        {/* Library Card / QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.25 }}
        >
          <Card
            className="border border-[#B8E0E8] bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe]"
            data-ocid="dashboard.qr_card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" /> Your Library Card
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {qrData ? (
                    <div className="rounded-xl bg-white border-2 border-[#B8E0E8] p-3 shadow-subtle">
                      <QrCanvas data={qrData} size={120} />
                    </div>
                  ) : (
                    <Skeleton className="w-[136px] h-[136px] rounded-xl" />
                  )}
                  <span className="text-[10px] text-muted-foreground text-center block max-w-[130px]">
                    Scan to view digital ID
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <p className="font-display font-bold text-foreground text-xl truncate">
                    {[
                      user?.firstName,
                      user?.middleName,
                      user?.grandFatherName,
                      user?.surname,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                      user?.name ||
                      ""}
                  </p>
                  <p className="font-mono text-primary text-sm font-bold tracking-widest">
                    {user?.studentId ?? ""}
                  </p>
                  {maskedAadhaar && (
                    <p className="font-mono text-xs text-muted-foreground">
                      {maskedAadhaar}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.course}
                    {user?.college ? ` · ${user.college}` : ""}
                  </p>
                  {isPaid ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active Member
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                      <Clock className="h-3 w-3" /> Pending Payment
                    </Badge>
                  )}
                  <div className="flex gap-2 pt-1 justify-center sm:justify-start">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-[#B8E0E8]"
                      onClick={() => setQrDialogOpen(true)}
                      data-ocid="dashboard.qr_card.view_button"
                    >
                      <QrCode className="h-3.5 w-3.5" /> View Full QR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-[#B8E0E8]"
                      onClick={() => {
                        if (!qrData) return;
                        QRCode.toDataURL(qrData, { width: 400, margin: 2 })
                          .then((url) => {
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `SVGA-QR-${user?.studentId ?? "student"}.png`;
                            a.click();
                          })
                          .catch(console.error);
                      }}
                      data-ocid="dashboard.qr_card.download_button"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Full-Screen Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent
            className="sm:max-w-sm"
            data-ocid="dashboard.qr_dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Your Student QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Show this to admin for book collection or return
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
                  {user?.studentId ?? ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user?.name}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (!qrData) return;
                  QRCode.toDataURL(qrData, { width: 400, margin: 2 })
                    .then((url) => {
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `SVGA-QR-${user?.studentId ?? "student"}.png`;
                      a.click();
                    })
                    .catch(console.error);
                }}
                data-ocid="dashboard.qr_dialog.download_button"
              >
                <Download className="h-4 w-4" /> Download QR
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Issued Books Section */}
        {!isLoading && issuedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Issued Books
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {activeCount} active · {returnedCount} returned
              </Badge>
            </div>
            <div className="space-y-3">
              {issuedBooks.map((book, idx) => (
                <IssuedBookCard key={book.requestId} book={book} index={idx} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Pending Reservations */}
        {!isLoading && activeReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Pending
                Reservations
              </h2>
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs font-mono">
                {activeReservations.length} waiting
              </Badge>
            </div>
            <div className="space-y-2">
              {activeReservations.map((res, idx) => (
                <ReservationCard key={res.id} res={res} index={idx} />
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment + Quick Actions */}
          <div className="space-y-4">
            <Card
              className="border border-border"
              data-ocid="dashboard.payment_card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> Membership
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : payment ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Membership Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ₹500 membership deposit paid on {paymentDate}
                    </p>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-2">
                      <p className="text-xs text-emerald-700">
                        You can borrow books for the duration of your course.
                        Return books before your course ends.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        Payment Pending
                      </p>
                      <p className="text-xs text-amber-700">
                        Pay ₹500 refundable deposit to activate membership.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => navigate({ to: "/student/register" })}
                      data-ocid="dashboard.pay_now_button"
                    >
                      Pay ₹500 Deposit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    label: "Browse & Request Books",
                    icon: BookOpen,
                    path: "/student/books" as const,
                    ocid: "dashboard.browse_books_button",
                  },
                  {
                    label: "View My Requests",
                    icon: ClipboardList,
                    path: "/student/requests" as const,
                    ocid: "dashboard.my_requests_button",
                  },
                  {
                    label: "My Account",
                    icon: User,
                    path: "/student/account" as const,
                    ocid: "dashboard.account_button",
                  },
                ].map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full justify-between group"
                    onClick={() =>
                      action.path === "/student/books"
                        ? navigate({
                            to: "/student/books",
                            search: {
                              author: "All",
                              edition: "All",
                              category: "All",
                              sort: "title-asc",
                            },
                          })
                        : navigate({
                            to: action.path as
                              | "/student/requests"
                              | "/student/account",
                          })
                    }
                    data-ocid={action.ocid}
                  >
                    <span className="flex items-center gap-2">
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Challan History — always visible */}
          <ChallanHistory requests={requests} isLoading={reqLoading} />

          {/* Recent Requests */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-foreground">
                Recent Requests
              </h2>
              {requests.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/student/requests" })}
                  data-ocid="dashboard.view_all_requests"
                >
                  View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>

            {reqLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border border-border">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <Card className="border border-dashed border-border">
                <CardContent
                  className="p-10 text-center"
                  data-ocid="dashboard.empty_state"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-primary/60" />
                  </div>
                  <p className="font-medium text-foreground mb-1">
                    No requests yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse the library and submit your first book request.
                  </p>
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
                    data-ocid="dashboard.empty.browse_button"
                  >
                    Request Books
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req, idx) => (
                  <motion.div
                    key={req.requestId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.08 }}
                  >
                    <Card
                      className="border border-border hover:border-primary/30 transition-smooth"
                      data-ocid={`dashboard.request.item.${idx + 1}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                Request #{req.requestId.slice(-6).toUpperCase()}
                              </span>
                              <StatusBadge status={req.status} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {req.selectedBookIds.length > 0 &&
                                `${req.selectedBookIds.length} library book(s)`}
                              {req.requestedBooks.length > 0 &&
                                ` · ${req.requestedBooks.length} custom request(s)`}
                              {" · "}
                              {new Date(req.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() =>
                              navigate({
                                to: `/student/challan/${req.requestId}`,
                              })
                            }
                            data-ocid={`dashboard.request.view_button.${idx + 1}`}
                          >
                            View Challan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                <Separator />
                <div className="text-center pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: "/student/requests" })}
                    data-ocid="dashboard.view_all_link"
                  >
                    View all {requests.length} requests
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </StudentLayout>
  );
}
