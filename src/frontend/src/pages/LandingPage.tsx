import { BrandingFooter, LOGO_SRC, SVGALogo } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAdminAuth, useStudentAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: BookOpen,
    title: "2000+ Books Available",
    description:
      "Science, Commerce, Arts, Medical, Engineering — every stream, all under one roof.",
  },
  {
    icon: GraduationCap,
    title: "Free for All Students",
    description:
      "Any SVGA student can borrow books. Just pay a fully refundable ₹500 deposit.",
  },
  {
    icon: Zap,
    title: "Easy & Quick Process",
    description:
      "Register online, pay, and collect your books in one visit. Simple as that.",
  },
];

const steps = [
  {
    number: "01",
    title: "Register Online",
    description:
      "Create your account and fill in your course details in minutes.",
  },
  {
    number: "02",
    title: "Pay ₹500 Deposit",
    description:
      "Pay the fully refundable membership deposit to activate your account.",
  },
  {
    number: "03",
    title: "Pick Your Books",
    description: "Browse the catalog and choose up to 3 books for your stream.",
  },
  {
    number: "04",
    title: "Collect & Enjoy",
    description:
      "Pick up from SVGA and return when done to get your deposit back.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    course: "FYJC Science",
    avatar: "P",
    text: "Got all my reference books in one go. The process was super smooth and I got my deposit back the same week I returned them!",
  },
  {
    name: "Rahul Mehta",
    course: "B.Com Final Year",
    avatar: "R",
    text: "Honestly didn't expect it to be this easy. Found all the books I needed and the challan download made it official.",
  },
  {
    name: "Sneha Patel",
    course: "SYJC Commerce",
    avatar: "S",
    text: "SVGA made starting college way less stressful. Saved a lot of money on books this semester.",
  },
];

