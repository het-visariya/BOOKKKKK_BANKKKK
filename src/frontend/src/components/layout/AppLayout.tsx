export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">{children}</div>
  );
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
        src="/assets/svga-logo.png"
        alt="SVGA Logo"
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
