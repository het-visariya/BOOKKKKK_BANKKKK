import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookRequest } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
} from "lucide-react";
import { motion } from "motion/react";

interface ChallanHistoryProps {
  requests: BookRequest[];
  isLoading?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ChallanHistory({
  requests,
  isLoading = false,
}: ChallanHistoryProps) {
  const navigate = useNavigate();

  return (
    <Card className="border border-border" data-ocid="challan_history.panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Challan History
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border border-border"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 gap-3"
            data-ocid="challan_history.empty_state"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              No challans generated yet
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Challans are generated automatically when a book request is
              processed.
            </p>
          </div>
        ) : (
          <div className="space-y-2" data-ocid="challan_history.list">
            {requests.map((req, idx) => (
              <motion.div
                key={req.requestId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.05 }}
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border hover:border-primary/30 transition-colors bg-card"
                  data-ocid={`challan_history.item.${idx + 1}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/8 shrink-0 mt-0.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          #{req.requestId.slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {req.selectedBookIds.length > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {req.selectedBookIds.length} library book
                            {req.selectedBookIds.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {req.requestedBooks.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" />
                            {req.requestedBooks.length} custom request
                            {req.requestedBooks.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 text-xs border-[#B8E0E8]"
                    onClick={() =>
                      navigate({
                        to: `/student/challan/${req.requestId}`,
                      })
                    }
                    data-ocid={`challan_history.view_button.${idx + 1}`}
                  >
                    <FileText className="h-3 w-3" /> View
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
