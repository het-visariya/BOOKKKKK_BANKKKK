import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminAuth, useAuth } from "@/hooks/useAuth";
import { useAdminPendingCount, useAllRequests } from "@/hooks/useBackend";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
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

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: pendingCount = 0 } = useAdminPendingCount();
  const { data: requests = [] } = useAllRequests();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const recentPending = [...requests]
    .filter((r) => r.status === "Pending")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
        data-ocid="admin.notification_bell"
      >
        <Bell className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4.5 w-4.5 min-w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-card border border-border shadow-xl z-50 overflow-hidden"
            data-ocid="admin.notification_dropdown"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">
                Pending Requests
              </span>
              {pendingCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-semibold">
                  {pendingCount} new
                </span>
              )}
            </div>

            {recentPending.length === 0 ? (
              <div
                className="px-4 py-8 text-center"
                data-ocid="admin.notification_dropdown.empty_state"
              >
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No pending requests
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-64">
                <div className="py-1">
                  {recentPending.map((req, i) => {
                    const totalBooks = req.requestedBooks?.length ?? 0;
                    return (
                      <button
                        key={req.requestId}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate({
                            to: "/admin/requests",
                            search: {
                              search: "",
                              status: "",
                              course: "",
                              dateFrom: "",
                              dateTo: "",
                            },
                          });
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                        data-ocid={`admin.notification_dropdown.item.${i + 1}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {req.studentName ?? "Student"}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {formatRelative(req.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {totalBooks} book{totalBooks !== 1 ? "s" : ""}{" "}
                          requested
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <div className="px-4 py-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate({
                    to: "/admin/requests",
                    search: {
                      search: "",
                      status: "",
                      course: "",
                      dateFrom: "",
                      dateTo: "",
                    },
                  });
                }}
                className="w-full text-xs text-primary font-semibold hover:underline py-1 text-center"
                data-ocid="admin.notification_dropdown.view_all"
              >
                View all requests →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      {/* Header — deep blue navbar matching SVGA website branding */}
      <header className="navbar-bg border-b border-white/10 shadow-subtle sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to="/"
                className="hover:opacity-85 transition-smooth shrink-0"
              >
                <SVGALogo size="sm" variant="navbar" />
              </Link>
              <Badge
                variant="secondary"
                className="text-xs font-semibold bg-white/15 text-white border-white/20 shrink-0"
              >
                Admin
              </Badge>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const isRequests = item.label === "Requests";
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-ocid={`admin.nav.${item.label.toLowerCase()}`}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body transition-smooth ${
                      isActive
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {isRequests && pendingCount > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notification bell */}
              <NotificationBell />

              {/* Username badge — hidden on small mobile */}
              <div className="hidden sm:flex items-center gap-2 bg-white/15 border border-white/20 rounded-lg px-2.5 py-1.5">
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white uppercase">
                    {adminUsername.charAt(0)}
                  </span>
                </div>
                <span className="text-xs font-medium text-white truncate max-w-[80px]">
                  {adminUsername}
                </span>
              </div>

              {/* Logout — visible on desktop */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 transition-smooth"
                data-ocid="admin.logout_button"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline text-sm">Sign out</span>
              </Button>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
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
        </div>
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
              className="fixed top-14 left-0 bottom-0 w-72 z-[35] navbar-bg border-r border-white/10 shadow-xl md:hidden flex flex-col"
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
          className="flex-1 overflow-x-hidden"
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
