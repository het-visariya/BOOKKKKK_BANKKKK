import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Printer,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

// ─── Helpers ───

function getReturnUrgency(
  returnDate: string | bigint | undefined,
): ReturnUrgency {
  if (!returnDate) return "normal";
  const nowMs = Date.now();
  const returnMs =
    typeof returnDate === "string"
      ? new Date(returnDate).getTime()
      : Number(returnDate / BigInt(1_000_000));
  const daysLeft = Math.ceil((returnMs - nowMs) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 2) return "urgent";
  if (daysLeft <= 5) return "warning";
  return "normal";
}

function getDaysLeft(returnDate: string | bigint | undefined): number {
  if (!returnDate) return 999;
  const returnMs =
    typeof returnDate === "string"
      ? new Date(returnDate).getTime()
      : Number(returnDate / BigInt(1_000_000));
  return Math.ceil((returnMs - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: string | bigint | undefined): string {
  if (!date) return "Not set";
  const ms =
    typeof date === "string"
      ? new Date(date).getTime()
      : Number(date / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── QR Canvas hook ───

function useQrCanvas(url: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 140,
      margin: 1,
      color: { dark: "#1e3a5f", light: "#ffffff" },
    });
  }, [url]);
  return canvasRef;
}

// ─── Urgency pill ───

function UrgencyPill({
  urgency,
  daysLeft,
}: { urgency: ReturnUrgency; daysLeft: number }) {
  if (urgency === "overdue")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200">
        <AlertTriangle className="h-3 w-3" />
        Overdue
      </span>
    );
  if (urgency === "urgent")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-600 border-red-200">
        <Clock className="h-3 w-3" />
        Due in {daysLeft}d
      </span>
    );
  if (urgency === "warning")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="h-3 w-3" />
        {daysLeft}d left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-200">
      <Clock className="h-3 w-3" />
      {daysLeft > 998 ? "—" : `${daysLeft}d left`}
    </span>
  );
}

// ─── Book row ───

