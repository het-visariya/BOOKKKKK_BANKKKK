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
import { setAadhaarSession, useStudentAuth } from "@/hooks/useAuth";
import { useSendOtp, useVerifyOtpAndLogin } from "@/hooks/useBackend";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  IndianRupee,
  Library,
  Loader2,
  Phone,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Step = "aadhaar" | "otp";

export function LoginPage() {
  const { isAuthenticated, membershipPaid } = useStudentAuth();
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtpAndLogin();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("aadhaar");
  const [showOtpSent, setShowOtpSent] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({
    aadhaar: "",
    phone: "",
    otp: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
  }, [isAuthenticated]);

  const validateAadhaarAndPhone = () => {
    const errs = { aadhaar: "", phone: "", otp: "" };
    if (!aadhaar.trim() || !/^\d{12}$/.test(aadhaar.replace(/[- ]/g, ""))) {
      errs.aadhaar = "Enter a valid 12-digit Aadhaar number";
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone.replace(/[- ]/g, ""))) {
      errs.phone = "Enter a valid 10-digit mobile number";
    }
    setErrors(errs);
    return !errs.aadhaar && !errs.phone;
  };

  const validateOtp = () => {
    const errs = { ...errors };
    if (!otp.trim() || otp.length !== 4) {
      errs.otp = "Enter the 4-digit OTP";
    } else {
      errs.otp = "";
    }
    setErrors(errs);
    return !errs.otp;
  };

  const handleSendOtp = async () => {
    if (!validateAadhaarAndPhone()) return;
    try {
      const cleanPhone = phone.replace(/[- ]/g, "");
      const cleanAadhaar = aadhaar.replace(/[- ]/g, "");
      const result = await sendOtpMutation.mutateAsync({
        aadhaarNumber: cleanAadhaar,
        phone: cleanPhone,
        type: "sms",
      });
      setShowOtpSent(true);
      setStep("otp");
      toast.success(result?.message || "OTP sent successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(msg);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;
    try {
      const cleanPhone = phone.replace(/[- ]/g, "");
      const cleanAadhaar = aadhaar.replace(/[- ]/g, "");
      const result = await verifyOtpMutation.mutateAsync({
        aadhaarNumber: cleanAadhaar,
        phone: cleanPhone,
        otp: otp.trim(),
        type: "sms",
      });
      setAadhaarSession(result.token, result.user);
      toast.success("✓ Login successful! Welcome to SVGA Book Bank 🎉");
      setTimeout(() => {
        if (result.needsRegistration) {
          navigate({ to: "/student/register" });
        } else {
          navigate({ to: "/student/dashboard" });
        }
      }, 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      toast.error(msg);
    }
  };

  const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

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

      <header className="relative z-10 navbar-bg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <SVGALogo size="sm" variant="navbar" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center mb-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Student Login
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {step === "aadhaar"
                ? "Enter your Aadhaar & Mobile Number"
                : "Enter the 4-digit OTP sent to your phone"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "aadhaar" && (
              <motion.div
                key="aadhaar-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border shadow-warm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      Verification
                    </CardTitle>
                    <CardDescription>
                      Secure login using Aadhaar verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar" className="font-medium">
                        Aadhaar Number *
                      </Label>
                      <Input
                        id="aadhaar"
                        placeholder="1234 5678 9012"
                        value={aadhaar}
                        maxLength={14}
                        onChange={(e) => {
                          setAadhaar(e.target.value.replace(/[^\d ]/g, ""));
                          if (errors.aadhaar) {
                            setErrors((er) => ({ ...er, aadhaar: "" }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !errors.phone && phone.trim()) {
                            handleSendOtp();
                          }
                        }}
                        disabled={isLoading}
                        className={`text-lg ${
                          errors.aadhaar ? "border-destructive" : ""
                        }`}
                        autoComplete="off"
                      />
                      {errors.aadhaar && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.aadhaar}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">
                        Mobile Number *
                      </Label>
                      <div className="flex gap-0">
                        <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                          +91
                        </span>
                        <Input
                          id="phone"
                          placeholder="9876543210"
                          value={phone}
                          maxLength={10}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, ""));
                            if (errors.phone) {
                              setErrors((er) => ({ ...er, phone: "" }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !errors.aadhaar &&
                              !errors.phone
                            ) {
                              handleSendOtp();
                            }
                          }}
                          disabled={isLoading}
                          className={`rounded-l-none text-lg ${
                            errors.phone ? "border-destructive" : ""
                          }`}
                          autoComplete="off"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full h-11 text-base font-semibold"
                      onClick={handleSendOtp}
                      disabled={isLoading || !!errors.aadhaar || !!errors.phone}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          <Phone className="mr-2 h-5 w-5" />
                          Send OTP
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border shadow-warm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      Verify OTP
                    </CardTitle>
                    <CardDescription>
                      Enter the 4-digit code sent to +91{phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {showOtpSent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"
                      >
                        <p className="font-semibold mb-1">📱 OTP Sent</p>
                        <p>Check your SMS for the 4-digit verification code</p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="otp" className="font-medium">
                        Enter OTP *
                      </Label>
                      <Input
                        id="otp"
                        placeholder="0000"
                        value={otp}
                        maxLength={4}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          if (errors.otp) {
                            setErrors((er) => ({ ...er, otp: "" }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 4) {
                            handleVerifyOtp();
                          }
                        }}
                        disabled={isLoading}
                        className={`text-center text-2xl tracking-widest font-mono font-bold letter-spacing-lg ${
                          errors.otp ? "border-destructive" : ""
                        }`}
                        autoComplete="off"
                      />
                      {errors.otp && (
                        <p className="text-xs text-destructive font-medium">
                          {errors.otp}
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full h-11 text-base font-semibold"
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otp.length !== 4}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="mr-2 h-5 w-5" />
                          Verify & Login
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("aadhaar");
                        setOtp("");
                        setShowOtpSent(false);
                      }}
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                      disabled={isLoading}
                    >
                      ← Change Aadhaar or Phone Number
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: Library, text: "Free Books" },
              { icon: Shield, text: "Secure OTP" },
              { icon: IndianRupee, text: "₹500 Deposit" },
            ].map((f, idx) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/70 border border-sky-100 hover:border-sky-200 transition-all hover:shadow-sm"
              >
                <f.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  {f.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      <BrandingFooter />
    </div>
  );
}
