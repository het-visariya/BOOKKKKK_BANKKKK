import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "Pending"
  | "Approved"
  | "Procured"
  | "Rejected"
  | "Paid"
  | "active"
  | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  Pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Procured: {
    label: "Procured",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  Returned: {
    label: "Returned",
    className: "bg-slate-100 text-slate-600 border-slate-300",
  },
  Paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium capitalize border",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
