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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setAadhaarSession, useStudentAuth } from "@/hooks/useAuth";
import {
  useSendOtp,
  useStudentSignupAndPay,
  useVerifyOtpAndLogin,
} from "@/hooks/useBackend";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  IndianRupee,
  Library,
  Loader2,
  Phone,
  Shield,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COURSES = [
  "FYJC",
  "SYJC",
  "FY-Degree",
  "SY-Degree",
  "TY-Degree",
  "MBBS",
  "BDS",
  "Engineering",
  "Commerce",
  "Arts",
  "Science",
  "Other",
];

type Step = "aadhaar" | "otp";

export function LoginPage() {
  const { isAuthenticated, membershipPaid } = useStudentAuth();
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtpAndLogin();
  const signupMutation = useStudentSignupAndPay();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("aadhaar");
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [college, setCollege] = useState("");
  const [errors, setErrors] = useState({
    aadhaar: "",
    phone: "",
    otp: "",
    name: "",
    course: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (membershipPaid) navigate({ to: "/student/dashboard" });
    else navigate({ to: "/student/register" });
  }, [isAuthenticated, membershipPaid, navigate]);

  const validateAadhaar = () => {
    const errs = { aadhaar: "", phone: "", otp: "", name: "", course: "" };
    if (!aadhaar.trim() || !/^\d{12}$/.test(aadhaar.replace(/[- ]/g, "")))
      errs.aadhaar = "Enter a valid 12-digit Aadhaar number";
    if (!phone.trim() || !/^\d{10}$/.test(phone.replace(/[- ]/g, "")))
      errs.phone = "Enter a valid 10-digit mobile number";
    setErrors(errs);
    return !errs.aadhaar && !errs.phone;
  };

  const handleSendOtp = async () => {
    if (!validateAadhaar()) return;
    try {
      const cleanAadhaar = aadhaar.replace(/[- ]/g, "");
      const cleanPhone = phone.replace(/[- ]/g, "");
      const result = await sendOtpMutation.mutateAsync({
        aadhaarNumber: cleanAadhaar,
        phone: cleanPhone,
      });
      setStep("otp");
      if (result.demo) {
        setDemoOtp(result.otp);
        toast.info(`Demo OTP: ${result.otp}`, { duration: 30000 });
      } else {
        toast.success("OTP sent to your registered mobile number");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("not registered")
      ) {
        setIsNewUser(true);
        setStep("otp");
        toast.info(
          "New student detected — please complete your profile below.",
        );
      } else {
        toast.error(msg || "Failed to send OTP");
      }
    }
  };

  const validateOtpStep = () => {
    const errs = { aadhaar: "", phone: "", otp: "", name: "", course: "" };
    if (!otp.trim() || otp.length < 4) errs.otp = "Enter the OTP";
    if (isNewUser) {
      if (!name.trim()) errs.name = "Enter your full name";
      if (!course) errs.course = "Select your course";
    }
    setErrors(errs);
    return !errs.otp && !errs.name && !errs.course;
  };

  const handleVerifyOtp = async () => {
    if (!validateOtpStep()) return;
    const cleanAadhaar = aadhaar.replace(/[- ]/g, "");
    const cleanPhone = phone.replace(/[- ]/g, "");
    try {
      if (isNewUser) {
        const result = await signupMutation.mutateAsync({
          aadhaarNumber: cleanAadhaar,
          otp: otp.trim(),
          name: name.trim(),
          phone: cleanPhone,
          course,
          college: college.trim(),
        });
        setAadhaarSession(result.token, result.user);
        toast.success(`Welcome to SVGA Book Bank, ${result.user.name}! 🎉`);
        navigate({ to: "/student/dashboard" });
      } else {
        const result = await verifyOtpMutation.mutateAsync({
          aadhaarNumber: cleanAadhaar,
          otp: otp.trim(),
          phone: cleanPhone,
        });
        setAadhaarSession(result.token, result.user);
        toast.success(`Welcome back, ${result.user.name}!`);
        if (result.user.membershipStatus === "PAID") {
          navigate({ to: "/student/dashboard" });
        } else {
          navigate({ to: "/student/register" });
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "OTP verification failed",
      );
    }
  };

  const isPending =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    signupMutation.isPending;

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

      <main className="flex-1 flex items-start justify-center px-4 py-10 relative z-10">
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
            <h1 className="text-2xl font-display font-bold text-foreground">
              {isNewUser ? "Create Your Account" : "Student Login"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "aadhaar"
                ? "Enter your Aadhaar number to receive an OTP"
                : isNewUser
                  ? "Complete your profile and verify your OTP"
                  : "Enter the OTP sent to your mobile"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "aadhaar" ? (
              <motion.div
                key="aadhaar-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-border shadow-warm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      Aadhaar Verification
                    </CardTitle>
                    <CardDescription>
                      Secure login using your Aadhaar-linked mobile number
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number</Label>
                      <Input
                        id="aadhaar"
                        placeholder="1234 5678 9012"
                        value={aadhaar}
                        maxLength={14}
                        onChange={(e) => {
                          setAadhaar(e.target.value.replace(/[^\d ]/g, ""));
                          if (errors.aadhaar)
                            setErrors((er) => ({ ...er, aadhaar: "" }));
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        data-ocid="student.login.aadhaar_input"
                        className={errors.aadhaar ? "border-destructive" : ""}
                      />
                      {errors.aadhaar && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="student.login.aadhaar_error"
                        >
                          {errors.aadhaar}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                          +91
                        </span>
                        <Input
                          id="phone"
                          placeholder="9876543210"
                          value={phone}
                          maxLength={10}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, ""));
                            if (errors.phone)
                              setErrors((er) => ({ ...er, phone: "" }));
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSendOtp()
                          }
                          data-ocid="student.login.phone_input"
                          className={`rounded-l-none ${
                            errors.phone ? "border-destructive" : ""
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="student.login.phone_error"
                        >
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSendOtp}
                      disabled={isPending}
                      data-ocid="student.login.send_otp_button"
                    >
                      {sendOtpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Sending OTP…
                        </>
                      ) : (
                        <>
                          <Phone className="mr-2 h-4 w-4" /> Send OTP
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-border shadow-warm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      {isNewUser ? "Complete Registration" : "OTP Verification"}
                    </CardTitle>
                    <CardDescription>
                      {isNewUser
                        ? "Fill in your details and enter the OTP to create your account"
                        : `OTP sent to mobile ending in …${phone.slice(-4)}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {demoOtp && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800"
                        data-ocid="student.login.demo_otp_box"
                      >
                        <p className="font-semibold mb-1">
                          ✅ OTP Sent (Demo Mode)
                        </p>
                        <p>
                          Your verification code:{" "}
                          <span className="font-mono font-bold text-emerald-900 text-lg tracking-[0.3em]">
                            {demoOtp}
                          </span>
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          In production this would be sent via SMS.
                        </p>
                      </motion.div>
                    )}

                    {isNewUser && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 pt-1"
                      >
                        <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-800 flex items-center gap-2">
                          <UserPlus className="h-3.5 w-3.5 shrink-0" />
                          New student detected — please complete your profile
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-name">
                            Full Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="reg-name"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (errors.name)
                                setErrors((er) => ({ ...er, name: "" }));
                            }}
                            data-ocid="student.login.name_input"
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && (
                            <p className="text-xs text-destructive">
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-course">
                            Course <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={course}
                            onValueChange={(v) => {
                              setCourse(v);
                              if (errors.course)
                                setErrors((er) => ({ ...er, course: "" }));
                            }}
                          >
                            <SelectTrigger
                              id="reg-course"
                              data-ocid="student.login.course_select"
                              className={
                                errors.course ? "border-destructive" : ""
                              }
                            >
                              <SelectValue placeholder="Select your course…" />
                            </SelectTrigger>
                            <SelectContent>
                              {COURSES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.course && (
                            <p className="text-xs text-destructive">
                              {errors.course}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-college">College</Label>
                          <Input
                            id="reg-college"
                            placeholder="Your college name (optional)"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            data-ocid="student.login.college_input"
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        placeholder="123456"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          if (errors.otp)
                            setErrors((er) => ({ ...er, otp: "" }));
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleVerifyOtp()
                        }
                        data-ocid="student.login.otp_input"
                        className={`text-center tracking-[0.5em] font-mono text-lg ${
                          errors.otp ? "border-destructive" : ""
                        }`}
                      />
                      {errors.otp && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="student.login.otp_error"
                        >
                          {errors.otp}
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleVerifyOtp}
                      disabled={isPending}
                      data-ocid="student.login.verify_otp_button"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isNewUser ? "Creating Account…" : "Verifying…"}
                        </>
                      ) : (
                        <>
                          <ChevronRight className="mr-2 h-4 w-4" />
                          {isNewUser
                            ? "Create Account & Continue"
                            : "Verify & Login"}
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("aadhaar");
                        setOtp("");
                        setDemoOtp(null);
                        setIsNewUser(false);
                        setName("");
                        setCourse("");
                        setCollege("");
                      }}
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth"
                      data-ocid="student.login.back_button"
                    >
                      ← Change Aadhaar / mobile number
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { icon: Library, text: "Free Books" },
              { icon: Shield, text: "Secure OTP" },
              { icon: IndianRupee, text: "₹200 Deposit" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/70 border border-sky-100"
              >
                <f.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground font-body">
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BrandingFooter />
    </div>
  );
}
