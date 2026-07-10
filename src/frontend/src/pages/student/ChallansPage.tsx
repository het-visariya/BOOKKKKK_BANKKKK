import { StudentLayout } from "@/components/layout/StudentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyRequests } from "@/hooks/useBackend";
import type { BookRequest } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowRight, ClipboardList, FileText } from "lucide-react";

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy, HH:mm");
  } catch {
    return iso;
  }
}

const STATUS_STYLES: Record<string, string> = {
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Procured: "bg-blue-100 text-blue-700 border-blue-200",
  Returned: "bg-muted text-muted-foreground border-border",
};

export default function ChallansPage() {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useMyRequests();

  const challans = (requests as BookRequest[]).filter(
    (r) => r.challanGenerated,
  );

  return (
    <StudentLayout>
      <div
        className="max-w-3xl mx-auto px-4 py-6 space-y-6"
        data-ocid="challans_page.section"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              My Challans
            </h1>
            <p className="text-sm text-muted-foreground">
              All generated challans for your requests
            </p>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl border border-border"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : challans.length === 0 ? (
          <Card
            className="border border-border"
            data-ocid="challans_page.empty_state"
          >
            <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary/50" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No challans yet
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Challans are generated automatically when a book request is
                processed by an admin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3" data-ocid="challans_page.list">
            {challans.map((req, idx) => (
              <Card
                key={req.requestId}
                className="border border-border hover:border-primary/30 transition-colors"
                data-ocid={`challans_page.item.${idx + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-mono font-bold text-foreground">
                        #{req.requestId.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${
                        STATUS_STYLES[req.status] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground mb-3">
                    {req.selectedBookIds.length > 0 && (
                      <div>
                        <span className="font-medium text-foreground">
                          {req.selectedBookIds.length}
                        </span>{" "}
                        library book
                        {req.selectedBookIds.length !== 1 ? "s" : ""}
                      </div>
                    )}
                    {req.requestedBooks.length > 0 && (
                      <div>
                        <span className="font-medium text-foreground">
                          {req.requestedBooks.length}
                        </span>{" "}
                        custom request
                        {req.requestedBooks.length !== 1 ? "s" : ""}
                      </div>
                    )}
                    {req.challanId && (
                      <div className="font-mono text-[10px] truncate">
                        Challan: {req.challanId.slice(-8).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Requested book titles */}
                  {req.requestedBooks.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {req.requestedBooks.map((book, bi) => (
                        <p
                          key={`${req.requestId}-book-${bi}`}
                          className="text-xs text-foreground truncate"
                        >
                          • {book.title}
                          {book.author ? ` — ${book.author}` : ""}
                          {book.edition ? ` (${book.edition})` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-border w-full sm:w-auto"
                    onClick={() =>
                      navigate({ to: `/student/challan/${req.requestId}` })
                    }
                    data-ocid={`challans_page.view_button.${idx + 1}`}
                  >
                    <FileText className="h-3 w-3" />
                    View Challan
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
