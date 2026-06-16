import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/hooks/useAuth";
import {
  useAdminPendingCount,
  useAllRequests,
  useAnalyticsData,
  useGetAdminNotifications,
  useGetAdminUnreadCount,
  useGetAllProcurements,
  useGetBookLifecycleFlow,
  useGetCollectionQueue,
  useGetReturnTimeline,
} from "@/hooks/useBackend";
import type { BookRequest, ReturnUrgency } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  BookMarked,
  BookMinus,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  LogIn,
  PackageCheck,
  RotateCcw,
  Settings,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ─── Notification Drawer ───────────────────────────────────────────

function AdminNotificationDrawer() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useGetAdminNotifications();
  const { data: unreadCount } = useGetAdminUnreadCount();

  const displayNotifs = (notifications ?? []).slice(0, 20);
  const count = unreadCount ?? 0;

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative gap-1.5 text-xs h-8"
        onClick={() => setOpen(true)}
        data-ocid="admin.notifications.open_modal_button"
        aria-label="View notifications"
      >
        <Bell className="h-3.5 w-3.5" />
        Notifications
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className="w-full sm:max-w-md overflow-y-auto"
          data-ocid="admin.notifications.dialog"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display flex items-center gap-2">
              <Bell className="h-4 w-4" /> Admin Notifications
              {count > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {count} unread
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {displayNotifs.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-16 text-center"
              data-ocid="admin.notifications.empty_state"
            >
              <Bell className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-2 pr-2">
                {displayNotifs.map((notif, i) => (
                  <div
                    key={notif.id}
                    className={`rounded-xl border p-3 text-sm transition-colors ${
                      notif.isRead
                        ? "bg-muted/30 border-border"
                        : "bg-sky-50 border-sky-200"
                    }`}
                    data-ocid={`admin.notifications.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-semibold text-foreground text-sm leading-snug ${
                          !notif.isRead ? "text-sky-900" : ""
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                        {formatRelativeTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.message}
                    </p>
                    {!notif.isRead && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 font-semibold mt-1">
                        • Unread
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Book Flow Overview ───────────────────────────────────────────────

const FLOW_URGENCY_CLS: Record<string, string> = {
  overdue: "text-red-600 font-semibold",
  urgent: "text-red-600 font-semibold",
  warning: "text-amber-600 font-semibold",
  normal: "text-emerald-600",
};

function BookFlowOverview() {
  const { data: flow, isLoading } = useGetBookLifecycleFlow();

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getDaysDiff = (iso?: string) => {
    if (!iso) return null;
    return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  };

  const urgencyKey = (days: number | null) => {
    if (days === null) return "normal";
    if (days < 0) return "overdue";
    if (days <= 2) return "urgent";
    if (days <= 5) return "warning";
    return "normal";
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!flow || flow.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground text-center py-8"
        data-ocid="admin.book_flow.empty_state"
      >
        No active book assignments tracked yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="bg-sky-50 border-b border-border">
            {[
              "Book",
              "Currently With",
              "Return Date",
              "Next Reserved Student",
              "Status",
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
          {flow.map((item, i) => {
            const days = getDaysDiff(item.currentHolder?.returnDate);
            const uKey = urgencyKey(days);
            const urgencyCls = FLOW_URGENCY_CLS[uKey] ?? "text-emerald-600";
            const statusLabel = !item.currentHolder
              ? "🟢 Available"
              : uKey === "overdue"
                ? "🔴 Overdue"
                : uKey === "urgent" || uKey === "warning"
                  ? "🟡 Due Soon"
                  : "🟢 Active";
            return (
              <tr
                key={item.bookId}
                className="border-b border-border last:border-0 hover:bg-sky-50/30 transition-colors"
                data-ocid={`admin.book_flow.item.${i + 1}`}
              >
                <td className="px-4 py-3 font-medium text-foreground max-w-[180px]">
                  <p className="truncate">{item.bookTitle}</p>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {item.currentHolder ? (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span>{item.currentHolder.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className={`px-4 py-3 ${urgencyCls}`}>
                  {fmtDate(item.currentHolder?.returnDate)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {item.nextReservedStudent ? (
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{item.nextReservedStudent.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      !item.currentHolder
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : uKey === "overdue"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : uKey === "urgent" || uKey === "warning"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-sky-100 text-sky-700 border-sky-200"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

function getUrgencyFromDays(days: number): ReturnUrgency {
  if (days < 0) return "overdue";
  if (days <= 2) return "urgent";
  if (days <= 5) return "warning";
  return "normal";
}

function getRequestStatusCounts(requests: BookRequest[]) {
  return requests.reduce(
    (acc, r) => {
      const key = r.status as keyof typeof acc;
      if (key in acc) acc[key]++;
      return acc;
    },
    { Pending: 0, Approved: 0, Procured: 0, Rejected: 0, Returned: 0 },
  );
}

const URGENCY_BORDER: Record<string, string> = {
  overdue: "border-l-4 border-l-red-500 bg-red-50",
  urgent: "border-l-4 border-l-red-400 bg-red-50/70",
  warning: "border-l-4 border-l-yellow-400 bg-yellow-50/60",
  normal: "border-l-4 border-l-green-400 bg-green-50/60",
};

const URGENCY_BADGE: Record<string, string> = {
  overdue: "bg-red-100 text-red-700 border border-red-200",
  urgent: "bg-red-100 text-red-700 border border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  normal: "bg-green-100 text-green-700 border border-green-200",
};

const quickNavCards = [
  {
    label: "Students",
    desc: "Manage registered members",
    icon: Users,
    path: "/admin/students",
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Inventory",
    desc: "Books & availability",
    icon: BookOpen,
    path: "/admin/inventory",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Requests",
    desc: "Review & approve loans",
    icon: ClipboardList,
    path: "/admin/requests",
    color: "text-amber-600 bg-amber-50",
  },
  {
    label: "Settings",
    desc: "Manage system settings",
    icon: Settings,
    path: "/admin/settings",
    color: "text-purple-600 bg-purple-50",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number | bigint | undefined;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-body">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-display font-bold text-foreground mt-1">
                {value !== undefined ? Number(value) : 0}
              </p>
            )}
          </div>
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { getToken } = useAdminAuth();

  // Redirect to login immediately if admin token is missing or expired
  const adminToken = getToken();
  const tokenValid = !!adminToken;

  // ─── New-request toast notification ───────────────────────────────
  const { data: pendingCount } = useAdminPendingCount();
  const prevPendingRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (pendingCount === undefined) return;
    const prev = prevPendingRef.current;
    if (prev !== undefined && pendingCount > prev) {
      const diff = pendingCount - prev;
      toast(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground">
            {diff === 1
              ? "New book request received"
              : `${diff} new book requests received`}
          </span>
          <button
            type="button"
            className="text-xs text-primary font-semibold hover:underline text-left"
            onClick={() =>
              navigate({
                to: "/admin/requests",
                search: {
                  search: "",
                  status: "",
                  course: "",
                  dateFrom: "",
                  dateTo: "",
                },
              })
            }
          >
            View requests →
          </button>
        </div>,
        {
          duration: 8_000,
          position: "bottom-right",
          dismissible: true,
          icon: <Bell className="h-4 w-4 text-sky-600" />,
        },
      );
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, navigate]);

  useEffect(() => {
    if (!tokenValid) {
      navigate({ to: "/admin/login" });
    }
  }, [tokenValid, navigate]);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
  } = useAnalyticsData();
  const {
    data: requests,
    isLoading: requestsLoading,
    isError: requestsError,
  } = useAllRequests();
  const { data: timeline, isLoading: timelineLoading } = useGetReturnTimeline();
  const { data: collectionQueue = [] } = useGetCollectionQueue();
  const { data: procurements } = useGetAllProcurements();

  // Refresh all admin data on mount to ensure latest data is shown
  useEffect(() => {
    if (!tokenValid) return;
    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    queryClient.invalidateQueries({ queryKey: ["allRequests"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["returnTimeline"] });
  }, [queryClient, tokenValid]);

  // Detect if we got errors back (likely session expired mid-session)
  const sessionMaybeExpired =
    (!analyticsLoading && analyticsError) ||
    (!requestsLoading && requestsError);

  const loading = analyticsLoading;

  const totalStudents = analytics?.totalStudents;
  const totalBooks = analytics?.totalBooks;
  const pendingRequests = analytics?.pendingRequests;
  const approvedRequests = analytics?.approvedRequests;
  const rejectedRequests = analytics?.rejectedRequests;
  const _returnedRequests = analytics?.returnedRequests;
  const lowStockBooks = analytics?.lowStockBooks;
  const totalProcurements = procurements?.length ?? 0;
  const pendingProcurementsCount = (procurements ?? []).filter(
    (p) => p.status === "Pending",
  ).length;

  const statusCounts = requests ? getRequestStatusCounts(requests) : null;

  const barData = (analytics?.requestsOverTime ?? [])
    .slice(-30)
    .map(([label, count]) => ({ label, count: Number(count) }));

  const pieData = (analytics?.booksByCategory ?? []).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const recentRequests = [...(requests ?? [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  const hasUrgent =
    !timelineLoading &&
    (timeline ?? []).some(
      (item) => item.daysRemaining !== undefined && item.daysRemaining <= 2,
    );

  const formatDate = (ts: string | undefined) =>
    ts
      ? new Date(ts).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 overflow-x-hidden"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              SVGA Book Bank — Admin Control Panel
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AdminNotificationDrawer />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["allUsers"] });
                queryClient.invalidateQueries({ queryKey: ["allRequests"] });
                queryClient.invalidateQueries({ queryKey: ["analytics"] });
                queryClient.invalidateQueries({ queryKey: ["returnTimeline"] });
                queryClient.invalidateQueries({
                  queryKey: ["bookLifecycleFlow"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["adminNotifications"],
                });
              }}
              data-ocid="admin.dashboard.refresh_button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            {hasUrgent && (
              <div
                className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700"
                data-ocid="admin.urgent_returns_badge"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">
                  Urgent returns pending
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session expiry warning — only show if data fetch errors, token was valid on load */}
        {sessionMaybeExpired && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
            data-ocid="admin.dashboard.session_warning"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="flex-1">
              Data could not be loaded. Your admin session may have expired.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-7 border-amber-400 text-amber-800 hover:bg-amber-100"
              onClick={() => navigate({ to: "/admin/login" })}
              data-ocid="admin.dashboard.relogin_button"
            >
              <LogIn className="h-3.5 w-3.5" />
              Log in again
            </Button>
          </motion.div>
        )}

        {/* 6 stats — 1 col mobile, 2 cols tablet, 3 cols md, 6 cols xl */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4"
          data-ocid="admin.stats_section"
        >
          <StatCard
            label="Total Students"
            value={loading ? undefined : totalStudents}
            icon={Users}
            color="text-blue-600 bg-blue-50"
            loading={loading}
          />
          <StatCard
            label="Total Books"
            value={loading ? undefined : totalBooks}
            icon={BookOpen}
            color="text-emerald-600 bg-emerald-50"
            loading={loading}
          />
          <StatCard
            label="Pending"
            value={loading ? undefined : pendingRequests}
            icon={BookMarked}
            color="text-amber-600 bg-amber-50"
            loading={loading}
          />
          <StatCard
            label="Approved"
            value={loading ? undefined : approvedRequests}
            icon={CheckCircle}
            color="text-teal-600 bg-teal-50"
            loading={loading}
          />
          <StatCard
            label="Rejected"
            value={loading ? undefined : rejectedRequests}
            icon={XCircle}
            color="text-red-600 bg-red-50"
            loading={loading}
          />
          <StatCard
            label="Low Stock"
            value={loading ? undefined : lowStockBooks}
            icon={AlertTriangle}
            color="text-orange-600 bg-orange-50"
            loading={loading}
          />
          <StatCard
            label="Procurements"
            value={loading ? undefined : totalProcurements}
            icon={PackageCheck}
            color="text-indigo-600 bg-indigo-50"
            loading={loading}
          />
          <StatCard
            label="Pending Proc."
            value={loading ? undefined : pendingProcurementsCount}
            icon={ClipboardList}
            color="text-rose-600 bg-rose-50"
            loading={loading}
          />
        </div>

        {/* Request status overview — 1 col mobile, 2 sm, 4 lg */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          data-ocid="admin.request_overview_section"
        >
          {(
            [
              {
                label: "Pending",
                key: "Pending",
                color: "text-amber-700",
                bg: "bg-amber-50 border-amber-100",
                icon: BookMarked,
              },
              {
                label: "Approved",
                key: "Approved",
                color: "text-teal-700",
                bg: "bg-teal-50 border-teal-100",
                icon: CheckCircle,
              },
              {
                label: "Procured",
                key: "Procured",
                color: "text-blue-700",
                bg: "bg-blue-50 border-blue-100",
                icon: PackageCheck,
              },
              {
                label: "Returned",
                key: "Returned",
                color: "text-indigo-700",
                bg: "bg-indigo-50 border-indigo-100",
                icon: RotateCcw,
              },
            ] as const
          ).map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className={`border ${item.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-body">
                        {item.label}
                      </p>
                      {requestsLoading ? (
                        <Skeleton className="h-7 w-12 mt-1" />
                      ) : (
                        <p className="text-2xl font-display font-bold text-foreground mt-0.5">
                          {statusCounts?.[item.key] ?? 0}
                        </p>
                      )}
                    </div>
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${item.bg.split(" ")[0]} ${item.color}`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts row — full width on mobile, 3 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Bar chart — requests over time */}
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
              <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Requests Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-5">
              {analyticsLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : barData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={barData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      angle={-40}
                      textAnchor="end"
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Requests"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie chart — books by category */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
              <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-primary" />
                Books by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-5">
              {analyticsLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : pieData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              PIE_COLORS[
                                pieData.indexOf(entry) % PIE_COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                    {pieData.map((item, idx) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{
                              background: PIE_COLORS[idx % PIE_COLORS.length],
                            }}
                          />
                          <span className="truncate text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-medium ml-2">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent requests */}
        <Card className="border-border overflow-hidden">
          <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-display font-semibold text-foreground">
                Recent Requests
              </CardTitle>
              <Link
                to="/admin/requests"
                search={{
                  search: "",
                  status: "All",
                  course: "All",
                  dateFrom: "",
                  dateTo: "",
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  data-ocid="admin.recent_requests.view_all_link"
                >
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {requestsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : requestsError ? (
              <p
                className="text-center text-destructive py-8 text-sm font-body"
                data-ocid="admin.recent_requests.error_state"
              >
                Failed to load requests — admin session may have expired.
              </p>
            ) : recentRequests.length === 0 ? (
              <p
                className="text-center text-muted-foreground py-8 text-sm font-body"
                data-ocid="admin.recent_requests.empty_state"
              >
                No requests yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground">
                        Student
                      </th>
                      <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                        Course
                      </th>
                      <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground">
                        Books
                      </th>
                      <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                        Date
                      </th>
                      <th className="text-left px-3 sm:px-4 py-3 font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req, i) => (
                      <tr
                        key={req.requestId}
                        className="border-b border-border last:border-0 hover:bg-sky-50/30 transition-colors"
                        data-ocid={`admin.recent_requests.item.${i + 1}`}
                      >
                        <td className="px-3 sm:px-4 py-3 font-medium text-foreground text-sm">
                          {req.studentName || `${req.userId.slice(0, 8)}…`}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                          {req.studentCourse || "—"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center text-muted-foreground text-sm">
                          {req.selectedBookIds.length +
                            req.requestedBooks.length}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-muted-foreground whitespace-nowrap text-xs hidden md:table-cell">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <Link
                            to="/admin/requests"
                            search={{
                              search: "",
                              status: "All",
                              course: "All",
                              dateFrom: "",
                              dateTo: "",
                            }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              data-ocid={`admin.recent_requests.view_button.${i + 1}`}
                            >
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collection Queue */}
        <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
          <div className="px-6 py-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-gray-800">Collection Queue</h3>
            <span className="ml-auto text-xs text-gray-500">
              Approved books awaiting student pickup
            </span>
          </div>
          {collectionQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sky-600 text-white">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Student</th>
                    <th className="text-left px-4 py-2 font-medium">ID</th>
                    <th className="text-left px-4 py-2 font-medium">Book</th>
                    <th className="text-left px-4 py-2 font-medium">
                      Approved
                    </th>
                    <th className="text-left px-4 py-2 font-medium">
                      Deadline
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...collectionQueue]
                    .sort(
                      (a: any, b: any) =>
                        Number(a.collectionDeadline) -
                        Number(b.collectionDeadline),
                    )
                    .map((entry: any, i: number) => {
                      const deadlineMs =
                        Number(entry.collectionDeadline) / 1_000_000;
                      const daysLeft = (deadlineMs - Date.now()) / 86400000;
                      const rowBg =
                        daysLeft < 0
                          ? "bg-red-50"
                          : daysLeft < 2
                            ? "bg-yellow-50"
                            : i % 2 === 0
                              ? "bg-white"
                              : "bg-sky-50/30";
                      return (
                        <tr
                          key={entry.entryId || entry.requestId || `cq-${i}`}
                          className={rowBg}
                        >
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {entry.studentName}
                          </td>
                          <td className="px-4 py-2 font-mono text-sky-700 text-xs">
                            {entry.studentId}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {entry.bookTitle}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {new Date(
                              Number(entry.approvalDate) / 1_000_000,
                            ).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${daysLeft < 0 ? "bg-red-100 text-red-700" : daysLeft < 2 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                            >
                              {daysLeft < 0
                                ? "Overdue"
                                : `${Math.ceil(daysLeft)}d left`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No books pending collection
            </div>
          )}
        </div>

        {/* Return Timeline — placed here so it's visible above charts on mobile */}
        <div data-ocid="admin.return_timeline.section">
          <h2 className="text-base font-display font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Return Timeline
          </h2>

          {hasUrgent && (
            <div
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-3 mb-4 text-sm text-red-700"
              data-ocid="admin.return_timeline.alert_banner"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">
                ⚠️ Some books are overdue or due within 2 days — immediate action
                required.
              </span>
            </div>
          )}

          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
              <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Upcoming Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {timelineLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : !timeline || timeline.length === 0 ? (
                <p
                  className="text-center text-muted-foreground py-10 text-sm font-body"
                  data-ocid="admin.return_timeline.empty_state"
                >
                  No active loans tracked yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {[...timeline]
                    .sort((a, b) => {
                      const aMs = a.returnDate
                        ? new Date(a.returnDate).getTime()
                        : Number.MAX_SAFE_INTEGER;
                      const bMs = b.returnDate
                        ? new Date(b.returnDate).getTime()
                        : Number.MAX_SAFE_INTEGER;
                      return aMs - bMs;
                    })
                    .map((item, i) => {
                      const days = item.daysRemaining ?? 0;
                      const urgencyKey =
                        item.urgency === "red"
                          ? "urgent"
                          : item.urgency === "yellow"
                            ? "warning"
                            : item.urgency === "overdue"
                              ? "overdue"
                              : "normal";
                      const urgency = getUrgencyFromDays(days);
                      const returnMs = item.returnDate
                        ? new Date(item.returnDate).getTime()
                        : null;
                      const cardClass =
                        URGENCY_BORDER[urgencyKey] ??
                        "border-l-4 border-l-muted bg-muted/20";
                      const badgeClass =
                        URGENCY_BADGE[urgencyKey] ??
                        "bg-muted text-muted-foreground border border-border";
                      const urgencyLabel =
                        urgency === "overdue"
                          ? "Overdue"
                          : urgency === "urgent"
                            ? `Due in ${days}d`
                            : urgency === "warning"
                              ? `Due in ${days}d`
                              : `${days}d left`;
                      return (
                        <div
                          key={`${item.requestId}-${i}`}
                          className={`px-3 sm:px-4 py-3 transition-colors ${cardClass}`}
                          data-ocid={`admin.return_timeline.item.${i + 1}`}
                        >
                          {/* Mobile: stacked layout */}
                          <div className="flex flex-col gap-1.5 sm:hidden">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-foreground text-sm truncate">
                                {item.studentName}
                              </p>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}
                              >
                                {urgencyLabel}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.bookTitle}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {returnMs && (
                                <span>
                                  Return:{" "}
                                  {new Date(returnMs).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Desktop: row layout */}
                          <div className="hidden sm:flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground text-sm truncate">
                                  {item.studentName}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {item.bookTitle}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {returnMs && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {new Date(returnMs).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                              )}
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
                              >
                                {urgencyLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Book Flow Overview */}
        <div data-ocid="admin.book_flow.section">
          <h2 className="text-base font-display font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <BookMinus className="h-5 w-5 text-primary" /> Book Flow Overview
          </h2>
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" /> Current
                  Holders → Next Students
                </CardTitle>
                <Link
                  to="/admin/inventory"
                  search={{
                    search: "",
                    category: "All",
                    availability: "All",
                    edition: "All",
                    sort: "title-asc",
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    data-ocid="admin.book_flow.view_all_link"
                  >
                    View Full Inventory
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <BookFlowOverview />
            </CardContent>
          </Card>
        </div>

        {/* Quick nav — 2 cols mobile, 4 cols lg */}
        <div>
          <h2 className="text-base font-display font-semibold text-foreground mb-3 sm:mb-4">
            Quick Navigation
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickNavCards.map((item) => (
              <Link key={item.path} to={item.path}>
                <Card
                  className="border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  data-ocid={`admin.quick_nav.${item.label.toLowerCase()}_link`}
                >
                  <CardContent className="p-3 sm:p-5">
                    <div
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${item.color}`}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className="font-medium text-foreground font-body text-xs sm:text-sm group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5 hidden sm:block">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
