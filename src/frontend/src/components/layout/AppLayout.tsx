import { motion } from "motion/react";
import { useEffect, useRef } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!rootRef.current) return;
        const offset = Math.min(window.scrollY / 1200, 0.7);
        rootRef.current.style.setProperty("--scroll-offset", offset.toString());
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-hidden text-[#0c2340] [--scroll-offset:0]"
      style={{
        background: "linear-gradient(180deg,#0A2A66_0%,#174EA6_14%,#2B7FFF_38%,#74C7FF_65%,#DDF6FF_90%,#FFFFFF_100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#0A2A66]/95 to-transparent"
        style={{ transform: "translate3d(0, calc(var(--scroll-offset)*-24px), 0)" }}
      />

      <motion.div
        className="pointer-events-none absolute left-[-15%] top-8 h-[520px] w-[520px] rounded-full bg-[#174EA6]/20 blur-[150px]"
        animate={{ x: [0, -20, 0], y: [0, 16, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
      />

      <motion.div
        className="pointer-events-none absolute left-[35%] top-12 h-[460px] w-[460px] rounded-full bg-[#2B7FFF]/18 blur-[150px]"
        animate={{ x: [0, 20, 0], y: [0, 14, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
      />

      <motion.div
        className="pointer-events-none absolute right-[-12%] top-20 h-[500px] w-[500px] rounded-full bg-[#74C7FF]/18 blur-[150px]"
        animate={{ x: [0, -16, 0], y: [0, 18, 0] }}
        transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
      />

      <motion.div
        className="pointer-events-none absolute left-[10%] top-[42%] h-[520px] w-[520px] rounded-full bg-[#DDF6FF]/45 blur-[170px]"
        animate={{ x: [0, 16, 0], y: [0, -16, 0] }}
        transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
      />

      <motion.div
        className="pointer-events-none absolute right-[8%] top-[55%] h-[380px] w-[380px] rounded-full bg-[#FFFFFF]/35 blur-[160px]"
        animate={{ x: [0, -12, 0], y: [0, 12, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
      />

      <div className="relative flex min-h-screen flex-col">{children}</div>
    </div>
  );
}

export const LOGO_SRC = "/assets/svga-logo.png";
export const LOGO_SRC_WHITE = "/assets/svga-logo-white.png";

export function getLogoSrc(variant: "default" | "navbar" = "default") {
  return variant === "navbar" ? LOGO_SRC_WHITE : LOGO_SRC;
}

/** SVGA Logo — transparent PNG, no circular cropping, deep blue navbar aware */
export function SVGALogo({
  size = "md",
  variant = "default",
}: { size?: "sm" | "md" | "lg" | "xl"; variant?: "default" | "navbar" }) {
  const imgSizes: Record<string, string> = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-14 w-auto",
    xl: "h-20 w-auto",
  };
  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };
  const subSizes = {
    sm: "text-[9px]",
    md: "text-[11px]",
    lg: "text-xs",
    xl: "text-xs",
  };
  const isNavbar = variant === "navbar";
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={getLogoSrc(isNavbar ? "navbar" : "default")}
        alt="SVGA Book Bank"
        className={`${imgSizes[size]} object-contain shrink-0`}
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${
            textSizes[size]
          } font-display font-bold tracking-tight ${
            isNavbar ? "text-white" : "text-foreground"
          }`}
        >
          SVGA
        </span>
        <span
          className={`${subSizes[size]} font-body ${
            isNavbar ? "text-white/70" : "text-muted-foreground"
          }`}
        >
          Book Bank
        </span>
      </div>
    </div>
  );
}

export function BrandingFooter() {
  return (
    <footer className="bg-background border-t border-[#B8E0E8] py-5 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <SVGALogo size="sm" />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SVGA Book Bank. All rights reserved.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Made by{" "}
          <span className="font-medium text-foreground">Devansh Nisar</span>
        </p>
      </div>
    </footer>
  );
}