function BookRow({ book, index }: { book: IssuedBookInfo; index: number }) {
  const urgency = getReturnUrgency(book.returnDate);
  const daysLeft = getDaysLeft(book.returnDate);
  const showDueSoon =
    !book.returned && (urgency === "urgent" || urgency === "overdue");

  return (
    <motion.div
      className="flex flex-col gap-2 py-3.5 border-b border-dashed border-border/60 last:border-0"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.18 + index * 0.06, duration: 0.3 }}
      data-ocid={`student.profile.book.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-semibold text-foreground leading-snug">
            {book.bookTitle}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {book.returned ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Returned
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-200">
                Issued
              </span>
              {showDueSoon && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border bg-red-50 text-red-600 border-red-200 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Due Soon
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-6">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Issued: {formatDate(book.issueDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Due: {formatDate(book.returnDate)}
          </span>
        </div>
        {!book.returned && book.returnDate && (
          <div className="col-span-2 mt-0.5">
            <UrgencyPill urgency={urgency} daysLeft={daysLeft} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Loading skeleton ───

function ProfileSkeleton() {
  return (
    <div
      className="min-h-screen flex flex-col items-center pt-12 p-4"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.95 0.04 210) 0%, oklch(0.97 0.02 205) 100%)",
      }}
    >
      <div className="w-full max-w-xl space-y-4">
        <Skeleton className="h-10 w-48 mx-auto rounded-xl" />
        <Skeleton className="h-1 w-full rounded" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main Page ───

export function StudentProfilePage() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const { data: student, isLoading, isError } = useGetStudentProfile(userId);
  const [isPrinting, setIsPrinting] = useState(false);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/student/profile/${userId}`
      : "";
  const qrCanvasRef = useQrCanvas(profileUrl);

  function handlePrint() {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 80);
  }

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !student) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
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
          data-ocid="student.profile.error_state"
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
      <div
        className="flex justify-end max-w-xl mx-auto mb-3 print:hidden"
        data-ocid="student.profile.print_button"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={isPrinting}
          type="button"
          className="gap-2 bg-card/80 border-border shadow-subtle hover:bg-card transition-smooth"
        >
          <Printer className="h-4 w-4" />
          {isPrinting ? "Preparing..." : "Print / Save"}
        </Button>
      </div>

      {/* Challan card */}
      <motion.div
        className="max-w-xl mx-auto bg-card rounded-2xl border border-border shadow-warm print:shadow-none print:rounded-none print:border-none print-challan"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        data-ocid="student.profile.challan_card"
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
            <img
              src="/assets/svga-logo.png"
              alt="SVGA"
              className="h-12 w-12 rounded-full object-cover border-2 border-white/40 flex-shrink-0 shadow-md"
            />
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight">
                SVGA Book Bank
              </h1>
              <p
                className="text-xs font-body"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Student Library Card
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-xs font-body"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Issued
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
          {/* Student Identity */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
            data-ocid="student.profile.card"
          >
            <div className="flex items-start gap-4">
              {student.profileImageUrl ? (
                <img
                  src={student.profileImageUrl}
                  alt={student.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-border flex-shrink-0 shadow-subtle"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border flex-shrink-0">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-foreground text-xl truncate">
                  {student.name}
                </h2>
                <p className="text-sm text-muted-foreground font-body truncate">
                  {student.phone ||
                    `Aadhaar: xxxx-${student.aadhaarNumber?.slice(-4) ?? "????"}`}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant={membershipPaid ? "default" : "secondary"}
                    className="text-xs gap-1"
                    data-ocid="student.profile.membership_badge"
                  >
                    {membershipPaid ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Active Member
                      </>
                    ) : (
                      "Pending Membership"
                    )}
                  </Badge>
                </div>
              </div>
            </div>

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
                    {student.course}
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
                  <p className="text-sm font-medium text-foreground">
                    {student.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold font-display text-sky-700">
                  {activeBooks.length}
                </p>
                <p className="text-xs text-sky-600">Books Issued</p>
              </div>
              <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold font-display text-emerald-700">
                  {returnedBooks.length}
                </p>
                <p className="text-xs text-emerald-600">Books Returned</p>
              </div>
              <div className="flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold font-display text-foreground">
                  {issuedBooks.length}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </motion.section>

          {/* Dashed divider */}
          <div className="border-t-2 border-dashed border-border/50" />

          {/* Issued Books */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            data-ocid="student.profile.books_section"
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
                className="text-center py-8 text-muted-foreground"
                data-ocid="student.profile.books_empty_state"
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No books currently issued.</p>
              </div>
            ) : (
              <div>
                {issuedBooks.map((book, idx) => (
                  <BookRow key={book.requestId} book={book} index={idx} />
                ))}
              </div>
            )}
          </motion.section>

          {/* Dashed divider */}
          <div className="border-t-2 border-dashed border-border/50" />

          {/* QR Code */}
          <motion.section
            className="flex flex-col items-center gap-3 py-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            data-ocid="student.profile.qr_section"
          >
            <p className="text-xs text-muted-foreground text-center">
              Scan to verify student record
            </p>
            <div className="p-2.5 rounded-xl border border-border bg-card shadow-subtle">
              <canvas ref={qrCanvasRef} className="block" />
            </div>
            <p className="text-xs font-mono text-muted-foreground text-center break-all max-w-xs">
              {student.studentId}
            </p>
          </motion.section>
        </div>

        {/* Footer stripe */}
        <div
          className="rounded-b-2xl px-6 py-3 print:rounded-b-none"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.14 210) 0%, oklch(0.48 0.16 220) 100%)",
          }}
        >
          <p
            className="text-xs text-center font-body"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Official digital receipt · SVGA Book Bank System · Not transferable
          </p>
        </div>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground/60 mt-6 print:hidden">
        © {new Date().getFullYear()} SVGA Book Bank. This is an official digital
        library card.
      </p>
    </div>
  );
}
