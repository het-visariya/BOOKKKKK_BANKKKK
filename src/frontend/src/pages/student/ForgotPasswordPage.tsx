import { BrandingFooter, SVGALogo } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword, useResetPassword } from "@/hooks/useBackend";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ForgotStep = "email" | "reset" | "done";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSendToken = async () => {
    if (!email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    try {
      await forgotMutation.mutateAsync(email.trim().toLowerCase());
      toast.success(
        "Reset token sent! Check your registered email or contact admin.",
      );
      setStep("reset");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send reset token",
      );
    }
  };

  const handleReset = async () => {
    if (!resetToken.trim()) {
      toast.error("Please enter the reset token");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await resetMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        resetToken: resetToken.trim(),
        newPassword,
      });
      toast.success("Password reset successfully!");
      setStep("done");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Reset failed. Check your token.",
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(160deg, #EFF6FF 0%, #F0F9FF 50%, #E0F2FE 100%)",
        }}
      />
      <div
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7DD3FC 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <header className="relative z-10 bg-card/80 backdrop-blur-md border-b border-border shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <a href="/" className="hover:opacity-80 transition-smooth">
            <SVGALogo size="md" />
          </a>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center pb-2 animate-fade-in-down">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 ring-4 ring-primary/20 flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
              Reset Password
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "email"
                ? "Enter your registered email to receive a reset token"
                : step === "reset"
                  ? "Enter the reset token and your new password"
                  : "Your password has been reset"}
            </p>
          </div>

          <Card className="border border-border shadow-elevated animate-fade-in-up delay-100">
            {step === "email" && (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-display">
                    Forgot Password
                  </CardTitle>
                  <CardDescription>
                    We'll send a reset token to your email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-email">Email Address</Label>
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendToken()}
                      className={emailError ? "border-destructive" : ""}
                      data-ocid="forgot_password.email_input"
                    />
                    {emailError && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="forgot_password.email_input.field_error"
                      >
                        {emailError}
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full gap-2 h-11"
                    onClick={handleSendToken}
                    disabled={forgotMutation.isPending}
                    data-ocid="forgot_password.send_button"
                  >
                    {forgotMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" /> Send Reset Token
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full gap-2"
                    onClick={() => navigate({ to: "/student/login" })}
                    data-ocid="forgot_password.back_button"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                </CardContent>
              </>
            )}

            {step === "reset" && (
              <>
                <CardHeader>
                  <CardTitle className="text-lg font-display">
                    Enter New Password
                  </CardTitle>
                  <CardDescription>
                    Enter the token sent to <strong>{email}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-token">Reset Token</Label>
                    <Input
                      id="fp-token"
                      placeholder="Paste your reset token here"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      data-ocid="forgot_password.token_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-newpw">New Password</Label>
                    <Input
                      id="fp-newpw"
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-ocid="forgot_password.new_password_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-confirmpw">Confirm Password</Label>
                    <Input
                      id="fp-confirmpw"
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReset()}
                      data-ocid="forgot_password.confirm_password_input"
                    />
                  </div>
                  <Button
                    className="w-full gap-2 h-11"
                    onClick={handleReset}
                    disabled={resetMutation.isPending}
                    data-ocid="forgot_password.reset_button"
                  >
                    {resetMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Resetting...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" /> Reset Password
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("email")}
                    data-ocid="forgot_password.back_to_email_button"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </CardContent>
              </>
            )}

            {step === "done" && (
              <CardContent className="p-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground">
                  Password Reset!
                </h3>
                <p className="text-sm text-muted-foreground">
                  You can now sign in with your new password.
                </p>
                <Button
                  className="w-full h-11"
                  onClick={() => navigate({ to: "/student/login" })}
                  data-ocid="forgot_password.go_login_button"
                >
                  Go to Login
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <div className="relative z-10">
        <BrandingFooter />
      </div>
    </div>
  );
}
