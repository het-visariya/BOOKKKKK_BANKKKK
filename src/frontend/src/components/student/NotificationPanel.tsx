import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Notification,
  NotificationChannel,
  NotificationDeliveryStatus,
} from "@/types";
import {
  Bell,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Package,
  RotateCcw,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const KIND_ICON: Record<string, React.ElementType> = {
  BookApproved: CheckCircle2,
  BookRejected: X,
  BookReserved: Clock,
  BookAvailable: BookOpen,
  ReturnReminder: RotateCcw,
  ProcurementUpdate: Package,
  YearPromotion: Sparkles,
  Registration: CheckCircle2,
  Payment: CheckCircle2,
};

const KIND_COLOR: Record<string, string> = {
  BookApproved: "text-emerald-600",
  BookRejected: "text-red-500",
  BookReserved: "text-amber-500",
  BookAvailable: "text-primary",
  ReturnReminder: "text-red-500",
  ProcurementUpdate: "text-blue-500",
  YearPromotion: "text-purple-500",
  Registration: "text-emerald-600",
  Payment: "text-emerald-600",
};

const KIND_BG: Record<string, string> = {
  BookApproved: "bg-emerald-50",
  BookRejected: "bg-red-50",
  BookReserved: "bg-amber-50",
  BookAvailable: "bg-primary/8",
  ReturnReminder: "bg-red-50",
  ProcurementUpdate: "bg-blue-50",
  YearPromotion: "bg-purple-50",
  Registration: "bg-emerald-50",
  Payment: "bg-emerald-50",
};

// Channel delivery status pill
const CHANNEL_CONFIG: Record<
  NotificationChannel,
  { label: string; icon: React.ElementType; color: string }
> = {
  website: { label: "App", icon: Bell, color: "text-primary" },
  email: { label: "Email", icon: Mail, color: "text-blue-600" },
  sms: { label: "SMS", icon: Smartphone, color: "text-emerald-600" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "text-green-600" },
};

const STATUS_CONFIG: Record<
  NotificationDeliveryStatus,
  { label: string; dot: string }
> = {
  sent: { label: "Sent", dot: "bg-emerald-500" },
  delivered: { label: "Delivered", dot: "bg-emerald-500" },
  pending: { label: "Pending", dot: "bg-amber-400" },
  failed: { label: "Failed", dot: "bg-red-500" },
  demo: { label: "Demo", dot: "bg-muted-foreground" },
};

interface ChannelStatus {
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
}

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  /** If true, render as inline card. If false, render as full-screen drawer. */
  inline?: boolean;
  onClose?: () => void;
  /** When false the drawer does not render. Ignored in inline mode. */
  open?: boolean;
  /** Optional per-notification delivery status per channel */
  deliveryStatus?: Record<string, ChannelStatus[]>;
}

function NotificationItem({
  notification,
  index,
  onMarkRead,
  channelStatuses,
}: {
  notification: Notification;
  index: number;
  onMarkRead: (id: string) => void;
  channelStatuses?: ChannelStatus[];
}) {
  const kind = notification.kind;
  const IconComponent = KIND_ICON[kind] ?? Bell;
  const colorClass = KIND_COLOR[kind] ?? "text-primary";
  const bgClass = KIND_BG[kind] ?? "bg-primary/8";

  const timeStr = new Date(notification.timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.button
      key={notification.id}
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      data-ocid={`notifications.item.${index + 1}`}
      className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-muted/40 border-b border-border last:border-0 ${
        notification.isRead ? "opacity-70" : "bg-primary/2"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgClass} shrink-0 mt-0.5`}>
          <IconComponent className={`h-3.5 w-3.5 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
            {timeStr}
          </p>
          {/* Channel delivery status pills */}
          {channelStatuses && channelStatuses.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {channelStatuses.map((cs) => {
                const chConf = CHANNEL_CONFIG[cs.channel];
                const stConf =
                  STATUS_CONFIG[cs.status] ?? STATUS_CONFIG.pending;
                const ChIcon = chConf.icon;
                return (
                  <span
                    key={cs.channel}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-[9px] font-medium text-muted-foreground border border-border"
                    title={`${chConf.label}: ${stConf.label}`}
                  >
                    <ChIcon className={`h-2.5 w-2.5 ${chConf.color}`} />
                    {chConf.label}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ml-0.5 ${stConf.dot}`}
                    />
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function NotificationPanel({
  notifications,
  isLoading = false,
  onMarkRead,
  onMarkAllRead,
  inline = false,
  onClose,
  open: isDrawerOpen,
  deliveryStatus,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground text-sm">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs h-5 px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
              onClick={onMarkAllRead}
              data-ocid="notifications.mark_all_read"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Close notifications"
              data-ocid="notifications.close_button"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-1 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 px-1 py-2">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 gap-3"
            data-ocid="notifications.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-48">
              You'll receive updates when your books are approved, reserved, or
              due.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div>
              {notifications.map((n, idx) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  index={idx}
                  onMarkRead={onMarkRead}
                  channelStatuses={deliveryStatus?.[n.id]}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>
    </>
  );

  if (inline) {
    return (
      <Card
        className="border border-border overflow-hidden flex flex-col"
        data-ocid="notifications.panel"
        style={{ maxHeight: 420 }}
      >
        {content}
      </Card>
    );
  }

  // Drawer mode (full-screen side panel)
  if (!onClose && !inline) return null;

  // Do not render drawer at all when closed — prevents blocking page interaction
  const shouldShow = isDrawerOpen !== false;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <>
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="notif-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-elevated flex flex-col"
            data-ocid="notifications.drawer"
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
