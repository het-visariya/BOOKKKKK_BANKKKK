import { Button } from "@/components/ui/button";
import { useAdminAuth, useAuth } from "@/hooks/useAuth";
import { useAdminPendingCount } from "@/hooks/useBackend";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BrandingFooter, SVGALogo } from "./AppLayout";

const navItems = [
  { label: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Requests", path: "/admin/requests", icon: ClipboardList },
  { label: "Inventory", path: "/admin/inventory", icon: BookOpen },
  { label: "Students", path: "/admin/students", icon: Users },
  { label: "Audit Log", path: "/admin/audit-log", icon: ClipboardList },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { adminLogout, getAdminUsername } = useAdminAuth();
  const adminUsername = getAdminUsername();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: pendingCount = 0 } = useAdminPendingCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    adminLogout();
    toast.success("Logged out successfully");
    navigate({ to: "/", replace: true });
  };

  // Close mobile menu on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: location.pathname is the value we depend on
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <header className="fixed inset-x-[1%] top-6 z-50 mx-auto w-[98%] max-w-[1900px]">
        <motion.div
          className="glass-navbar rounded-[32px] border border-white/12 shadow-[0_8px_30px_rgba(44,62,145,0.18)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div style={{ flexBasis: "18%", minWidth: 160 }} className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-full bg-white/5 px-3 py-2 transition-all duration-200 hover:bg-white/15"
              >
                <SVGALogo size="sm" variant="navbar" />
                <span className="text-sm font-semibold tracking-tight text-white">
                  Admin
                </span>
              </Link>
            </div>

            <nav style={{ flex: "1 1 57%", minWidth: 0 }} className="hidden md:flex items-center justify-center">
              <div className="flex flex-1 items-center justify-evenly gap-6 md:gap-5 min-w-0 px-3">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const isRequests = item.label === "Requests";
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-ocid={`admin.nav.${item.label.toLowerCase()}`}
                      className={`nav-item flex items-center gap-2 whitespace-nowrap transition-all duration-200 ease-out text-sm ${
                        isActive
                          ? "bg-white/18 border border-white/25 text-white shadow-[0_6px_18px_rgba(255,255,255,0.08)] px-4 py-2 rounded-full font-medium"
                          : "text-slate-200 hover:text-white hover:bg-white/6 px-3 py-2 rounded-full"
                      }`}
                    >
                      <item.icon className="h-5 w-5 text-current shrink-0" />
                      <span className="leading-none">{item.label}</span>
                      {isRequests && pendingCount > 0 && (
                        <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] rounded-full bg-blue-600 text-white text-[11px] font-semibold shadow-sm ml-1">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div style={{ flexBasis: "25%", minWidth: 220 }} className="flex items-center gap-3 justify-end">
              <div className="hidden sm:flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white/15 profile-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                  {adminUsername.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate max-w-[140px]">
                    {adminUsername}
                  </p>
                  <p className="text-xs text-white/70">Administrator</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:bg-white/20"
                data-ocid="admin.logout_button"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign out</span>
              </Button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-sm transition-all duration-200 hover:bg-white/20"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                data-ocid="admin.mobile_menu_toggle"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="mobile-nav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Slide-in drawer */}
            <motion.div
              key="mobile-nav-drawer"
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              className="fixed top-24 left-4 right-4 z-[35] rounded-[24px] border border-slate-200/60 bg-white/95 shadow-2xl md:hidden flex flex-col"
              data-ocid="admin.mobile_nav_drawer"
            >
              {/* User info */}
              <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white uppercase">
                    {adminUsername.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {adminUsername}
                  </p>
                  <p className="text-xs text-white/60">Administrator</p>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const isRequests = item.label === "Requests";
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-ocid={`admin.mobile_nav.${item.label.toLowerCase()}`}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-body transition-colors ${
                        isActive
                          ? "bg-white/20 text-white font-medium"
                          : "text-white/75 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isRequests && pendingCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 leading-none">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Sign out */}
              <div className="px-3 pb-6 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                  data-ocid="admin.mobile_logout_button"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1 overflow-x-hidden pt-32"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BrandingFooter />
    </div>
  );
}
