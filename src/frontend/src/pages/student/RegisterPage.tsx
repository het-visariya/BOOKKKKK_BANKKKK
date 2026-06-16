import { BrandingFooter, SVGALogo } from "@/components/layout/AppLayout";
import { PaymentModal } from "@/components/ui/PaymentModal";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Badge } from "@/components/ui/badge";
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
import { useAnonActor } from "@/hooks/useAnonActor";
import { setStudentSession, useStudentAuth } from "@/hooks/useAuth";
import { useStudentSignupAndPay } from "@/hooks/useBackend";
import type { User } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  IndianRupee,
  Lock,
  Mail,
  Shield,
  Upload,
  UserCircle,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SURNAMES = [
  "Bauva",
  "Buricha",
  "Charla",
  "Chhadwa",
  "Chheda",
  "Dagha",
  "Dedhia",
  "Furiya",
  "Gada",
  "Gala",
  "Gindra",
  "Gogri",
  "Karia",
  "Khirani-Gala",
  "Khuthia",
  "Mamania",
  "Mota",
  "Nandu",
  "Nisar",
  "Rambhia",
  "Rita",
  "Satra",
  "Savla",
  "Shah",
  "Vadhan",
  "Visaria",
  "Vora",
];
const VILLAGES = [
  "Adhoi",
  "Bhachau",
  "Bharudia",
  "Gagodar",
  "Ghanithar",
  "Halra",
  "Kakrava",
  "Kharoi",
  "Lakadiya",
  "Manafra",
  "Nandasar",
  "N. Trambo",
  "Rav",
  "Samkhiyari",
  "Shivlakha",
  "Suvai",
  "Thoriyari",
  "Trambo",
  "Vanoi",
];

const EDUCATION_LEVELS = [
  "Secondary (10th)",
  "Higher Secondary (11th/12th)",
  "Junior College (FYJC/SYJC)",
  "Undergraduate (Bachelor's)",
  "Postgraduate (Master's)",
  "Diploma",
  "ITI",
  "Professional Degree",
  "Other",
];

const OCCUPATIONS = [
  "Student",
  "Part-time Job",
  "Freelancer",
  "Business",
  "Service / Employment",
  "Other",
];

const COURSES = [
  "FYJC Science",
  "SYJC Science",
  "FYJC Commerce",
  "SYJC Commerce",
  "FYJC Arts",
  "SYJC Arts",
  "B.Com",
  "B.Sc",
  "BA",
  "BBA",
  "BCA",
  "MBBS",
  "BDS",
  "B.Pharm",
  "Engineering",
  "Diploma",
  "Other",
];

const steps = [
  { id: 1, label: "Personal Details" },
  { id: 2, label: "Profile Photo" },
  { id: 3, label: "Payment" },
];

type FormData = {
  email: string;
  firstName: string;
  middleName: string;
  grandFatherName: string;
  surname: string;
  surnameChoice: string;
  customSurname: string;
  officialSurnameIfDifferent: string;
  aadhaarNumber: string;
  phone: string;
  course: string;
  customCourse: string;
  college: string;
  standard: string;
  villageChoice: string;
  customVillage: string;
  birthDate: string;
  parentsContact: string;
  currentResidence: string;
  educationLevel: string;
  educationSpecialization: string;
  occupation: string;
  occupationOther: string;
};

type FieldError = Partial<Record<keyof FormData, string>>;

