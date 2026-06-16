import { StudentLayout } from "@/components/layout/StudentLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useGetMyIssuedBooks,
  useGetMyReservations,
  useGetQrCodeData,
  useMyRequests,
} from "@/hooks/useBackend";
import type { BookRequest, Reservation } from "@/types";
import { format } from "date-fns";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  QrCode,
  RotateCcw,
} from "lucide-react";

function formatDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

export default function QrPage() {
  const { data: user } = useCurrentUser();
  const studentId = user?.studentId ?? "";

  const { data: qrUrl, isLoading: qrLoading } = useGetQrCodeData(studentId);
  const { data: issuedBooks = [], isLoading: issuedLoading } =
    useGetMyIssuedBooks();
  const { data: reservations = [], isLoading: resLoading } =
    useGetMyReservations();
  const { data: requests = [], isLoading: reqLoading } = useMyRequests();

  const challans = (requests as BookRequest[]).filter(
    (r) => r.challanGenerated,
  );

  const fullName = user
    ? [user.firstName, user.middleName, user.grandFatherName, user.surname]
        .filter(Boolean)
        .join(" ") ||
      user.name ||
      "Student"
    : "Student";

  return (
    <StudentLayout>
      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
        data-ocid="qr_page.section"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              My QR Page
            </h1>
            <p className="text-sm text-muted-foreground">
              Your digital library card
            </p>
          </div>
        </div>

        {/* Student identity */}
        <Card className="border border-border" data-ocid="qr_page.profile_card">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-display font-semibold text-foreground truncate">
                  {fullName}
                </p>
                {studentId && (
                  <p
                    className="font-mono text-primary text-sm font-bold tracking-widest mt-0.5"
                    data-ocid="qr_page.student_id"
                  >
                    {studentId}
                  </p>
                )}
                {user?.course && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.course}
                    {user.academicYear ? ` · ${user.academicYear}` : ""}
                  </p>
                )}
              </div>
              {/* QR code */}
              <div
                className="shrink-0 flex flex-col items-center gap-2"
                data-ocid="qr_page.qr_card"
              >
                {qrLoading ? (
                  <Skeleton className="h-28 w-28 rounded-lg" />
                ) : qrUrl ? (
                  <div className="p-2 bg-card border border-border rounded-lg shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrUrl)}`}
                      alt="Student QR Code"
                      className="h-24 w-24"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-28 bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Scan to view profile
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issued Books */}
        <Card className="border border-border" data-ocid="qr_page.issued_books">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Issued Books
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {issuedLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : issuedBooks.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4 text-center"
                data-ocid="qr_page.issued_books.empty_state"
              >
                No books currently issued
              </p>
            ) : (
              <div className="space-y-2" data-ocid="qr_page.issued_books.list">
                {(issuedBooks as BookRequest[]).map((req, idx) => (
                  <div
                    key={req.requestId}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                    data-ocid={`qr_page.issued_books.item.${idx + 1}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {req.selectedBookIds.length > 0
                          ? `${req.selectedBookIds.length} book(s) issued`
                          : (req.requestedBooks[0]?.title ?? "Book Request")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        #{req.requestId.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200"
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card className="border border-border" data-ocid="qr_page.reservations">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Reservations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {resLoading ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : reservations.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4 text-center"
                data-ocid="qr_page.reservations.empty_state"
              >
                No active reservations
              </p>
            ) : (
              <div className="space-y-2" data-ocid="qr_page.reservations.list">
                {(reservations as Reservation[]).map((res, idx) => (
                  <div
                    key={res.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                    data-ocid={`qr_page.reservations.item.${idx + 1}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Book ID:{" "}
                        <span className="font-mono">
                          {res.bookId.slice(-8).toUpperCase()}
                        </span>
                      </p>
                      {res.expectedAvailabilityDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expected: {formatDate(res.expectedAvailabilityDate)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs shrink-0 bg-amber-100 text-amber-700 border-amber-200"
                    >
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Challan History */}
        <Card
          className="border border-border"
          data-ocid="qr_page.challan_history"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              Challan History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {reqLoading ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : challans.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4 text-center"
                data-ocid="qr_page.challan_history.empty_state"
              >
                No challans generated yet
              </p>
            ) : (
              <div
                className="space-y-2"
                data-ocid="qr_page.challan_history.list"
              >
                {challans.map((req, idx) => (
                  <div
                    key={req.requestId}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                    data-ocid={`qr_page.challan_history.item.${idx + 1}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground font-mono">
                        #{req.requestId.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
