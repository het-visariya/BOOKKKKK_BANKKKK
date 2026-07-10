import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      )}
      data-ocid="empty_state"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-primary/60" />
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} data-ocid="empty_state.primary_button">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