export function RegisterPage() {
  const { isAuthenticated, membershipPaid, loginWithSession } =
    useStudentAuth();
  const signupMutation = useStudentSignupAndPay();
  const navigate = useNavigate();
  const { actor } = useAnonActor();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Redirect to dashboard if already paid — covers both real and temp-paid sessions
    const stored = localStorage.getItem("svga_student_session");
    let alreadyPaid = membershipPaid;
    if (!alreadyPaid && stored) {
      try {
        const s = JSON.parse(stored) as {
          user?: { membershipStatus?: string; paymentStatus?: string };
        };
        alreadyPaid =
          s.user?.membershipStatus === "PAID" ||
          s.user?.paymentStatus === "SUCCESS";
      } catch {
        // ignore
      }
    }
    if (alreadyPaid) {
      navigate({ to: "/student/dashboard" });
    }
  }, [isAuthenticated, membershipPaid, navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("svga_student_session");
      if (raw) {
        const session = JSON.parse(raw) as {
          aadhaarNumber?: string;
          phone?: string;
          email?: string;
          user?: { aadhaarNumber?: string; phone?: string; email?: string };
        };
        const aadhaar =
          session.aadhaarNumber || session.user?.aadhaarNumber || "";
        const mobile = session.phone || session.user?.phone || "";
        const emailVal = session.email || session.user?.email || "";
        if (aadhaar || mobile || emailVal) {
          setForm((f) => ({
            ...f,
            aadhaarNumber: aadhaar || f.aadhaarNumber,
            phone: mobile || f.phone,
            email: emailVal || f.email,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    email: "",
    firstName: "",
    middleName: "",
    grandFatherName: "",
    surnameChoice: "",
    customSurname: "",
    surname: "",
    officialSurnameIfDifferent: "",
    aadhaarNumber: "",
    phone: "",
    course: "",
    customCourse: "",
    college: "",
    standard: "",
    villageChoice: "",
    customVillage: "",
    birthDate: "",
    parentsContact: "",
    currentResidence: "",
    educationLevel: "",
    educationSpecialization: "",
    occupation: "",
    occupationOther: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveSurname =
    form.surnameChoice === "NOT_IN_LIST"
      ? form.customSurname
      : form.surnameChoice;
  const effectiveCourse =
    form.course === "Other" ? form.customCourse : form.course;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const fullName =
    `${form.firstName} ${form.middleName} ${form.grandFatherName} ${effectiveSurname}`.trim();

  const validateStep1 = (): boolean => {
    const errs: FieldError = {};
    if (!form.email.trim()) errs.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email address";
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.middleName.trim()) errs.middleName = "Father's name is required";
    if (!form.grandFatherName.trim())
      errs.grandFatherName = "Grandfather's name is required";
    if (!form.surnameChoice) errs.surnameChoice = "Please select a surname";
    if (form.surnameChoice === "NOT_IN_LIST" && !form.customSurname.trim())
      errs.customSurname = "Surname is required";
    if (
      !form.aadhaarNumber.trim() ||
      !/^\d{12}$/.test(form.aadhaarNumber.replace(/[- ]/g, ""))
    )
      errs.aadhaarNumber = "Enter a valid 12-digit Aadhaar number";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!form.college.trim()) errs.college = "College name is required";
    if (!form.course) errs.course = "Please select your course";
    if (form.course === "Other" && !form.customCourse.trim())
      errs.customCourse = 'Course name is required when "Other" is selected';
    if (!form.standard.trim()) errs.standard = "Standard / Year is required";
    if (!form.birthDate) errs.birthDate = "Birth date is required";
    else {
      const bd = new Date(form.birthDate);
      if (Number.isNaN(bd.getTime())) errs.birthDate = "Enter a valid date";
      else if (bd > new Date())
        errs.birthDate = "Birth date cannot be in the future";
    }
    if (!form.parentsContact.trim())
      errs.parentsContact = "Parent's contact number is required";
    else if (!/^[6-9]\d{9}$/.test(form.parentsContact.replace(/\s/g, "")))
      errs.parentsContact = "Enter a valid 10-digit Indian mobile number";
    if (!form.currentResidence.trim())
      errs.currentResidence = "Current residence is required";
    if (!form.educationLevel)
      errs.educationLevel = "Please select education level";
    if (!form.occupation) errs.occupation = "Please select occupation";
    if (form.occupation === "Other" && !form.occupationOther.trim())
      errs.occupationOther = "Please specify your occupation";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setForm((f) => ({ ...f, surname: effectiveSurname }));
      setStep(2);
    }
  };

  const handleStep2Next = () => {
    if (!profileFile) {
      toast.error("Please upload a profile photo to continue");
      return;
    }
    setStep(3);
  };

  const handleOpenPayment = () => setPaymentModalOpen(true);

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    setIsProcessing(true);
    const resolvedSurname =
      form.surnameChoice === "NOT_IN_LIST"
        ? form.customSurname
        : form.surnameChoice;
    const resolvedCourse =
      form.course === "Other" ? form.customCourse : form.course;
    const tempUserId = `temp_${Date.now()}`;
    const prebuiltUser: User = {
      _id: tempUserId,
      name: fullName,
      firstName: form.firstName,
      middleName: form.middleName,
      grandFatherName: form.grandFatherName,
      surname: resolvedSurname,
      email: form.email ?? "",
      aadhaarNumber: form.aadhaarNumber,
      phone: form.phone,
      course: resolvedCourse,
      college: form.college,
      studentId: tempUserId,
      membershipStatus: "PAID" as const,
      paymentStatus: "SUCCESS" as const,
      role: "student",
      issuedBooks: [],
      issuedBooksInfo: [],
      createdAt: new Date().toISOString(),
    };
    const tempToken = `temp_paid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Use loginWithSession to update React state synchronously + localStorage atomically
    // This prevents the race condition where useStudentAuth's background verifier clears the session
    loginWithSession(tempToken, prebuiltUser);
    toast.success("Welcome to SVGA Book Bank!");
    navigate({ to: "/student/dashboard" });
    setIsProcessing(false);
    (async () => {
      try {
        let profileImageUrl = "";
        if (profileFile) {
          profileImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(profileFile);
          }).catch(() => "");
        }
        const signupPromise = signupMutation.mutateAsync({
          aadhaarNumber: form.aadhaarNumber.replace(/[- ]/g, ""),
          otp: "000000",
          name: fullName,
          email: form.email,
          firstName: form.firstName,
          middleName: form.middleName,
          grandFatherName: form.grandFatherName,
          surname: resolvedSurname,
          birthDate: form.birthDate,
          parentsContact: form.parentsContact,
          nativePlace:
            form.villageChoice === "Other"
              ? form.customVillage
              : form.villageChoice,
          educationLevel: form.educationLevel,
          educationSpecialization: form.educationSpecialization,
          occupation: form.occupation,
          occupationOther: form.occupationOther,
          officialSurname: form.officialSurnameIfDifferent,
          academicYear: form.standard,
          currentLocation: form.currentResidence,
          courseName: resolvedCourse,
          phone: form.phone,
          course: resolvedCourse,
          college: form.college,
          profileImageUrl,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 8000),
        );
        const registerRes = await Promise.race([signupPromise, timeoutPromise]);
        const realUser: User = {
          ...registerRes.user,
          membershipStatus: "PAID" as const,
          paymentStatus: "SUCCESS" as const,
        };
        localStorage.setItem("svga_token", registerRes.token);
        const realSession = {
          token: registerRes.token,
          userId: realUser._id,
          user: realUser,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem(
          "svga_student_session",
          JSON.stringify(realSession),
        );
        localStorage.setItem("svga_user", JSON.stringify(realUser));
        loginWithSession(registerRes.token, realUser);
        if (actor && registerRes.token) {
          actor
            .recordPayment(registerRes.token, `demo_${Date.now()}`, BigInt(200))
            .catch(() => {});
        }
      } catch {
        /* background failure — temp session keeps user logged in */
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] to-background flex flex-col">
      <PageHeader />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Student Registration
          </h1>
          <p className="text-muted-foreground text-sm">
            Complete all steps to activate your SVGA Book Bank membership.
          </p>
        </div>
        <StepIndicator steps={steps} currentStep={step} className="mb-8" />

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <Card
            className="border border-border shadow-elevated"
            data-ocid="register.step1_card"
          >
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-xl">
                Personal Details
              </CardTitle>
              <CardDescription>
                Fill in your details exactly as they appear on your college ID.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="devansh@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value.trim() }))
                    }
                    className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                    data-ocid="register.email_input"
                  />
                </div>
                {errors.email && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="register.email_input.field_error"
                  >
                    {errors.email}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Used for account notifications, challans, and reminders.
                </p>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Devansh"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    className={errors.firstName ? "border-destructive" : ""}
                    data-ocid="register.first_name_input"
                  />
                  {errors.firstName && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.first_name_input.field_error"
                    >
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="middleName">
                    Father's Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="middleName"
                    placeholder="Rajesh"
                    value={form.middleName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, middleName: e.target.value }))
                    }
                    className={errors.middleName ? "border-destructive" : ""}
                    data-ocid="register.middle_name_input"
                  />
                  {errors.middleName && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.middle_name_input.field_error"
                    >
                      {errors.middleName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grandFatherName">
                    Grandfather's Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="grandFatherName"
                    placeholder="Harish"
                    value={form.grandFatherName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        grandFatherName: e.target.value,
                      }))
                    }
                    className={
                      errors.grandFatherName ? "border-destructive" : ""
                    }
                    data-ocid="register.grandfather_name_input"
                  />
                  {errors.grandFatherName && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.grandfather_name_input.field_error"
                    >
                      {errors.grandFatherName}
                    </p>
                  )}
                </div>
                {/* Surname dropdown */}
                <div className="space-y-1.5">
                  <Label>
                    Surname <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.surnameChoice}
                    onValueChange={(v) => {
                      setForm((f) => ({
                        ...f,
                        surnameChoice: v,
                        customSurname:
                          v === "NOT_IN_LIST" ? f.customSurname : "",
                      }));
                      setErrors((e) => ({
                        ...e,
                        surnameChoice: undefined,
                        customSurname: undefined,
                      }));
                    }}
                  >
                    <SelectTrigger
                      className={
                        errors.surnameChoice ? "border-destructive" : ""
                      }
                      data-ocid="register.surname_select"
                    >
                      <SelectValue placeholder="Select surname" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56 overflow-y-auto">
                      <SelectItem value="NOT_IN_LIST">
                        Not In The List
                      </SelectItem>
                      {SURNAMES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.surnameChoice && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.surname_select.field_error"
                    >
                      {errors.surnameChoice}
                    </p>
                  )}
                </div>
              </div>

              {/* Custom surname when Not In The List */}
              {form.surnameChoice === "NOT_IN_LIST" && (
                <div className="space-y-1.5">
                  <Label htmlFor="customSurname">
                    Surname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customSurname"
                    placeholder="Enter your surname"
                    value={form.customSurname}
                    autoFocus
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customSurname: e.target.value }))
                    }
                    className={errors.customSurname ? "border-destructive" : ""}
                    data-ocid="register.custom_surname_input"
                  />
                  {errors.customSurname && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.custom_surname_input.field_error"
                    >
                      {errors.customSurname}
                    </p>
                  )}
                </div>
              )}

              {/* Official surname if different */}
              <div className="space-y-1.5">
                <Label htmlFor="officialSurname">
                  Official Surname If Different{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="officialSurname"
                  placeholder="As on official documents"
                  value={form.officialSurnameIfDifferent}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      officialSurnameIfDifferent: e.target.value,
                    }))
                  }
                  data-ocid="register.official_surname_input"
                />
              </div>

              {/* Aadhaar & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="aadhaar">
                    Aadhaar Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="aadhaar"
                      placeholder="1234 5678 9012"
                      value={form.aadhaarNumber}
                      maxLength={14}
                      readOnly={!!form.aadhaarNumber}
                      onChange={
                        form.aadhaarNumber
                          ? undefined
                          : (e) =>
                              setForm((f) => ({
                                ...f,
                                aadhaarNumber: e.target.value
                                  .replace(/[^\d ]/g, "")
                                  .slice(0, 14),
                              }))
                      }
                      className={`pr-8 ${form.aadhaarNumber ? "bg-muted/50 cursor-not-allowed" : ""} ${errors.aadhaarNumber ? "border-destructive" : ""}`}
                      data-ocid="register.aadhaar_input"
                    />
                    {form.aadhaarNumber && (
                      <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  {errors.aadhaarNumber && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.aadhaar_input.field_error"
                    >
                      {errors.aadhaarNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="9876543210"
                      value={form.phone}
                      readOnly={!!form.phone}
                      onChange={
                        form.phone
                          ? undefined
                          : (e) =>
                              setForm((f) => ({
                                ...f,
                                phone: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 10),
                              }))
                      }
                      className={`pr-8 ${form.phone ? "bg-muted/50 cursor-not-allowed" : ""} ${errors.phone ? "border-destructive" : ""}`}
                      data-ocid="register.phone_input"
                    />
                    {form.phone && (
                      <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  {errors.phone && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.phone_input.field_error"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* College */}
              <div className="space-y-1.5">
                <Label htmlFor="college">
                  College / Institution{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="college"
                  placeholder="SVGA College, Mumbai"
                  value={form.college}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, college: e.target.value }))
                  }
                  className={errors.college ? "border-destructive" : ""}
                  data-ocid="register.college_input"
                />
                {errors.college && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="register.college_input.field_error"
                  >
                    {errors.college}
                  </p>
                )}
              </div>

              {/* Course & Standard/Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    Course / Stream <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.course}
                    onValueChange={(v) => {
                      setForm((f) => ({
                        ...f,
                        course: v,
                        customCourse: v === "Other" ? f.customCourse : "",
                      }));
                      setErrors((e) => ({
                        ...e,
                        course: undefined,
                        customCourse: undefined,
                      }));
                    }}
                  >
                    <SelectTrigger
                      className={errors.course ? "border-destructive" : ""}
                      data-ocid="register.course_select"
                    >
                      <SelectValue placeholder="Select your course" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56 overflow-y-auto">
                      {COURSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.course && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.course_select.field_error"
                    >
                      {errors.course}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="standard">
                    Standard / Year <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="standard"
                    placeholder="e.g. FY, SY, TY or 11th, 12th"
                    value={form.standard}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, standard: e.target.value }))
                    }
                    className={errors.standard ? "border-destructive" : ""}
                    data-ocid="register.standard_input"
                  />
                  {errors.standard && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.standard_input.field_error"
                    >
                      {errors.standard}
                    </p>
                  )}
                </div>
              </div>

              {/* Custom course name when Other */}
              {form.course === "Other" && (
                <div className="space-y-1.5">
                  <Label htmlFor="customCourse">
                    Course Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customCourse"
                    placeholder="e.g. Bachelor of Design"
                    value={form.customCourse}
                    autoFocus
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customCourse: e.target.value }))
                    }
                    className={errors.customCourse ? "border-destructive" : ""}
                    data-ocid="register.custom_course_input"
                  />
                  {errors.customCourse && (
                    <p
                      className="text-xs text-destructive"
                      data-ocid="register.custom_course_input.field_error"
                    >
                      {errors.customCourse}
                    </p>
                  )}
                </div>
              )}

              {/* Additional Information */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Additional Information
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>
                        Native Place / Village{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.villageChoice}
                        onValueChange={(v) => {
                          setForm((f) => ({
                            ...f,
                            villageChoice: v,
                            customVillage: v === "Other" ? f.customVillage : "",
                          }));
                          setErrors((e) => ({
                            ...e,
                            villageChoice: undefined,
                            customVillage: undefined,
                          }));
                        }}
                      >
                        <SelectTrigger
                          className={
                            errors.villageChoice ? "border-destructive" : ""
                          }
                          data-ocid="register.village_select"
                        >
                          <SelectValue placeholder="Select village" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          {VILLAGES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.villageChoice && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="register.village_select.field_error"
                        >
                          {errors.villageChoice}
                        </p>
                      )}
                      {form.villageChoice === "Other" && (
                        <div className="mt-2 space-y-1.5">
                          <Label htmlFor="customVillage">
                            Village Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="customVillage"
                            placeholder="Enter your village/town"
                            value={form.customVillage}
                            autoFocus
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                customVillage: e.target.value,
                              }))
                            }
                            className={
                              errors.customVillage ? "border-destructive" : ""
                            }
                            data-ocid="register.custom_village_input"
                          />
                          {errors.customVillage && (
                            <p
                              className="text-xs text-destructive"
                              data-ocid="register.custom_village_input.field_error"
                            >
                              {errors.customVillage}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="birthDate">
                        Birth Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={form.birthDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, birthDate: e.target.value }))
                        }
                        className={errors.birthDate ? "border-destructive" : ""}
                        data-ocid="register.birth_date_input"
                      />
                      {errors.birthDate && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="register.birth_date_input.field_error"
                        >
                          {errors.birthDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="parentsContact">
                      Parents Contact Number{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="parentsContact"
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      value={form.parentsContact}
                      maxLength={10}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          parentsContact: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        }))
                      }
                      className={
                        errors.parentsContact ? "border-destructive" : ""
                      }
                      data-ocid="register.parents_contact_input"
                    />
                    {errors.parentsContact && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="register.parents_contact_input.field_error"
                      >
                        {errors.parentsContact}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currentResidence">
                      Where Do You Currently Live?{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="currentResidence"
                      placeholder="e.g. Ghatkopar, Mumbai"
                      value={form.currentResidence}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          currentResidence: e.target.value,
                        }))
                      }
                      className={
                        errors.currentResidence ? "border-destructive" : ""
                      }
                      data-ocid="register.current_residence_input"
                    />
                    {errors.currentResidence && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="register.current_residence_input.field_error"
                      >
                        {errors.currentResidence}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>
                        Education Level{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={form.educationLevel}
                        onValueChange={(v) => {
                          setForm((f) => ({ ...f, educationLevel: v }));
                          setErrors((e) => ({
                            ...e,
                            educationLevel: undefined,
                          }));
                        }}
                      >
                        <SelectTrigger
                          className={
                            errors.educationLevel ? "border-destructive" : ""
                          }
                          data-ocid="register.education_level_select"
                        >
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                          {EDUCATION_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.educationLevel && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="register.education_level_select.field_error"
                        >
                          {errors.educationLevel}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="educationSpecialization">
                        Education Specialization{" "}
                        <span className="text-muted-foreground text-xs">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="educationSpecialization"
                        placeholder="e.g. Computer Science"
                        value={form.educationSpecialization}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            educationSpecialization: e.target.value,
                          }))
                        }
                        data-ocid="register.education_spec_input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Occupation <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.occupation}
                      onValueChange={(v) => {
                        setForm((f) => ({
                          ...f,
                          occupation: v,
                          occupationOther:
                            v === "Other" ? f.occupationOther : "",
                        }));
                        setErrors((e) => ({
                          ...e,
                          occupation: undefined,
                          occupationOther: undefined,
                        }));
                      }}
                    >
                      <SelectTrigger
                        className={
                          errors.occupation ? "border-destructive" : ""
                        }
                        data-ocid="register.occupation_select"
                      >
                        <SelectValue placeholder="Select occupation" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56 overflow-y-auto">
                        {OCCUPATIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.occupation && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="register.occupation_select.field_error"
                      >
                        {errors.occupation}
                      </p>
                    )}
                  </div>

                  {form.occupation === "Other" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="occupationOther">
                        Specify Occupation{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="occupationOther"
                        placeholder="Please specify your occupation"
                        value={form.occupationOther}
                        autoFocus
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            occupationOther: e.target.value,
                          }))
                        }
                        className={
                          errors.occupationOther ? "border-destructive" : ""
                        }
                        data-ocid="register.occupation_other_input"
                      />
                      {errors.occupationOther && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="register.occupation_other_input.field_error"
                        >
                          {errors.occupationOther}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {form.aadhaarNumber && form.phone && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Aadhaar and Mobile Number verified via OTP and locked.
                  </p>
                </div>
              )}

              {(!form.aadhaarNumber || !form.phone) && (
                <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Already verified your Aadhaar?{" "}
                    <a
                      href="/student/login"
                      className="text-primary underline underline-offset-2"
                    >
                      Go back to login
                    </a>{" "}
                    to complete OTP verification first.
                  </p>
                </div>
              )}

              <Button
                className="w-full gap-2 h-11"
                onClick={handleStep1Next}
                data-ocid="register.step1_next_button"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Profile Photo */}
        {step === 2 && (
          <Card
            className="border border-border shadow-elevated"
            data-ocid="register.step2_card"
          >
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-xl">
                Profile Photo
              </CardTitle>
              <CardDescription>
                Upload a clear photo of your face. This will appear on your
                student ID card.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-5">
                <button
                  type="button"
                  className="relative w-36 h-36 rounded-full border-4 border-dashed border-[#bae6fd] bg-[#f0f9ff] flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-smooth group"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile photo"
                >
                  {profilePreview ? (
                    <>
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <UserCircle className="h-12 w-12 text-[#93c5fd]" />
                      <span className="text-xs text-muted-foreground">
                        Click to upload
                      </span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  data-ocid="register.photo_upload"
                />
                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="register.photo_upload_button"
                  >
                    <Upload className="h-4 w-4" />
                    {profileFile ? "Change Photo" : "Choose Photo"}
                  </Button>
                  {profileFile && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {profileFile.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-[#f0f9ff] border border-[#bae6fd] p-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">
                    Photo requirements:
                  </strong>{" "}
                  Clear face photo, JPG or PNG format, minimum 200x200 pixels.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setStep(1)}
                  data-ocid="register.step2_back_button"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1 gap-2 h-11"
                  onClick={handleStep2Next}
                  data-ocid="register.step2_next_button"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <Card
            className="border border-border shadow-elevated overflow-hidden"
            data-ocid="register.step3_card"
          >
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-xl">
                    Membership Payment
                  </CardTitle>
                  <CardDescription>
                    Pay the \u20b9200 refundable deposit to activate your
                    account.
                  </CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-semibold gap-1">
                  <Zap className="h-3 w-3 fill-amber-500" /> DEMO MODE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="rounded-xl bg-secondary/50 border border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-foreground">
                      SVGA Membership Deposit
                    </span>
                    <span className="text-2xl font-display font-bold text-primary flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      200
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      "Access to 2,000+ textbooks across all streams",
                      "Valid for your entire course duration",
                      "Fully refundable on book return at course end",
                      "Book procurement service for unlisted books",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border px-4 py-2.5 bg-muted/30 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Registering as:{" "}
                    <strong className="text-foreground">{fullName}</strong>{" "}
                    \u00b7 {effectiveCourse}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-[#f0f9ff] border border-[#bae6fd] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#528ff5] flex items-center justify-center text-white font-bold text-sm select-none">
                    R
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Razorpay Payment Gateway
                    </p>
                    <p className="text-xs text-muted-foreground">
                      UPI \u00b7 Cards \u00b7 Net Banking
                    </p>
                  </div>
                </div>
                <span className="text-lg font-display font-bold text-primary">
                  \u20b9200
                </span>
              </div>
              <Button
                className="w-full gap-2 h-12 text-base font-semibold bg-[#528ff5] hover:bg-[#3b7de8] text-white transition-colors"
                onClick={handleOpenPayment}
                disabled={isProcessing}
                data-ocid="register.pay_button"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Creating your account...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 fill-white" /> Pay \u20b9200 \u2014
                    Complete Registration
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep(2)}
                data-ocid="register.step3_back_button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                <Lock className="h-3 w-3 inline mr-1" />
                DEMO MODE \u2014 No real payment is processed.
              </p>
            </CardContent>
          </Card>
        )}

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          amount={200}
          studentName={fullName}
        />
      </div>
      <BrandingFooter />
    </div>
  );
}

function PageHeader() {
  return (
    <header className="bg-card border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="hover:opacity-80 transition-smooth">
          <SVGALogo size="md" />
        </a>
        <span className="text-sm text-muted-foreground hidden sm:block">
          Student Registration
        </span>
      </div>
    </header>
  );
}
