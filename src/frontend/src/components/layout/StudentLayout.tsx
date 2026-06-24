import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
  Bell,
} from "lucide-react";
import { useGetMyNotifications, useMarkNotificationRead } from "@/hooks/useBackend";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BrandingFooter, SVGALogo } from "./AppLayout";

const BOOKS_DEFAULT_SEARCH = {
  author: "All",
  edition: "All",
  category: "All",
  sort: "title-asc",
} as const;

const navItems = [
  {
    label: "Dashboard",
    path: "/student/dashboard" as const,
    icon: LayoutDashboard,
  },
  { label: "Browse Books", path: "/student/books" as const, icon: BookOpen },
  {
    label: "My Requests",
    path: "/student/requests" as const,
    icon: ClipboardList,
  },
  { label: "Account", path: "/student/account" as const, icon: User },
];

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: notifications } = useGetMyNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — deep blue navbar */}
      <header className="navbar-bg border-b border-white/10 shadow-subtle sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="hover:opacity-85 transition-smooth">
              <SVGALogo size="sm" variant="navbar" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Link
                      to={item.path}
                      search={
                        item.path === "/student/books"
                          ? BOOKS_DEFAULT_SEARCH
                          : undefined
                      }
                      data-ocid={`student.nav.${item.label.toLowerCase().replace(/ /g, "_")}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-smooth ${
                        isActive
                          ? "bg-white/20 text-white font-medium"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => setDrawerOpen((v) => !v)}
                  aria-label="Notifications"
                  data-ocid="student.notifications_button"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-white text-[10px] font-medium">{unreadCount}</span>
                )}
              </div>
              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                data-ocid="student.mobile_menu_toggle"
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-9 px-2 text-white/80 hover:text-white hover:bg-white/10 transition-smooth"
                    data-ocid="student.user_menu"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-white/30">
                      <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "S"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                      {user?.name ?? "Student"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                    data-ocid="student.logout_button"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              key="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden border-t border-white/10 navbar-bg overflow-hidden"
              data-ocid="student.mobile_nav"
            >
              <div className="px-4 py-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      search={
                        item.path === "/student/books"
                          ? BOOKS_DEFAULT_SEARCH
                          : undefined
                      }
                      data-ocid={`student.mobile_nav.${item.label.toLowerCase().replace(/ /g, "_")}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-smooth ${
                        isActive
                          ? "bg-white/20 text-white font-medium"
                          : "text-white/75 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

        {/* Notification drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <div className="fixed inset-0 z-50 pointer-events-auto">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-elevated p-4 overflow-auto"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Notifications</h3>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  {(notifications ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  ) : (
                    (notifications ?? []).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-md border ${n.isRead ? 'bg-card' : 'bg-secondary/30 border-border'} cursor-pointer`}
                        onClick={async () => {
                          try {
                            if (!n.isRead) await markRead.mutateAsync(n.id);
                          } catch {}
                          setDrawerOpen(false);
                          try {
                            if (n.actionUrl) {
                              if (n.actionUrl.startsWith('http')) {
                                window.location.href = n.actionUrl;
                              } else {
                                navigate({ to: n.actionUrl });
                              }
                            } else {
                              navigate({ to: '/student/requests' });
                            }
                          } catch (e) {
                            // swallow navigation errors
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{n.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                            <div className="text-[11px] text-muted-foreground mt-2">{new Date(n.timestamp).toLocaleString()}</div>
                          </div>
                          {!n.isRead && (
                            <button
                              type="button"
                              onClick={async (ev) => {
                                ev.stopPropagation();
                                try {
                                  await markRead.mutateAsync(n.id);
                                } catch {}
                              }}
                              className="ml-2 text-xs text-primary"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BrandingFooter />
    </div>
  );
}