const stats = [
  { value: "2,000+", label: "Books", sub: "across all streams" },
  { value: "500+", label: "Students", sub: "helped every year" },
  { value: "₹500", label: "Deposit", sub: "fully refundable" },
  { value: "10+", label: "Streams", sub: "FYJC to Engineering" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, membershipPaid } = useStudentAuth();
  const { isAdminAuthenticated } = useAdminAuth();

  const handleGetStarted = () => {
    if (isAdminAuthenticated()) {
      navigate({ to: "/admin/dashboard" });
    } else if (isAuthenticated && membershipPaid) {
      navigate({ to: "/student/dashboard" });
    } else if (isAuthenticated && !membershipPaid) {
      // Logged in but not paid — go to payment step
      navigate({ to: "/student/register" });
    } else {
      // Not logged in — go to login page first
      navigate({ to: "/student/login" });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: "#E8F4F8" }}
    >
      {/* ── Header ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#B8E0E8] shadow-subtle sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="hover:opacity-90 transition-smooth">
              <SVGALogo size="md" />
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/admin/login" })}
                data-ocid="landing.admin_login_button"
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Shield className="h-4 w-4 mr-1.5" />
                Admin
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/student/login" })}
                data-ocid="landing.student_login_button"
                className="bg-[#5AC8D8] hover:bg-[#88D4E0] text-white font-semibold transition-smooth"
              >
                Student Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden flex items-center justify-center min-h-[85vh] py-20"
        style={{
          background:
            "linear-gradient(160deg, #E8F4F8 0%, #B8E0E8 55%, #88D4E0 100%)",
        }}
      >
        {/* Soft background orbs */}
        <div
          className="absolute top-[-8%] right-[-5%] w-96 h-96 rounded-full pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle, #B8E0E8 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-8%] left-[-4%] w-80 h-80 rounded-full pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(circle, #88D4E0 0%, transparent 70%)",
          }}
        />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Logo centered — responsive sizing with float animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex justify-center mb-6"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-xl shrink-0 shadow-warm p-1 animate-float">
              <img
                src={LOGO_SRC}
                alt="SVGA Book Bank"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-display font-bold text-[#0c2340] leading-tight mb-4"
          >
            SVGA Book Bank
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
            className="text-lg md:text-xl text-[#1e3a5f]/80 font-body leading-relaxed mb-8 max-w-xl mx-auto"
          >
            Get free books for your studies — register, pay a refundable{" "}
            <span className="text-[#5AC8D8] font-semibold">₹500 deposit</span>,
            and take home up to{" "}
            <span className="text-[#5AC8D8] font-semibold">3 books</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="gap-2 text-base font-semibold bg-[#5AC8D8] hover:bg-[#88D4E0] text-white hover:-translate-y-1 hover:shadow-warm transition-bounce"
              onClick={handleGetStarted}
              data-ocid="landing.register_button"
            >
              {isAuthenticated && membershipPaid
                ? "Go to Dashboard"
                : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base border-[#88D4E0] text-[#1e3a5f] hover:bg-[#B8E0E8]/40 hover:-translate-y-0.5 transition-smooth"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              data-ocid="landing.how_it_works_button"
            >
              How It Works
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <CheckCircle2 className="h-4 w-4 text-[#5AC8D8] shrink-0" />
            <span className="text-sm text-[#1e3a5f]/70">
              ₹500 fully refunded when you return your books
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14" style={{ background: "#E8F4F8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="text-center p-6 rounded-2xl bg-white border border-[#B8E0E8] shadow-subtle hover-lift"
                data-ocid={`landing.stat.item.${i + 1}`}
              >
                <p className="text-3xl font-display font-bold text-[#0c2340]">
                  {s.value}
                </p>
                <p className="text-sm font-semibold text-[#1e3a5f] mt-1">
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(160deg, #E8F4F8 0%, #B8E0E8 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#5AC8D8] mb-3">
              Why Students Love SVGA
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0c2340]">
              Everything You Need, All in One Place
            </h2>
            <p className="text-[#1e3a5f]/70 text-lg mt-3 max-w-xl mx-auto">
              A modern book borrowing system built for SVGA students.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-[#B8E0E8]/50 rounded-2xl p-7 border border-[#88D4E0]/50 hover:border-[#5AC8D8]/60 hover-lift shadow-subtle"
                data-ocid={`landing.feature.item.${i + 1}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-5 shadow-subtle group-hover:scale-110 transition-smooth">
                  <f.icon className="h-6 w-6 text-[#5AC8D8]" />
                </div>
                <h3 className="font-display font-semibold text-[#0c2340] text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[#1e3a5f]/70 leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="py-20"
        style={{ background: "#E8F4F8" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#5AC8D8] mb-3">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0c2340]">
              Ready in 4 Simple Steps
            </h2>
            <p className="text-[#1e3a5f]/70 text-lg mt-3">
              Getting your books has never been easier
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 relative"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#B8E0E8] via-[#88D4E0] to-[#5AC8D8] z-0" />

            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                variants={fadeUp}
                className="flex flex-col items-center text-center relative z-10"
                data-ocid={`landing.step.item.${i + 1}`}
              >
                <div
                  className="w-18 h-18 rounded-full flex items-center justify-center text-xl font-display font-bold text-white mb-4 shadow-warm"
                  style={{
                    width: 56,
                    height: 56,
                    background:
                      "linear-gradient(135deg, #88D4E0 0%, #5AC8D8 100%)",
                  }}
                >
                  {s.number}
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#B8E0E8] w-full shadow-subtle">
                  <h3 className="font-display font-semibold text-[#0c2340] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#1e3a5f]/70 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(160deg, #B8E0E8 0%, #E8F4F8 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#5AC8D8] mb-3">
              What Students Say
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0c2340]">
              Loved by students across Mumbai
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 border border-[#B8E0E8] shadow-subtle hover-lift"
                data-ocid={`landing.testimonial.item.${i + 1}`}
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-[#5AC8D8] text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-[#1e3a5f]/80 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm text-white"
                    style={{
                      background: "linear-gradient(135deg, #88D4E0, #5AC8D8)",
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0c2340] text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.course}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #88D4E0 0%, #B8E0E8 50%, #E8F4F8 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-6"
          >
            <motion.div variants={fadeUp} className="flex justify-center">
              <div className="h-16 w-16 rounded-xl shrink-0 shadow-warm p-1">
                <img
                  src={LOGO_SRC}
                  alt="SVGA Book Bank"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-display font-bold text-[#0c2340]"
            >
              Ready to Get Your Books?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[#1e3a5f]/80 text-lg leading-relaxed"
            >
              Join thousands of students who've saved on textbooks through SVGA.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
            >
              <Button
                size="lg"
                className="bg-[#5AC8D8] hover:bg-[#88D4E0] text-white font-semibold gap-2 hover:-translate-y-1 hover:shadow-warm transition-bounce"
                onClick={handleGetStarted}
                data-ocid="landing.cta_register_button"
              >
                {isAuthenticated && membershipPaid
                  ? "Go to Dashboard"
                  : "Get Started for Free"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#88D4E0] text-[#1e3a5f] hover:bg-[#B8E0E8]/40 hover:-translate-y-0.5 transition-smooth"
                onClick={() => navigate({ to: "/student/login" })}
                data-ocid="landing.cta_signin_button"
              >
                Already a member?
              </Button>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-[#1e3a5f]/60 text-sm pt-2"
            >
              ✓ Free for all SVGA students &nbsp;&nbsp; ✓ ₹500 fully refundable
              &nbsp;&nbsp; ✓ No hidden charges
            </motion.p>
          </motion.div>
        </div>
      </section>

      <BrandingFooter />
    </div>
  );
}
