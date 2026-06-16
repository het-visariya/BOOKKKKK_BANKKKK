import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { getStudentSession, useAdminAuth } from "@/hooks/useAuth";
import { LandingPage } from "@/pages/LandingPage";
import {
  Navigate,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { Suspense, lazy, useEffect } from "react";

// ─── Admin Auth Guard ───
function AdminRequireAuth({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const isAuth = isAdminAuthenticated();

  useEffect(() => {
    if (!isAuth) navigate({ to: "/admin/login" });
  }, [isAuth, navigate]);

  if (!isAuth) return null;
  return <>{children}</>;
}

// ─── Student Auth Guard ───
function StudentRequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  // Check localStorage synchronously — instant, no async wait
  const syncSession = getStudentSession();
  const syncToken = localStorage.getItem("svga_token");
  const hasSyncAuth = syncSession !== null || !!syncToken;

  // Determine if membership is paid:
  // - svga_student_session has user with membershipStatus
  // - if only svga_token exists (set after recordPayment), trust it
  // - temp_paid_ tokens are issued immediately after payment — treat as paid
  const syncUser = syncSession?.user;
  const isTempPaidToken = syncToken?.startsWith("temp_paid_") ?? false;
  const syncPaid =
    isTempPaidToken ||
    syncUser?.membershipStatus === "PAID" ||
    // @ts-ignore
    syncUser?.membershipStatus?.__kind__ === "PAID" ||
    (!!syncToken && !syncSession);

  useEffect(() => {
    if (!hasSyncAuth) {
      navigate({ to: "/student/login" });
    } else if (!syncPaid) {
      navigate({ to: "/student/register" });
    }
  }, [hasSyncAuth, syncPaid, navigate]);

  if (!hasSyncAuth) return null;
  if (!syncPaid) return null;
  return <>{children}</>;
}

// ─── Combined RequireAuth ───
function RequireAuth({
  children,
  adminOnly = false,
}: { children: React.ReactNode; adminOnly?: boolean }) {
  if (adminOnly) return <AdminRequireAuth>{children}</AdminRequireAuth>;
  return <StudentRequireAuth>{children}</StudentRequireAuth>;
}

// ─── Lazy page imports ───
const StudentQrPage = lazy(() =>
  import("@/pages/StudentQrPage").then((m) => ({
    default: m.StudentQrPage,
  })),
);

const ForgotPassword = lazy(() =>
  import("@/pages/student/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);

const StudentProfilePage = lazy(() =>
  import("@/pages/student/StudentProfilePage").then((m) => ({
    default: m.StudentProfilePage,
  })),
);

const StudentLogin = lazy(() =>
  import("@/pages/student/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const AdminLogin = lazy(() =>
  import("@/pages/admin/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const StudentRegister = lazy(() =>
  import("@/pages/student/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const StudentDashboard = lazy(() =>
  import("@/pages/student/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const StudentBooks = lazy(() =>
  import("@/pages/student/BooksPage").then((m) => ({ default: m.BooksPage })),
);
const StudentRequests = lazy(() =>
  import("@/pages/student/RequestsPage").then((m) => ({
    default: m.RequestsPage,
  })),
);
const StudentAccount = lazy(() =>
  import("@/pages/student/AccountPage").then((m) => ({
    default: m.AccountPage,
  })),
);
const StudentChallan = lazy(() =>
  import("@/pages/student/ChallanPage").then((m) => ({
    default: m.ChallanPage,
  })),
);
const CollectionOrderPage = lazy(() =>
  import("@/pages/student/ChallanPage").then((m) => ({
    default: m.ChallanPage,
  })),
);
// PaymentSuccessPage removed — RegisterPage navigates directly to /student/dashboard

const AdminDashboard = lazy(() =>
  import("@/pages/admin/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const AdminRequests = lazy(() =>
  import("@/pages/admin/RequestsPage").then((m) => ({
    default: m.default,
  })),
);
const AdminInventory = lazy(() =>
  import("@/pages/admin/InventoryPage").then((m) => ({
    default: m.InventoryPage,
  })),
);
const AdminStudents = lazy(() =>
  import("@/pages/admin/StudentsPage").then((m) => ({
    default: m.StudentsPage,
  })),
);
const AdminSettings = lazy(() =>
  import("@/pages/admin/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const AuditLogPage = lazy(() =>
  import("@/pages/admin/AuditLogPage").then((m) => ({
    default: m.default,
  })),
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// ─── Routes ───
const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <LandingPage />,
});

const studentLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/login",
  component: () => (
    <SuspenseWrapper>
      <StudentLogin />
    </SuspenseWrapper>
  ),
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: () => (
    <SuspenseWrapper>
      <AdminLogin />
    </SuspenseWrapper>
  ),
});

const studentRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/register",
  component: () => (
    <SuspenseWrapper>
      <StudentRegister />
    </SuspenseWrapper>
  ),
});

const studentDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/dashboard",
  component: () => (
    <RequireAuth>
      <SuspenseWrapper>
        <StudentDashboard />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const studentBooksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/books",
  validateSearch: (search: Record<string, unknown>) => ({
    author: typeof search.author === "string" ? search.author : "All",
    edition: typeof search.edition === "string" ? search.edition : "All",
    category: typeof search.category === "string" ? search.category : "All",
    sort: typeof search.sort === "string" ? search.sort : "title-asc",
  }),
  component: () => (
    <RequireAuth>
      <SuspenseWrapper>
        <StudentBooks />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const studentRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/requests",
  component: () => (
    <RequireAuth>
      <SuspenseWrapper>
        <StudentRequests />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const studentAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/account",
  component: () => (
    <RequireAuth>
      <SuspenseWrapper>
        <StudentAccount />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

// paymentSuccessRoute removed — direct navigation to /student/dashboard instead

const studentChallanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/challan/$requestId",
  component: () => (
    <RequireAuth>
      <SuspenseWrapper>
        <StudentChallan />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

// Public route: QR scan for collection order — no auth required
const collectionOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/collection-order/$orderNumber",
  component: () => (
    <SuspenseWrapper>
      <CollectionOrderPage />
    </SuspenseWrapper>
  ),
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: () => (
    <RequireAuth adminOnly>
      <SuspenseWrapper>
        <AdminDashboard />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const adminRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/requests",
  validateSearch: (search: Record<string, unknown>) => ({
    search: typeof search.search === "string" ? search.search : "",
    status: typeof search.status === "string" ? search.status : "All",
    course: typeof search.course === "string" ? search.course : "All",
    dateFrom: typeof search.dateFrom === "string" ? search.dateFrom : "",
    dateTo: typeof search.dateTo === "string" ? search.dateTo : "",
  }),
  component: () => (
    <RequireAuth adminOnly>
      <SuspenseWrapper>
        <AdminRequests />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const adminInventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/inventory",
  validateSearch: (search: Record<string, unknown>) => ({
    search: typeof search.search === "string" ? search.search : "",
    category: typeof search.category === "string" ? search.category : "All",
    availability:
      typeof search.availability === "string" ? search.availability : "All",
    edition: typeof search.edition === "string" ? search.edition : "All",
    sort: typeof search.sort === "string" ? search.sort : "title-asc",
  }),
  component: () => (
    <RequireAuth adminOnly>
      <SuspenseWrapper>
        <AdminInventory />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const adminStudentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/students",
  validateSearch: (search: Record<string, unknown>) => ({
    search: typeof search.search === "string" ? search.search : "",
    course: typeof search.course === "string" ? search.course : "All",
    membership:
      typeof search.membership === "string" ? search.membership : "All",
  }),
  component: () => (
    <RequireAuth adminOnly>
      <SuspenseWrapper>
        <AdminStudents />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/settings",
  component: () => (
    <RequireAuth adminOnly>
      <SuspenseWrapper>
        <AdminSettings />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const auditLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/audit-log",
  component: () => (
    <RequireAuth adminOnly>
      <SuspenseWrapper>
        <AuditLogPage />
      </SuspenseWrapper>
    </RequireAuth>
  ),
});

const adminRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => <Navigate to="/admin/login" />,
});

const studentQrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/qr/$userId",
  component: () => (
    <SuspenseWrapper>
      <StudentQrPage />
    </SuspenseWrapper>
  ),
});

const _forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/forgot-password",
  component: () => (
    <SuspenseWrapper>
      <ForgotPassword />
    </SuspenseWrapper>
  ),
});

// Public route: QR scan profile view — no auth required
const studentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/student/profile/$userId",
  component: () => (
    <SuspenseWrapper>
      <StudentProfilePage />
    </SuspenseWrapper>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  studentLoginRoute,
  adminLoginRoute,
  adminRedirectRoute,
  studentRegisterRoute,
  studentDashboardRoute,
  studentBooksRoute,
  studentRequestsRoute,
  studentAccountRoute,
  studentChallanRoute,
  collectionOrderRoute,
  studentProfileRoute,
  _forgotPasswordRoute,
  studentQrRoute,
  adminDashboardRoute,
  adminRequestsRoute,
  adminInventoryRoute,
  adminStudentsRoute,
  auditLogRoute,
  adminSettingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
