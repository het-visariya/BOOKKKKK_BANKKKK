import { BrandingFooter, LOGO_SRC, SVGALogo } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStudentSession, setStudentSession } from "@/hooks/useAuth";
import { MembershipStatus } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Copy, GraduationCap, IdCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
type PageState = "loading" | "success" | "error";

const MEMBERSHIP_PAID_KEY = "svga_membership_paid";
const MEMBERSHIP_STATUS_KEY = "svga_membership_status";

function persistMembershipPaid() {
  localStorage.setItem(MEMBERSHIP_PAID_KEY, "true");
  localStorage.setItem(MEMBERSHIP_STATUS_KEY, "PAID");
}

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const hasProcessedRef = useRef(false);

  const searchParams = new URLSearchParams(window.location.search);
  const isDemo = searchParams.get("demo") === "true";

  const existingSession = getStudentSession();

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Fast path: session with PAID status already exists → go straight to dashboard
    if (existingSession) {
      const user = existingSession.user;
      // Update session to mark PAID if not already
      if (user.membershipStatus !== "PAID") {
        setStudentSession({
          token: existingSession.token,
          userId: existingSession.userId,
          user: { ...user, membershipStatus: "PAID" as const },
        });
      }
      persistMembershipPaid();
      sessionStorage.setItem("svga_registration_complete", "true");
      setStudentId(user.studentId);
      setStudentName(user.name);
      setPageState("success");
      // Short 1.5s success flash then navigate
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        navigate({ to: "/student/dashboard" });
      }, 1500);
      return;
    }

    // No session at all → redirect to register
    if (isDemo) {
      persistMembershipPaid();
      sessionStorage.setItem("svga_registration_complete", "true");
      setPageState("success");
      setTimeout(() => navigate({ to: "/student/dashboard" }), 1500);
      return;
    }

    setErrorMessage("Your session has expired. Please register again.");
    setPageState("error");
  }, [existingSession, isDemo, navigate, queryClient]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(studentId);
    toast.success("Student ID copied!");
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-[#B8E0E8] border-t-[#5AC8D8] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={LOGO_SRC}
                  alt="SVGA Book Bank"
                  className="h-10 w-10 rounded-full object-contain"
                />
              </div>
            </div>
            <div className="animate-fade-in-up">
              <p className="font-display font-semibold text-foreground text-xl">
                Setting up your account…
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Just a moment, almost done!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card
            className="w-full max-w-md border border-border shadow-elevated"
            data-ocid="payment_success.error_state"
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <IdCard className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-display font-bold text-foreground mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {errorMessage}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate({ to: "/student/login" })}
                  data-ocid="payment_success.login_button"
                >
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/student/register" })}
                  data-ocid="payment_success.back_to_register_button"
                >
                  Back to Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <BrandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-background to-background flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg space-y-4 animate-fade-in-up"
          data-ocid="payment_success.section"
        >
          <Card className="border-0 bg-emerald-50 ring-1 ring-emerald-200 shadow-elevated overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-[#88D4E0] to-[#5AC8D8] h-2 w-full" />
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#E8F4F8] flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <CheckCircle2 className="h-10 w-10 text-[#5AC8D8]" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                  Registration Complete! 🎉
                </h1>
                <p className="text-muted-foreground">
                  Welcome to SVGA Book Bank,{" "}
                  <span className="font-semibold text-foreground">
                    {studentName}
                  </span>
                  ! Your ₹200 membership is confirmed.
                </p>
                <p className="text-xs text-muted-foreground mt-3 animate-pulse">
                  Taking you to your dashboard…
                </p>
              </div>
            </CardContent>
          </Card>

          {studentId && (
            <Card
              className="border border-[#B8E0E8] bg-[#E8F4F8] shadow-elevated"
              data-ocid="payment_success.card"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#B8E0E8] flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-[#5AC8D8]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Your Student ID
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Keep this safe — you'll need it to collect books
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <code
                    className="flex-1 text-lg font-mono font-bold text-[#5AC8D8] tracking-widest"
                    data-ocid="payment_success.student_id"
                  >
                    {studentId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={handleCopyId}
                    data-ocid="payment_success.copy_id_button"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 h-11 bg-[#5AC8D8] hover:bg-[#88D4E0] text-white"
              onClick={() => {
                sessionStorage.setItem("svga_registration_complete", "true");
                navigate({ to: "/student/dashboard" });
              }}
              data-ocid="payment_success.go_dashboard_button"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 border-[#B8E0E8] text-[#5AC8D8] hover:bg-[#E8F4F8]"
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
              data-ocid="payment_success.browse_books_button"
            >
              Browse Books
            </Button>
          </div>
        </div>
      </div>
      <BrandingFooter />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-card border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
        <a href="/" className="hover:opacity-80 transition-smooth">
          <SVGALogo size="md" />
        </a>
      </div>
    </header>
  );
}
