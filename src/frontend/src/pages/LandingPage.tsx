import { type MouseEvent, useEffect, useRef, useState } from "react";
import { BrandingFooter, getLogoSrc } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAdminAuth, useStudentAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, Clock, Mail, MapPin, Menu, Phone, Shield, Smile, User, Wallet, X, Zap } from "lucide-react";
import sponsor1 from "@/assets/sponsors/sponsor1.png";
import sponsor2 from "@/assets/sponsors/sponsor2.png";
import sponsor3 from "@/assets/sponsors/sponsor3.png";
import sponsor4 from "@/assets/sponsors/sponsor4.png";

const navItems = [
  { label: "Sponsors", href: "#sponsors" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#how-it-works" },
  { label: "Feedback", href: "#feedback" },
  { label: "Location", href: "#location" },
  { label: "About Us", href: "#about-us" },
];

const buttonSpring = { type: "spring", stiffness: 140, damping: 18 };

const navItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const menuVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const timelineSteps = [
  {
    number: "01",
    title: "Register Online",
    description: "Create your student profile in minutes.",
    icon: User,
  },
  {
    number: "02",
    title: "Pay Deposit",
    description: "Pay the refundable ₹500 membership deposit.",
    icon: Wallet,
  },
  {
    number: "03",
    title: "Pick Books",
    description: "Select the books required for your semester.",
    icon: BookOpen,
  },
  {
    number: "04",
    title: "Collect & Enjoy",
    description: "Collect your books from the library and start studying.",
    icon: Smile,
  },
];

const sponsors = [
  { src: sponsor1, alt: "Sponsor Poster 1" },
  { src: sponsor2, alt: "Sponsor Poster 2" },
  { src: sponsor3, alt: "Sponsor Poster 3" },
  { src: sponsor4, alt: "Sponsor Poster 4" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    course: "FYJC Science",
    avatar: "P",
    text: "The membership was seamless and I got my refund the same week I returned the books.",
  },
  {
    name: "Rahul Mehta",
    course: "B.Com Final Year",
    avatar: "R",
    text: "I found all my textbooks in one place and the process was refreshingly fast.",
  },
  {
    name: "Sneha Patel",
    course: "SYJC Commerce",
    avatar: "S",
    text: "SVGA simplified the entire semester for me and saved a ton of money.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

function SponsorCard({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.03 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative flex h-[178px] min-w-[280px] items-center justify-center overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.08)] transition duration-300 ease-out hover:border-cyan-400/80 hover:shadow-[0_22px_60px_-26px_rgba(15,23,42,0.18)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/40 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="flex h-full w-full items-center justify-center rounded-[22px] border border-slate-200/70 bg-slate-50/70 p-5">
          <img src={src} alt={alt} className="max-h-[140px] max-w-full object-contain" />
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ name, course, avatar, text }: typeof testimonials[number]) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03, boxShadow: "0 24px 70px rgba(15,23,42,0.12)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-[24px] border border-[#D7EFF6] bg-white/90 p-8 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.1)]"
    >
      <p className="text-base leading-relaxed text-[#1f4255]">“{text}”</p>
      <div className="mt-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5AC8D8] to-[#88D4E0] text-white font-display font-bold">
          {avatar}
        </div>
        <div>
          <p className="text-base font-semibold text-slate-950">{name}</p>
          <p className="text-sm text-slate-500">{course}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineStep({ number, title, description, Icon }: { number: string; title: string; description: string; Icon: typeof User }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex min-h-[260px] flex-col items-center rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_50px_-30px_rgba(15,23,42,0.12)] transition duration-300 hover:bg-slate-50/80"
    >
      <div className="absolute inset-x-0 top-8 z-0">
        <span className="mx-auto inline-block text-[5rem] font-extrabold tracking-[0.02em] text-slate-950/5 opacity-80">{number}</span>
      </div>
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.08)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_24px_60px_-30px_rgba(14,165,233,0.18)]">
        <Icon className="h-10 w-10 text-[#0B5E78]" />
      </div>
      <div className="relative z-10 mt-10 space-y-3">
        <h3 className="text-lg font-semibold text-slate-950 transition duration-300 group-hover:text-[#0B5E78]">{title}</h3>
        <p className="max-w-xs text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </motion.div>
  );
}

