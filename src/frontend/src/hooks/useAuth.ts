import type { UserPublic } from "@/backend";
import { useAnonActor } from "@/hooks/useAnonActor";
import type { User } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Storage keys ─────────────────────────────────────────────────────────────
export const TOKEN_KEY = "svga_token";
export const USER_KEY = "svga_user";
export const ADMIN_SESSION_KEY = "svga_admin_session";
export const STUDENT_SESSION_KEY = "svga_student_session";

// ─── Type mapping helpers ─────────────────────────────────────────────────────

/** Convert Motoko UserPublic → frontend User */
export function userPublicToUser(u: UserPublic): User {
  const membershipStr =
    typeof u.membershipStatus === "string"
      ? u.membershipStatus
      : ((u.membershipStatus as { __kind__?: string })?.__kind__ ??
        String(u.membershipStatus));
  return {
    _id: u.studentId,
    name: u.name,
    firstName: u.firstName || undefined,
    middleName: u.middleName || undefined,
    grandFatherName: u.grandFatherName || undefined,
    surname: u.surname || undefined,
    academicYear: u.academicYear || undefined,
    email: (u as unknown as { email?: string }).email ?? "",
    frozenAadhaar: u.frozenAadhaar,
    frozenPhone: u.frozenPhone,
    aadhaarNumber: u.aadhaarNumber ?? "",
    phone: u.phone ?? "",
    course: u.course,
    college: u.college,
    studentId: u.studentId,
    membershipStatus: membershipStr === "PAID" ? "PAID" : "NOT_PAID",
    paymentStatus:
      (u.paymentStatus as "SUCCESS" | "PENDING" | "FAILED") ?? "PENDING",
    profileCompleted: (u as unknown as { profileCompleted?: boolean }).profileCompleted ?? false,
    photoUploaded: (u as unknown as { photoUploaded?: boolean }).photoUploaded ?? false,
    role: "student",
    profilePhoto: u.profileImageUrl || undefined,
    profileImageUrl: u.profileImageUrl || undefined,
    issuedBooks: (u.issuedBooksInfo ?? []).map((b) => ({
      bookId: b.requestId,
      bookTitle: b.bookTitle,
      bookAuthor: "",
      issueDate: b.issueDate
        ? new Date(Number(b.issueDate) / 1_000_000).toISOString()
        : "",
      returnDate: b.returnDate
        ? new Date(Number(b.returnDate) / 1_000_000).toISOString()
        : "",
      returned: b.returned,
    })),
    issuedBooksInfo: (u.issuedBooksInfo ?? []).map((b) => ({
      requestId: b.requestId,
      bookTitle: b.bookTitle,
      bookAuthor: "",
      issueDate: b.issueDate
        ? new Date(Number(b.issueDate) / 1_000_000).toISOString()
        : undefined,
      returnDate: b.returnDate
        ? new Date(Number(b.returnDate) / 1_000_000).toISOString()
        : undefined,
      returned: b.returned,
    })),
    createdAt: new Date(Number(u.createdAt) / 1_000_000).toISOString(),
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Aadhaar session stored under STUDENT_SESSION_KEY for route guard compat
  const session = {
    token,
    userId: user._id,
    aadhaarNumber: user.aadhaarNumber ?? "",
    email: user.email ?? "",
    name: user.name,
    phone: user.phone ?? "",
    course: user.course ?? "",
    membershipStatus: user.membershipStatus,
    user,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
}

/** Store session from Aadhaar+OTP login result */
export function setAadhaarSession(token: string, user: User): void {
  storeSession(token, user);
}

/** Flag set during registration flow to prevent premature session clearing */
const REGISTRATION_IN_PROGRESS_KEY = "svga_registration_in_progress";

export function setRegistrationInProgress(value: boolean): void {
  if (value) {
    sessionStorage.setItem(REGISTRATION_IN_PROGRESS_KEY, "1");
  } else {
    sessionStorage.removeItem(REGISTRATION_IN_PROGRESS_KEY);
  }
}

export function isRegistrationInProgress(): boolean {
  return sessionStorage.getItem(REGISTRATION_IN_PROGRESS_KEY) === "1";
}

export function clearSession(): void {
  // Do not clear session if registration is in progress
  if (isRegistrationInProgress()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(STUDENT_SESSION_KEY);
  localStorage.removeItem("svga_membership_paid");
  sessionStorage.removeItem("svga_registration_complete");
}

/** Force-clear session regardless of registration state */
export function forceClearSession(): void {
  sessionStorage.removeItem(REGISTRATION_IN_PROGRESS_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(STUDENT_SESSION_KEY);
  localStorage.removeItem("svga_membership_paid");
  sessionStorage.removeItem("svga_registration_complete");
}

/** Synchronous getter for legacy code (RequireAuth guard etc.) */
export function getStudentSession(): {
  token: string;
  userId: string;
  user: User;
  expiresAt: number;
} | null {
  try {
    const raw = localStorage.getItem(STUDENT_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as {
      token: string;
      userId: string;
      user: User;
      expiresAt: number;
    };
    if (Date.now() > s.expiresAt) {
      clearSession();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

// ─── Student auth hook ────────────────────────────────────────────────────────

export function useStudentAuth() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const verifiedRef = useRef(false);
  const { actor, isFetching } = useAnonActor();

  // Timeout fallback: if actor never initializes in 8s, unblock loading
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // On mount: immediately use stored session, then verify in background
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    // Always trust stored session immediately — never block UI on canister
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setIsLoading(false);
    } else if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // Background verification — only if actor is ready
    if (isFetching) return;
    if (!actor) return; // actor unavailable — keep stored session as-is
    if (verifiedRef.current) return;

    // Skip backend verification for temp tokens (post-payment, before backend registers)
    // Temp tokens start with "temp_paid_" and are replaced by the background signup flow
    if (storedToken?.startsWith("temp_paid_")) return;

    verifiedRef.current = true;

    // Non-blocking background verify
    actor
      .verifyStudentToken(storedToken!)
      .then((userPublic) => {
        if (userPublic) {
          const u = userPublicToUser(userPublic);
          setUser(u);
          setToken(storedToken!);
          storeSession(storedToken!, u);
        } else {
          // Backend explicitly says token invalid — but skip clearing temp tokens
          const currentToken = getStoredToken();
          if (currentToken?.startsWith("temp_paid_")) return;
          clearSession();
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        // Network error — keep stored session intact, never clear on failure
      });
  }, [actor, isFetching]);

  /**
   * loginWithSession — called after Aadhaar+OTP verification succeeds.
   * Stores the session and updates React state immediately.
   */
  const loginWithSession = useCallback((token: string, user: User): void => {
    storeSession(token, user);
    setToken(token);
    setUser(user);
    setIsLoading(false);
  }, []);

  /** Legacy email/password login stub — kept for backward compat */
  const login = useCallback(
    async (_email: string, _password: string): Promise<void> => {
      // Aadhaar+OTP is the only login method — this stub is kept for type compat
      throw new Error("Use Aadhaar+OTP login instead");
    },
    [],
  );

  const logout = useCallback((): void => {
    const t = getStoredToken();
    // Force-clear ignores registration-in-progress flag
    forceClearSession();
    setToken(null);
    setUser(null);
    if (actor && t) {
      actor.studentLogout(t).catch(() => {});
    }
  }, [actor]);

  const refreshUser = useCallback(async (): Promise<void> => {
    const t = getStoredToken();
    if (!t || !actor) return;
    try {
      const userPublic = await actor.verifyStudentToken(t);
      if (userPublic) {
        const u = userPublicToUser(userPublic);
        setUser(u);
        storeSession(t, u);
      }
    } catch {
      /* ignore */
    }
  }, [actor]);

  const refreshSession = useCallback((): void => {
    const u = getStoredUser();
    const t = getStoredToken();
    if (u) setUser(u);
    if (t) setToken(t);
  }, []);

  const isAuthenticated = !!token && !!user;
  const membershipPaid = user?.membershipStatus === "PAID";

  return {
    isAuthenticated,
    currentUser: user,
    userId: user?._id ?? null,
    token,
    login,
    loginWithSession,
    logout,
    refreshUser,
    refreshSession,
    isLoading,
    membershipPaid,
    session: user
      ? {
          token: token ?? "",
          userId: user._id,
          aadhaarNumber: user.aadhaarNumber ?? "",
          email: user.email ?? "",
          name: user.name,
          phone: user.phone ?? "",
          course: user.course ?? "",
          membershipStatus: user.membershipStatus,
          user,
          expiresAt: Date.now() + 1e9,
        }
      : null,
  };
}

// ─── setStudentSession (used in LoginPage / RegisterPage) ─────────────────────

export function setStudentSession(result: {
  token: string;
  user: User;
  userId?: string;
}): void {
  storeSession(result.token, result.user);
}

// ─── Legacy useAuth ────────────────────────────────────────────────────────────

export function useAuth() {
  const s = useStudentAuth();
  return {
    isAuthenticated: s.isAuthenticated,
    isLoading: s.isLoading,
    login: (_email?: string, _password?: string) => Promise.resolve(),
    loginWithSession: s.loginWithSession,
    logout: s.logout,
    loginStatus: s.isAuthenticated ? "success" : "anonymous",
    identity: null,
    currentUser: s.currentUser,
    membershipPaid: s.membershipPaid,
  };
}

export function useCurrentUser() {
  const { currentUser, isAuthenticated } = useStudentAuth();
  return {
    data: isAuthenticated ? currentUser : undefined,
    isLoading: false,
    isError: false,
  };
}

export function useIsAdmin() {
  return { data: false, isLoading: false };
}

export function useMembershipStatus() {
  const { currentUser, membershipPaid } = useStudentAuth();
  if (membershipPaid) return "PAID" as const;
  if (currentUser) return currentUser.membershipStatus;
  return null;
}

// ─── Admin session ────────────────────────────────────────────────────────────

export function useAdminAuth() {
  const getSession = useCallback((): {
    token: string;
    expiresAt: number;
    username?: string;
  } | null => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as {
        token: string;
        expiresAt: number;
        username?: string;
      };
    } catch {
      return null;
    }
  }, []);

  const isAdminAuthenticated = useCallback((): boolean => {
    const s = getSession();
    if (!s) return false;
    return Date.now() < s.expiresAt;
  }, [getSession]);

  const storeAdminSession = useCallback(
    (token: string, expiresAtMs: number | bigint, username?: string) => {
      const expiresAt =
        typeof expiresAtMs === "bigint"
          ? Number(expiresAtMs / BigInt(1_000_000))
          : expiresAtMs > 1e12
            ? expiresAtMs
            : Date.now() + 24 * 60 * 60 * 1000;
      const session = { token, expiresAt, username };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    },
    [],
  );

  const adminLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }, []);

  const getToken = useCallback((): string | null => {
    const s = getSession();
    if (!s) return null;
    if (Date.now() >= s.expiresAt) return null;
    return s.token ?? null;
  }, [getSession]);

  const getAdminUsername = useCallback((): string => {
    const s = getSession();
    return s?.username ?? "Admin";
  }, [getSession]);

  return {
    isAdminAuthenticated,
    storeAdminSession,
    adminLogout,
    getToken,
    getAdminUsername,
  };
}
