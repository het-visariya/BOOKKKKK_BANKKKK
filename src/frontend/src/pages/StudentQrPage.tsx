import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStudentProfile } from "@/hooks/useBackend";
import type { IssuedBookInfo, ReturnUrgency } from "@/types";
import { useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Phone,
  Printer,
  User,
} from "lucide-react";
import { motion } from "motion/react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: string | bigint | undefined): string {
  if (!date) return "Not set";
  const ms =
    typeof date === "string"
      ? new Date(date).getTime()
      : Number(date) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDaysLeft(returnDate: string | bigint | undefined): number {
  if (!returnDate) return 999;
  const ms =
    typeof returnDate === "string"
      ? new Date(returnDate).getTime()
      : Number(returnDate) / 1_000_000;
  return Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
}

function getReturnUrgency(
  returnDate: string | bigint | undefined,
): ReturnUrgency {
  if (!returnDate) return "normal";
  const days = getDaysLeft(returnDate);
  if (days < 0) return "overdue";
  if (days <= 2) return "urgent";
  if (days <= 5) return "warning";
  return "normal";
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function BookStatusBadge({ book }: { book: IssuedBookInfo }) {
  if (book.returned) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Returned
      </span>
    );
  }
  const urgency = getReturnUrgency(book.returnDate);
  const days = getDaysLeft(book.returnDate);
  if (urgency === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        Overdue
      </span>
    );
  }
  if (urgency === "urgent") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200">
        <Clock className="h-3 w-3" />
        Due in {days}d
      </span>
    );
  }
  if (urgency === "warning") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="h-3 w-3" />
        {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-200">
      Issued
    </span>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function QrPageSkeleton() {
  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.95 0.04 210) 0%, oklch(0.97 0.02 205) 100%)",
      }}
    >
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-10 w-52 mx-auto rounded-xl" />
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function StudentQrPage() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const { data: student, isLoading } = useGetStudentProfile(userId);

  function handlePrint() {
    window.print();
  }

  if (isLoading) return <QrPageSkeleton />;

  if (!student) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.95 0.04 210) 0%, oklch(0.97 0.02 205) 100%)",
        }}
      >
        <motion.div
          className="text-center space-y-4 max-w-xs"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          data-ocid="qr.error_state"
        >
          <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-display font-semibold text-foreground">
            Student Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            No student record matches this QR code. Please contact SVGA Book
            Bank administration.
          </p>
        </motion.div>
      </div>
    );
  }

  const issuedBooks: IssuedBookInfo[] = student.issuedBooksInfo ?? [];
  const activeBooks = issuedBooks.filter((b) => !b.returned);
  const returnedBooks = issuedBooks.filter((b) => b.returned);
  const membershipPaid = student.membershipStatus === "PAID";

  return (
    <div
      className="min-h-screen py-8 px-4 print:py-0 print:px-0 print:bg-white"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.94 0.05 210) 0%, oklch(0.96 0.03 205) 50%, oklch(0.97 0.02 200) 100%)",
      }}
    >
      {/* Print button */}
      <div className="flex justify-end max-w-lg mx-auto mb-3 print:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2 bg-card/80 border-border shadow-sm hover:bg-card transition-colors"
          data-ocid="qr.print_button"
        >
          <Printer className="h-4 w-4" />
          Print / Save
        </Button>
      </div>

      {/* Challan card */}
      <motion.div
        className="max-w-lg mx-auto bg-card rounded-2xl border border-border shadow-lg print:shadow-none print:rounded-none print:border-none"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        data-ocid="qr.challan_card"
      >
        {/* Header stripe */}
        <div
          className="rounded-t-2xl px-6 py-5 flex items-center justify-between print:rounded-t-none"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.14 210) 0%, oklch(0.48 0.16 220) 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full shrink-0 border-2 border-white/40 shadow-md p-0.5 bg-white/90 overflow-hidden">
              <img
                src="/assets/svga-logo.png"
                alt="SVGA"
                className="w-full h-full rounded-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-xl leading-tight">
                SVGA Book Bank
              </h1>
              <p
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Student Digital ID
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Printed
            </p>
            <p
              className="text-sm font-mono"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Dashed divider */}
        <div className="border-t-2 border-dashed border-border/50 mx-6" />

        <div className="px-6 py-5 space-y-5">
          {/* ── Student Identity ── */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            data-ocid="qr.student_card"
          >
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 rounded-full border-2 border-border shadow-sm flex-shrink-0">
                {student.profileImageUrl ? (
                  <AvatarImage
                    src={student.profileImageUrl}
                    alt={student.name}
                  />
                ) : null}
                <AvatarFallback className="bg-secondary text-foreground text-2xl font-bold">
                  <User className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-foreground text-2xl truncate">
                  {student.name}
                </h2>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {student.phone ||
                    student.aadhaarNumber
                      ?.slice(-4)
                      .padStart(student.aadhaarNumber.length, "*")}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    className={
                      membershipPaid
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 font-semibold"
                        : "bg-amber-100 text-amber-700 border-amber-200 gap-1 font-semibold"
                    }
                    data-ocid="qr.membership_badge"
                  >
                    {membershipPaid ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Active Member
                      </>
                    ) : (
                      <>Pending Membership</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="bg-muted/60 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Student ID
                </p>
                <p className="text-sm font-mono font-medium text-foreground truncate">
                  {student.studentId}
                </p>
              </div>
              <div className="bg-muted/60 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Course</p>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <p className="text-sm font-medium text-foreground truncate">
                    {student.course || "—"}
                  </p>
                </div>
              </div>
              {student.college && (
                <div className="bg-muted/60 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    College
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {student.college}
                  </p>
                </div>
              )}
              {student.phone && (
                <div className="bg-muted/60 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">
                      {student.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold font-display text-sky-700">
                  {activeBooks.length}
                </p>
                <p className="text-xs text-sky-600">Issued</p>
              </div>
              <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold font-display text-emerald-700">
                  {returnedBooks.length}
                </p>
                <p className="text-xs text-emerald-600">Returned</p>
              </div>
              <div className="flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold font-display text-foreground">
                  {issuedBooks.length}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </motion.section>

          <div className="border-t-2 border-dashed border-border/50" />

          {/* ── Issued Books Table ── */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            data-ocid="qr.books_section"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Issued Books
              </h3>
              <span className="text-xs text-muted-foreground">
                {issuedBooks.length}{" "}
                {issuedBooks.length === 1 ? "book" : "books"}
              </span>
            </div>

            {issuedBooks.length === 0 ? (
              <div
                className="text-center py-10 text-muted-foreground"
                data-ocid="qr.books_empty_state"
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm font-medium">
                  No books currently issued.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Books will appear here once issued by the librarian.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-px bg-muted/80">
                  {[
                    "Book Title",
                    "Issue Date",
                    "Return Date",
                    "Status",
                    "Urgency",
                  ].map((h) => (
                    <div
                      key={h}
                      className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/60"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Table rows */}
                <div className="divide-y divide-border">
                  {issuedBooks.map((book, idx) => (
                    <motion.div
                      key={book.requestId}
                      className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-0 hover:bg-muted/20 transition-colors"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.06, duration: 0.3 }}
                      data-ocid={`qr.book.item.${idx + 1}`}
                    >
                      {/* Mobile: stacked layout */}
                      <div className="sm:hidden p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground">
                              {book.bookTitle}
                            </p>
                          </div>
                          <BookStatusBadge book={book} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> Issued:{" "}
                            {formatDate(book.issueDate)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" /> Due:{" "}
                            {formatDate(book.returnDate)}
                          </span>
                        </div>
                      </div>

                      {/* Desktop: grid layout */}
                      <div className="hidden sm:flex items-center px-3 py-3">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {book.bookTitle}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center px-3 py-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(book.issueDate)}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center px-3 py-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(book.returnDate)}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center px-3 py-3">
                        <BookStatusBadge book={book} />
                      </div>
                      <div className="hidden sm:flex items-center px-3 py-3">
                        {!book.returned &&
                          book.returnDate &&
                          (() => {
                            const days = getDaysLeft(book.returnDate);
                            const urgency = getReturnUrgency(book.returnDate);
                            if (urgency === "overdue")
                              return (
                                <span className="text-xs font-bold text-red-600">
                                  {Math.abs(days)}d overdue
                                </span>
                              );
                            if (urgency === "urgent")
                              return (
                                <span className="text-xs font-bold text-orange-600">
                                  Due in {days}d
                                </span>
                              );
                            if (urgency === "warning")
                              return (
                                <span className="text-xs font-medium text-amber-600">
                                  {days}d left
                                </span>
                              );
                            return (
                              <span className="text-xs text-muted-foreground">
                                {days > 998 ? "—" : `${days}d left`}
                              </span>
                            );
                          })()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        </div>

        {/* Footer stripe */}
        <Separator />
        <div
          className="rounded-b-2xl px-6 py-4 print:rounded-b-none"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.14 210) 0%, oklch(0.48 0.16 220) 100%)",
          }}
        >
          <p
            className="text-xs text-center"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            SVGA Book Bank &bull; Official Digital Receipt &bull; Made by
            Devansh Nisar
          </p>
        </div>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground/60 mt-6 print:hidden">
        © {new Date().getFullYear()} SVGA Book Bank &mdash; Not transferable
      </p>
    </div>
  );
}