function LocationCard() {
  return (
    <div className="rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.12)]">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0B5E78]">Our Location</p>
        <h3 className="mt-4 text-3xl font-display font-bold text-slate-950">Our Location</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">Find us easily. Drop by to register, pick up your books, or return them at your convenience.</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-[24px] bg-slate-50 p-4 shadow-[0_18px_48px_-28px_rgba(11,94,120,0.08)]">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#0B5E78]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">SVGA Multipurpose Centre</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">8th Floor, M Square (Park Plaza)<br />Prof. V. S. Agashe Road<br />Off Bhavani Shankar Road<br />Dadar West<br />Mumbai, Maharashtra – 400028</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-4 shadow-[0_18px_48px_-28px_rgba(11,94,120,0.08)]">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#0B5E78]">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Phone</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">090223 13382</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-4 shadow-[0_18px_48px_-28px_rgba(11,94,120,0.08)]">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-[#0B5E78]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Working Hours</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Monday – Saturday<br />9:00 AM – 5:00 PM<br />Sunday Closed</p>
            </div>
          </div>
        </div>
      </div>

      <a
        href="https://www.google.com/maps?q=Shree+Vagad+Graduates+Association+%28SVGA%29+M+Square+Park+Plaza+Dadar+West+Mumbai+400028"
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[16px] bg-gradient-to-r from-[#0B5E78] via-[#0F7A96] to-[#0D82A3] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_50px_-30px_rgba(11,94,120,0.65)] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(11,94,120,0.45)]"
      >
        <MapPin className="h-5 w-5" />
        Get Directions
      </a>
    </div>
  );
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, membershipPaid } = useStudentAuth();
  const { isAdminAuthenticated } = useAdminAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>("#features");
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || "#features");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuPanelRef.current &&
        !menuPanelRef.current.contains(event.target as Node) &&
        !menuButtonRef.current?.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleGetStarted = () => {
    if (isAdminAuthenticated()) {
      navigate({ to: "/admin/dashboard" });
    } else if (isAuthenticated && membershipPaid) {
      navigate({ to: "/student/dashboard" });
    } else if (isAuthenticated && !membershipPaid) {
      navigate({ to: "/student/register" });
    } else {
      navigate({ to: "/student/login" });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-[#0c2340] bg-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[56vh]"
        style={{
          background: "linear-gradient(180deg, #061B4D 0%, #082766 10%, #0F3F96 20%, #1F67D8 32%, #5FAEFF 48%, rgba(191,232,255,0.78) 60%, rgba(234,248,255,0.5) 70%, rgba(247,251,255,0.22) 82%, transparent 100%)",
        }}
      />
      <motion.header
        initial={{ opacity: 0, y: -23 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed inset-x-0 top-5 z-50 mx-4 md:mx-6 lg:mx-8 xl:mx-10 2xl:mx-12 transition-all duration-300 ease-in-out rounded-[24px] ${
          scrolled
            ? "border bg-[rgba(255,255,255,0.93)] backdrop-blur-[18px] shadow-[0_12px_40px_rgba(8,30,90,0.08)] py-2.5"
            : "border bg-[rgba(255,255,255,0.93)] backdrop-blur-[18px] shadow-[0_12px_40px_rgba(8,30,90,0.08)] py-3.5"
        }`}
        style={{ borderColor: "rgba(255,255,255,0.35)" }}
        aria-label="Primary navigation"
      >
        <div className="mx-auto flex max-w-[1520px] items-center justify-between px-4 sm:px-6 md:px-10 lg:px-12 xl:px-14">
          <Link to="/" className="group flex items-center gap-3 transition-transform duration-300 hover:-translate-y-0.5" aria-label="SVGA Book Bank home">
            <motion.div
              whileHover={{ y: -2, scale: 1.03, boxShadow: "0 14px 30px rgba(11,94,120,0.12)" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="inline-flex items-center gap-3"
            >
              <img
                src={getLogoSrc("default")}
                alt="SVGA logo"
                className={`h-12 w-auto transition-transform duration-300 ${scrolled ? "scale-[0.96]" : "scale-100"}`}
              />
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold tracking-tight text-slate-950">SVGA</span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Book Bank</span>
              </div>
            </motion.div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Landing page sections">
            {navItems.map((item) => {
              const isActive = activeHash === item.href;
              return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={`group relative inline-flex items-center text-sm font-semibold transition duration-200 ease-in-out ${
                    isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
                  }`}
                  whileHover={{ y: -1 }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                  <span className="pointer-events-none absolute left-1/2 bottom-0 h-[1px] w-6 -translate-x-1/2 scale-x-0 rounded-full bg-slate-950 transition-all duration-200 ease-in-out group-hover:scale-x-100 group-hover:w-8" />
                </motion.a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <motion.button
              whileHover={{ y: -2, scale: 1.01, boxShadow: "0 10px 24px rgba(15,23,42,0.12)" }}
              whileTap={{ scale: 0.98 }}
              transition={buttonSpring}
              onClick={() => navigate({ to: "/admin/login" })}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 ease-in-out hover:border-slate-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300/50"
              aria-label="Admin login"
            >
              <Shield className="h-4 w-4" />
              Admin
            </motion.button>

            <motion.button
              whileHover={{ y: -2, scale: 1.01, boxShadow: "0 20px 60px rgba(11,94,120,0.18)" }}
              whileTap={{ scale: 0.98 }}
              transition={buttonSpring}
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0B5E78] via-[#0F7A96] to-[#0D82A3] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-24px_rgba(11,94,120,0.75)] transition duration-200 ease-out hover:shadow-[0_22px_50px_-28px_rgba(11,94,120,0.42)] focus:outline-none focus:ring-2 focus:ring-[#0B5E78]/60"
              aria-label="Student login"
            >
              Student Login
              <motion.span
                className="inline-flex"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </motion.button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm transition duration-300 hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              ref={menuPanelRef}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
              className="lg:hidden"
              style={{ transformOrigin: "top" }}
            >
              <div className="mx-auto max-w-6xl px-4 pb-5 pt-4 sm:px-6">
                <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-5 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-2">
                            {navItems.map((item) => (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition duration-300 hover:bg-slate-50 hover:text-slate-950"
                        variants={navItemVariants}
                      >
                        {item.label}
                      </motion.a>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/70 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={buttonSpring}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate({ to: "/admin/login" });
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:border-slate-400 hover:bg-slate-50"
                    >
                      <Shield className="h-4 w-4" /> Admin
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 16px 40px rgba(11,94,120,0.22)" }}
                      whileTap={{ scale: 0.97 }}
                      transition={buttonSpring}
                      onClick={() => {
                        setMenuOpen(false);
                        handleGetStarted();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B5E78] via-[#0F7A96] to-[#0D82A3] px-4 py-3 text-sm font-semibold text-white"
                    >
                      Student Login
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>

      <main className="flex-1 pt-[104px]">
        <section className="relative pt-8 pb-12 sm:pt-10 sm:pb-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.div variants={fadeUp} className="flex justify-center">
                  <div className="inline-flex rounded-full border border-white/90 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-[#0B5E78] shadow-[0_10px_30px_-18px_rgba(15,23,42,0.15)]">
                    Trusted by SVGA students
                  </div>
                </motion.div>
                <motion.h1 variants={fadeUp} className="mt-6 max-w-[700px] text-center text-[36px] font-extrabold tracking-[-0.03em] leading-[0.96] text-[#0F172A] sm:text-[46px] md:text-[52px] lg:text-[64px] xl:text-[72px]">
                  <span className="inline-flex items-center justify-center gap-3">
                    <img src={getLogoSrc("default")} alt="SVGA logo" className="h-20 w-auto shrink-0 sm:h-22 md:h-24" />
                    <span className="flex flex-col items-start text-left leading-none">
                      <span className="block font-display text-[#0C2340]">SVGA</span>
                      <span className="block bg-gradient-to-r from-[#07738F] via-[#0B86A7] to-[#0B9BCB] bg-clip-text text-transparent">Book Bank</span>
                    </span>
                  </span>
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-3 max-w-[700px] text-center text-[16px] leading-[1.7] text-[#334155] sm:text-[18px] lg:text-[22px] mx-auto">
                  Get free books for your studies — register, pay a refundable ₹500 deposit, and take home any books you want.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    size="lg"
                    className="inline-flex items-center justify-center gap-2 bg-[#0B5E78] text-white shadow-[0_16px_40px_-24px_rgba(11,94,120,0.8)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-24px_rgba(11,94,120,0.5)]"
                    onClick={handleGetStarted}
                  >
                    {isAuthenticated && membershipPaid ? "Go to dashboard" : "Get started"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#0B5E78] text-[#0B5E78] shadow-sm shadow-[#0B5E78]/10 transition duration-200 ease-in-out hover:border-[#0B7FA4] hover:bg-[#E8F8FB]"
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Explore features
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.75rem] border border-[#D7EFF6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,94,120,0.16)]">
                    <p className="text-3xl font-display font-semibold">2,000+</p>
                    <p className="mt-2 text-sm text-[#4f6b78]">Books available across streams</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-[#D7EFF6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,94,120,0.16)]">
                    <p className="text-3xl font-display font-semibold">₹500</p>
                    <p className="mt-2 text-sm text-[#4f6b78]">Fully refundable deposit</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-[#D7EFF6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,94,120,0.16)]">
                    <p className="text-3xl font-display font-semibold">3 books</p>
                    <p className="mt-2 text-sm text-[#4f6b78]">Borrow per membership</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                  className="rounded-[2.5rem] border border-white/80 bg-white p-8 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.2)]"
                >
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#0B5E78]">Dashboard preview</p>
                      <h2 className="mt-3 text-2xl font-semibold text-[#0C2340]">Books reserved. Status tracked.</h2>
                    </div>
                    <div className="rounded-3xl bg-[#E8F4F8] p-3 shadow-sm">
                      <BookOpen className="h-5 w-5 text-[#0B5E78]" />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-[2rem] bg-white p-6 border border-[#E8EDF5] shadow-sm">
                      <p className="text-sm font-semibold text-[#0c2340]">Reserve instantly</p>
                      <p className="mt-2 text-sm text-[#4f6b78] leading-relaxed">Find books by stream, author, or category without any wait.</p>
                    </div>
                    <div className="rounded-[2rem] bg-white p-6 border border-[#E8EDF5] shadow-sm">
                      <p className="text-sm font-semibold text-[#0c2340]">Deposit protection</p>
                      <p className="mt-2 text-sm text-[#4f6b78] leading-relaxed">Fully refundable after every return, with clear status updates.</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="sponsors" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mx-auto max-w-2xl mb-12">
              <span className="inline-flex rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#0B5E78]">
                Trusted by our future partners
              </span>
              <h2 className="mt-6 text-3xl md:text-4xl font-display font-bold text-slate-950">
                Our Generous Sponsors
              </h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.1)]">
              <div className="marquee-wrapper overflow-hidden">
                <div className="marquee-track flex items-center gap-8">
                  {[...sponsors, ...sponsors].map((sponsor, index) => (
                    <SponsorCard key={`${sponsor.alt}-${index}`} src={sponsor.src} alt={sponsor.alt} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mx-auto max-w-2xl mb-14">
              <span className="inline-flex rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#0B5E78]">
                Why SVGA Book Bank
              </span>
              <h2 className="mt-6 text-3xl md:text-4xl font-display font-bold">Smooth membership, stronger support.</h2>
              <p className="mt-4 text-base text-[#1f4255]/75">Everything from registration to refund is designed around student convenience and confidence.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer} className="grid gap-6 md:grid-cols-3">
              <motion.div variants={fadeUp} className="rounded-[2rem] bg-white p-8 border border-[#D7EFF6] shadow-subtle">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-50 text-[#0B5E78]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Stream-aligned collections</h3>
                <p className="mt-3 text-sm text-[#4f6b78] leading-relaxed">From FYJC to engineering, discover books selected for your stream.</p>
              </motion.div>
              <motion.div variants={fadeUp} className="rounded-[2rem] bg-white p-8 border border-[#D7EFF6] shadow-subtle">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-50 text-[#0B5E78]">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Fast, modern search</h3>
                <p className="mt-3 text-sm text-[#4f6b78] leading-relaxed">Reserve textbooks quickly using smart search and effortless filtering.</p>
              </motion.div>
              <motion.div variants={fadeUp} className="rounded-[2rem] bg-white p-8 border border-[#D7EFF6] shadow-subtle">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-50 text-[#0B5E78]">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Secure refundable deposit</h3>
                <p className="mt-3 text-sm text-[#4f6b78] leading-relaxed">Know exactly when your refund is due, with trusted record keeping.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">How It Works</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                A simple, transparent four-step process to get your study materials without any hassle.
              </p>
            </motion.div>

            <div className="relative overflow-hidden rounded-[36px] border border-white/60 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.12)] sm:p-10">
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="absolute left-0 top-1/2 hidden h-0.5 w-full origin-left bg-gradient-to-r from-[#0B5E78] via-[#0F7A96] to-[#0D82A3] md:block"
              />
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="absolute left-10 top-0 block h-full w-0.5 origin-top bg-gradient-to-b from-[#0B5E78] via-[#0F7A96] to-[#0D82A3] md:hidden"
              />

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="grid gap-8 md:grid-cols-4">
                {timelineSteps.map((step) => (
                  <motion.div key={step.number} variants={fadeUp} className="relative">
                    <TimelineStep number={step.number} title={step.title} description={step.description} Icon={step.icon} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section id="feedback" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mx-auto max-w-2xl mb-12">
              <span className="inline-flex rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0B5E78]">
                Hear from students who trusted SVGA.
              </span>
              <h2 className="mt-6 text-3xl md:text-4xl font-display font-bold text-slate-950">Hear from students who trusted SVGA.</h2>
              <p className="mt-4 text-base text-[#475569]">Real results from students who borrowed books, saved money and returned on time.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer} className="grid gap-6 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} {...testimonial} />
              ))}
            </motion.div>
          </div>
        </section>

        <section id="location" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">Visit Our Book Bank</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Find us easily. Drop by to register, pick up your books, or return them at your convenience.
              </p>
            </motion.div>

            <div className="grid gap-10 md:grid-cols-[0.48fr_0.52fr] lg:grid-cols-[0.46fr_0.54fr] items-start">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.12)] transition duration-300 hover:shadow-[0_35px_100px_-40px_rgba(15,23,42,0.18)] h-[640px] md:h-[700px] lg:h-[760px]"
              >
                <div className="absolute inset-0 overflow-hidden rounded-[24px] transition duration-300 group-hover:scale-[1.01]">
                  <iframe
                    title="SVGA Book Bank location"
                    src="https://www.google.com/maps?q=Shree+Vagad+Graduates+Association+%28SVGA%29+M+Square+Park+Plaza+Dadar+West+Mumbai+400028&output=embed"
                    className="absolute inset-0 h-full w-full border-none"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-start"
              >
                <LocationCard />
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <BrandingFooter />
    </div>
  );
}
