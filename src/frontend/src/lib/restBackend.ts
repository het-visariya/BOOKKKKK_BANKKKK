/**
 * REST adapter — drop-in replacement for the ICP canister Backend actor.
 * All methods match the shapes expected by useBackend.ts converters.
 */
import type { Backend } from "@/backend";

const DEFAULT_API_BASE = "https://bookkkkk-bankkkk.onrender.com";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  DEFAULT_API_BASE;


function ok<T>(value: T): { __kind__: "ok"; ok: T } {
  return { __kind__: "ok", ok: value };
}

function err(message: string): { __kind__: "err"; err: string } {
  return { __kind__: "err", err: message };
}

function toNs(value: string | Date | number | undefined | null): bigint {
  if (value == null) return BigInt(0);
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  return BigInt(ms) * BigInt(1_000_000);
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message || `Request failed (${res.status})`,
    );
  }
  return data;
}

function normalizeCourseToCategory(course: string | null | undefined) {
  if (!course) return null;
  const raw = String(course).trim().toLowerCase();
  const map: Record<string, string> = {
    fyjc: 'FYJC',
    'fyjc science': 'FYJC',
    syjc: 'SYJC',
    engineering: 'Engineering',
    commerce: 'Commerce',
    medical: 'Medical',
    general: 'General',
  };
  // Direct token match
  if (map[raw]) return map[raw];
  // Contains keyword
  for (const k of Object.keys(map)) {
    if (raw.includes(k)) return map[k];
  }
  return null;
}

function mongoBookToCanister(book: Record<string, unknown>) {
  const id = String(book._id ?? book.bookId ?? "");
  return {
    bookId: id,
    title: String(book.title ?? ""),
    author: String(book.author ?? ""),
    edition: String(book.edition ?? ""),
    publisher: String(book.publisher ?? ""),
    category: String(book.category ?? "General"),
    shelf: String(book.shelf ?? ""),
    subject: String(book.subject ?? ""),
    grade: String(book.grade ?? ""),
    subjectCode: String(book.subjectCode ?? ""),
    isbn: String(book.isbn ?? ""),
    quantity: BigInt(Number(book.quantity ?? 1)),
    availableCount: BigInt(
      Number(book.availableQuantity ?? book.availableCount ?? book.quantity ?? 1),
    ),
    createdAt: toNs(book.createdAt as string),
    isDeleted: false,
  };
}

function mongoUserToCanister(user: Record<string, unknown>) {
  const id = String(user._id ?? user.studentId ?? "");
  return {
    studentId: String(user.studentId ?? id),
    name: String(user.name ?? ""),
    firstName: String(user.firstName ?? ""),
    middleName: String(user.middleName ?? ""),
    grandFatherName: String(user.grandFatherName ?? ""),
    surname: String(user.surname ?? ""),
    academicYear: String(user.academicYear ?? ""),
    aadhaarNumber: String(user.aadhaarNumber ?? ""),
    phone: String(user.phone ?? ""),
    course: String(user.course ?? ""),
    college: String(user.college ?? ""),
    frozenAadhaar: Boolean(user.frozenAadhaar),
    frozenPhone: Boolean(user.frozenPhone),
    profileImageUrl: String(user.profilePhoto ?? user.profileImageUrl ?? ""),
    membershipStatus: String(user.membershipStatus ?? "NOT_PAID"),
    paymentStatus: String(user.paymentStatus ?? "PENDING"),
    createdAt: toNs(user.createdAt as string),
    issuedBooksInfo: Array.isArray(user.issuedBooks)
      ? user.issuedBooks.map((b: Record<string, unknown>, i: number) => ({
          requestId: String(b.bookId ?? `issued_${i}`),
          bookTitle: String(b.bookTitle ?? ""),
          issueDate: b.issueDate ? toNs(b.issueDate as string) : undefined,
          returnDate: b.returnDate ? toNs(b.returnDate as string) : undefined,
          returned: Boolean(b.returned),
        }))
      : [],
    email: String(user.email ?? ""),
  };
}

function mongoRequestToCanister(req: Record<string, unknown>) {
  const id = String(req._id ?? req.requestId ?? "");
  const userIdRaw = req.userId;
  const user =
    typeof userIdRaw === "object" && userIdRaw !== null
      ? (userIdRaw as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const userIdStr =
    typeof userIdRaw === "object" && userIdRaw !== null
      ? String((userIdRaw as { _id?: string })._id ?? "")
      : String(userIdRaw ?? "");
  const selectedIds = Array.isArray(req.selectedBookIds)
    ? req.selectedBookIds.map((b) =>
        typeof b === "object" && b ? String((b as { _id?: string })._id) : String(b),
      )
    : [];
  const selectedBooksRaw = Array.isArray(req.selectedBooks)
    ? (req.selectedBooks as Record<string, unknown>[])
    : [];
  const requestedBooksRaw = Array.isArray(req.requestedBooks)
    ? (req.requestedBooks as Record<string, unknown>[])
    : [];
  const selectedBooks = selectedBooksRaw.map((sb) => ({
    title: String(sb.title ?? ""),
    author: String(sb.author ?? ""),
    edition: String(sb.edition ?? ""),
    publisher: String(sb.publisher ?? ""),
    issueDate: String(sb.issueDate ?? ""),
    returnDate: String(sb.returnDate ?? ""),
    returned: Boolean(sb.returned),
  }));
  const requestedBooks = requestedBooksRaw.map((rb) => ({
    title: String(rb.title ?? ""),
    author: String(rb.author ?? ""),
    edition: String(rb.edition ?? ""),
    publisher: String(rb.publisher ?? ""),
    note: String(rb.note ?? ""),
    imageUrl: String(rb.imageUrl ?? ""),
    decision: String(rb.decision ?? ""),
  }));

  const bookDecisions: Record<string, unknown>[] = [];
  for (let i = 0; i < Math.max(selectedBooksRaw.length, selectedIds.length); i++) {
    const sb = selectedBooksRaw[i] || {};
    const inventoryId =
      typeof selectedIds[i] === "object" && selectedIds[i]
        ? String((selectedIds[i] as { _id?: string })._id ?? selectedIds[i])
        : String(selectedIds[i] ?? `book_${i}`);
    bookDecisions.push({
      bookId: inventoryId,
      bookName: String(sb.title ?? ""),
      bookNumber: String(i + 1),
      inventoryId,
      decision: String(sb.decision ?? "") || "Pending",
      reason: String(sb.reason ?? "") || null,
      expectedReturnDate: sb.returnDate
        ? toNs(String(sb.returnDate))
        : null,
      currentHolder: sb.currentHolder ?? null,
      procurementCreated: false,
      author: String(sb.author ?? ""),
      edition: String(sb.edition ?? ""),
      publisher: String(sb.publisher ?? ""),
    });
  }
  for (let j = 0; j < requestedBooksRaw.length; j++) {
    const rb = requestedBooksRaw[j] || {};
    bookDecisions.push({
      bookId: `manual_${j}`,
      bookName: String(rb.title ?? ""),
      bookNumber: String(selectedBooksRaw.length + j + 1),
      inventoryId: "",
      decision: String(rb.decision ?? "") || "Pending",
      reason: String(rb.note ?? rb.reason ?? "") || null,
      expectedReturnDate: null,
      currentHolder: null,
      procurementCreated: false,
      author: String(rb.author ?? ""),
      edition: String(rb.edition ?? ""),
      publisher: String(rb.publisher ?? ""),
    });
  }
  const specialRequests = requestedBooksRaw.map((rb) => ({
    status: String(rb.decision ?? "Pending"),
    title: String(rb.title ?? ""),
    author: String(rb.author ?? ""),
    edition: String(rb.edition ?? ""),
    publisher: String(rb.publisher ?? ""),
    procurementId: null,
    expectedAvailabilityDate: null,
    reason: rb.note ? String(rb.note) : undefined,
  }));

  return {
    requestId: id,
    userId: userIdStr || String(user._id ?? ""),
    studentName: String(req.studentName ?? user.name ?? ""),
    studentAadhaar: String(req.studentAadhaar ?? user.aadhaarNumber ?? ""),
    studentPhone: String(req.studentPhone ?? user.phone ?? ""),
    studentCourse: String(req.studentCourse ?? user.course ?? ""),
    studentId: String(req.studentId ?? user.studentId ?? ""),
    studentEmail: String(req.studentEmail ?? user.email ?? ""),
    studentYear: String(req.studentYear ?? ""),
    selectedBookIds: selectedIds,
    selectedBooks,
    requestedBooks,
    bookDecisions,
    specialRequests,
    status: String(req.status ?? "Pending"),
    challanData: req.challanData ?? null,
    createdAt: toNs(req.createdAt as string),
  };
}

function analyticsFromApi(analytics: Record<string, number>) {
  return {
    totalStudents: BigInt(analytics.totalStudents ?? 0),
    totalBooks: BigInt(analytics.totalBooks ?? 0),
    pendingRequests: BigInt(analytics.pendingRequests ?? 0),
    approvedRequests: BigInt(analytics.approvedRequests ?? 0),
    rejectedRequests: BigInt(0),
    returnedRequests: BigInt(0),
    lowStockBooks: BigInt(0),
    requestsOverTime: [] as Array<[string, bigint]>,
    booksByCategory: [] as Array<[string, bigint]>,
  };
}

export const restBackend = {
  async adminLogin(username: string, password: string) {
    try {
      const data = await request<{
        success: boolean;
        token: string;
        expiresAt: number;
        message?: string;
      }>("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      return ok({
        token: data.token,
        expiresAt: BigInt(data.expiresAt) * BigInt(1_000_000),
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async sendOtp(aadhaarNumber: string, phone: string) {
    try {
      await request<{ success: boolean; message: string }>(
        "/api/auth/otp/send",
        { method: "POST", body: JSON.stringify({ aadhaarNumber, phone }) },
      );
      // OTP was sent via SMS. Frontend should NOT receive the actual OTP for security.
      return ok({ otp: "", demo: false });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async verifyOtpAndLogin(
    aadhaarNumber: string,
    otp: string,
    name: string,
    phone: string,
    course: string,
    college: string,
  ) {
    try {
      const data = await request<{ token: string; user: Record<string, unknown> }>(
        "/api/auth/otp/verify",
        {
          method: "POST",
          body: JSON.stringify({
            aadhaarNumber,
            otp,
            name,
            phone,
            course,
            college,
          }),
        },
      );
      return ok({ token: data.token, user: mongoUserToCanister(data.user) });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async studentSignupAndPay(
    aadhaarNumber: string,
    otp: string,
    name: string,
    phone: string,
    course: string,
    college: string,
    profileImageUrl: string,
  ) {
    try {
      const email = `${phone.replace(/\D/g, "") || "student"}@svga.local`;
      const data = await request<{ token: string; user: Record<string, unknown> }>(
        "/api/auth/register-and-pay",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password: otp || "demo123",
            phone,
            course,
            college,
            aadhaarNumber,
            profilePhoto: profileImageUrl || null,
          }),
        },
      );
      return ok({ token: data.token, user: mongoUserToCanister(data.user) });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async studentLogout(_token: string) {
    return ok(null);
  },

  async verifyStudentToken(token: string) {
    try {
      const data = await request<{ user: Record<string, unknown> }>(
        "/api/auth/current-user",
        { token },
      );
      return mongoUserToCanister(data.user);
    } catch {
      return null;
    }
  },

  async getPaymentStatus(token: string) {
    try {
      const data = await request<{
        payment: {
          _id: string;
          userId: string;
          amount: number;
          status: string;
          createdAt: string;
        } | null;
        membershipStatus: string;
      }>("/api/auth/payment-status", { token });
      if (!data.payment) return err("No payment");
      return ok({
        paymentId: data.payment._id,
        userId: data.payment.userId,
        amount: BigInt(data.payment.amount),
        status: data.payment.status,
        createdAt: toNs(data.payment.createdAt),
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async getAllBooks(adminToken: string) {
    const data = await request<{ books: Record<string, unknown>[] }>(
      "/api/books?limit=500",
      { token: adminToken },
    );
    return data.books.map(mongoBookToCanister);
  },

  async searchBooks(searchTerm: string, course: string) {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    // Map UI course label to backend category token when possible
    const cat = normalizeCourseToCategory(course);
    if (cat) params.set('course', cat);
    const data = await request<{ books: Record<string, unknown>[] }>(
      `/api/books?${params}`,
    );
    return data.books.map(mongoBookToCanister);
  },

  async searchInventory(searchQuery: string, category: string | null, _avail: string | null) {
    const params = new URLSearchParams({ limit: "500" });
    if (searchQuery) params.set("search", searchQuery);
    if (category) params.set("category", category);
    const data = await request<{ books: Record<string, unknown>[] }>(
      `/api/books?${params}`,
    );
    return data.books.map(mongoBookToCanister);
  },

  async getBookRecommendations(bookIdOrCourse: string) {
    const data = await request<{ books: Record<string, unknown>[] }>(
      `/api/books/recommendations?course=${encodeURIComponent(bookIdOrCourse)}`,
    );
    return data.books.map(mongoBookToCanister);
  },

  async getBookById(bookId: string) {
    try {
      const data = await request<{ book: Record<string, unknown> }>(
        `/api/books/${bookId}`,
      );
      return ok(mongoBookToCanister(data.book));
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async addBook(
    adminToken: string,
    title: string,
    author: string,
    edition: string,
    publisher: string,
    category: string,
    quantity: bigint,
    subject: string,
    grade: string,
    subjectCode: string,
    isbn: string,
  ) {
    try {
      const data = await request<{ book: Record<string, unknown> }>("/api/books", {
        method: "POST",
        token: adminToken,
        body: JSON.stringify({
          title,
          author,
          edition,
          publisher,
          category,
          subject,
          grade,
          subjectCode,
          isbn,
          quantity: Number(quantity),
        }),
      });
      return ok(mongoBookToCanister(data.book));
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async updateBook(
    adminToken: string,
    bookId: string,
    title: string,
    author: string,
    edition: string,
    publisher: string,
    category: string,
    quantity: bigint,
    availableCount: bigint,
    subject: string,
    grade: string,
    subjectCode: string,
    isbn: string,
  ) {
    try {
      const data = await request<{ book: Record<string, unknown> }>(
        `/api/books/${bookId}`,
        {
          method: "PATCH",
          token: adminToken,
          body: JSON.stringify({
            title,
            author,
            edition,
            publisher,
            category,
            subject,
            grade,
            subjectCode,
            isbn,
            quantity: Number(quantity),
            availableQuantity: Number(availableCount),
          }),
        },
      );
      return ok(mongoBookToCanister(data.book));
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async deleteBook(adminToken: string, bookId: string) {
    try {
      await request(`/api/books/${bookId}`, {
        method: "DELETE",
        token: adminToken,
      });
      return ok(null);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async seedBooks(adminToken: string, books: Array<Record<string, unknown>>) {
    try {
      await request("/api/books/seed", {
        method: "POST",
        token: adminToken,
        body: JSON.stringify({
          books: books.map((b) => ({
            title: b.title,
            author: b.author,
            edition: b.edition,
            publisher: b.publisher,
            category: b.category,
            quantity: Number(b.quantity),
            availableQuantity: Number(b.quantity),
          })),
        }),
      });
      return ok(null);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async importBooksFromCsv(adminToken: string, rows: Array<Record<string, unknown>>) {
    try {
      const data = await request<{
        inserted: number;
        skipped: number;
        errors: string[];
      }>("/api/books/import-csv", {
        method: "POST",
        token: adminToken,
        body: JSON.stringify({
          rows: rows.map((r) => ({
            title: r.title,
            author: r.author,
            edition: r.edition,
            publisher: r.publisher,
            category: r.category,
            subject: r.subject,
            grade: r.grade,
            subjectCode: r.subjectCode,
            isbn: r.isbn,
            totalCopies: Number(r.totalCopies ?? r.quantity ?? 1),
            availableCopies: Number(r.availableCopies ?? r.available ?? r.quantity ?? 1),
          })),
        }),
      });
      return ok({
        processed: BigInt(data.inserted),
        skipped: BigInt(data.skipped),
        errors: data.errors ?? [],
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async getMyRequests(token: string) {
    const data = await request<{ requests: Record<string, unknown>[] }>(
      "/api/requests/my",
      { token },
    );
    return data.requests.map(mongoRequestToCanister);
  },

  async getAllRequests(adminToken: string) {
    const data = await request<{ requests: Record<string, unknown>[] }>(
      "/api/admin/requests",
      { token: adminToken },
    );
    return data.requests.map(mongoRequestToCanister);
  },

  async searchRequests(
    adminToken: string,
    searchQuery: string,
    status: string | null,
    course: string | null,
  ) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (status) params.set("status", status);
    if (course) params.set("course", course);
    const data = await request<{ requests: Record<string, unknown>[] }>(
      `/api/admin/requests?${params}`,
      { token: adminToken },
    );
    return data.requests.map(mongoRequestToCanister);
  },

  async getMyIssuedBooks(token: string) {
    const data = await request<{ requests: Record<string, unknown>[] }>(
      "/api/requests/my",
      { token },
    );
    return data.requests
      .filter((r) => ["Approved", "Procured"].includes(String(r.status)))
      .map(mongoRequestToCanister);
  },

  async createBookRequest(
    token: string,
    selectedBookIds: string[],
    requestedBooks: Array<Record<string, unknown>>,
  ) {
    try {
      const data = await request<{ request: Record<string, unknown> }>(
        "/api/requests",
        {
          method: "POST",
          token,
          body: JSON.stringify({ selectedBookIds, requestedBooks }),
        },
      );
      return ok(mongoRequestToCanister(data.request));
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async updateRequestStatus(adminToken: string, requestId: string, status: string) {
    try {
      const data = await request<{ request: Record<string, unknown> }>(
        `/api/admin/requests/${requestId}/status`,
        {
          method: "PATCH",
          token: adminToken,
          body: JSON.stringify({ status }),
        },
      );
      return ok(mongoRequestToCanister(data.request));
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async getRequestById(token: string, requestId: string) {
    try {
      const data = await request<{ request: Record<string, unknown> }>(
        `/api/requests/${requestId}`,
        { token },
      );
      return ok(mongoRequestToCanister(data.request));
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async markBookReturned(adminToken: string, requestId: string) {
    return restBackend.updateRequestStatus(adminToken, requestId, "Returned");
  },

  async getAllUsers(adminToken: string) {
    const data = await request<{ users: Record<string, unknown>[] }>(
      "/api/admin/users",
      { token: adminToken },
    );
    return data.users.map(mongoUserToCanister);
  },

  async searchStudents(
    adminToken: string,
    searchQuery: string,
    course: string | null,
    membershipStatus: string | null,
  ) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (course) params.set("course", course);
    if (membershipStatus) params.set("membershipStatus", membershipStatus);
    const data = await request<{ users: Record<string, unknown>[] }>(
      `/api/admin/users?${params}`,
      { token: adminToken },
    );
    return data.users.map(mongoUserToCanister);
  },

  async getStudentProfile(userId: string) {
    try {
      const data = await request<{ user: Record<string, unknown> }>(
        `/api/students/${userId}`,
      );
      return mongoUserToCanister(data.user);
    } catch {
      return null;
    }
  },

  async getAnalyticsData(adminToken: string) {
    const data = await request<{ analytics: Record<string, number> }>(
      "/api/admin/analytics",
      { token: adminToken },
    );
    return analyticsFromApi(data.analytics);
  },

  async getReturnTimeline(adminToken: string) {
    const data = await request<{
      timeline: Array<Record<string, unknown>>;
    }>("/api/admin/return-timeline", { token: adminToken });
    return data.timeline.map((e) => ({
      requestId: String(e.requestId),
      studentName: String(e.studentName),
      studentId: String(e.studentId),
      bookTitles: [String(e.bookTitle ?? "")],
      returnDate: toNs(e.returnDate as string),
      daysUntilReturn: BigInt(Number(e.daysRemaining ?? 0)),
    }));
  },

  async setReturnDate(adminToken: string, requestId: string, returnDate: bigint) {
    try {
      const iso = new Date(Number(returnDate / BigInt(1_000_000))).toISOString();
      await request(`/api/admin/requests/${requestId}/return-date`, {
        method: "PATCH",
        token: adminToken,
        body: JSON.stringify({ returnDate: iso }),
      });
      return ok(null);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async getAdminPendingCount(adminToken: string) {
    const data = await request<{ analytics: { pendingRequests: number } }>(
      "/api/admin/analytics",
      { token: adminToken },
    );
    return BigInt(data.analytics.pendingRequests ?? 0);
  },

  async getAdminReturnAlerts(adminToken: string) {
    const data = await request<{ timeline: Array<Record<string, unknown>> }>(
      "/api/admin/return-timeline",
      { token: adminToken },
    );
    return data.timeline
      .filter((e) => Number(e.daysRemaining ?? 99) <= 5)
      .map((e) => ({
        bookTitle: String(e.bookTitle ?? ""),
        requestId: String(e.requestId),
        studentId: String(e.studentId),
        studentName: String(e.studentName),
        urgency: String(e.urgency ?? "yellow"),
        bookId: String(e.bookId ?? ""),
        daysUntilReturn: BigInt(Number(e.daysRemaining ?? 0)),
        returnDate: e.returnDate ? toNs(e.returnDate as string) : undefined,
      }));
  },

  async getBookLifecycleFlow(_adminToken: string) {
    return [];
  },

  async getAdminNotifications(_adminToken: string) {
    return [];
  },

  async updateStudentProfile() {
    return ok(null);
  },

  async checkBookAvailability(bookId: string) {
    try {
      const data = await request<{ book: Record<string, unknown> }>(
        `/api/books/${bookId}`,
      );
      const book = data.book;
      const available = Number(book.availableQuantity ?? 0) > 0;
      return ok({
        available,
        expectedReturnDate: null,
        waitingCount: BigInt(0),
        daysUntilReturn: null,
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async createBookReservation() {
    return err("Reservations not yet implemented on local API");
  },

  async getMyReservations() {
    return [];
  },

  async getReservationsForBook() {
    return [];
  },

  async getMyNotifications(token: string) {
    try {
      const data = await request<{ notifications: Record<string, unknown>[] }>(
        "/api/student/notifications",
        { token },
      );
      // Ensure actionUrl is present on objects (backend may include it)
      return (data.notifications || []).map((n: Record<string, unknown>) => ({
        ...n,
        actionUrl: n.actionUrl ?? null,
      }));
    } catch (e) {
      return [];
    }
  },

  async markNotificationRead(notificationId: string, token: string) {
    try {
      const data = await request<{ notification: Record<string, unknown> }>(
        `/api/student/notifications/${notificationId}/read`,
        { method: 'PATCH', token },
      );
      return data.notification;
    } catch (e) {
      return null;
    }
  },

  async getUnreadCount(token: string) {
    try {
      const notifs = await restBackend.getMyNotifications(token);
      const unread = Array.isArray(notifs) ? notifs.filter((n) => !n.isRead).length : 0;
      return BigInt(unread);
    } catch (e) {
      return BigInt(0);
    }
  },

  async createStudentNotification(adminToken: string, studentId: string, title: string, message: string) {
    try {
      const data = await request<{ notification: Record<string, unknown> }>(
        '/api/admin/notifications',
        { method: 'POST', token: adminToken, body: JSON.stringify({ studentId, title, message }) },
      );
      return ok(data.notification);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async createUrgentProcurementRequest() {
    return err("Procurement not yet implemented on local API");
  },

  async createProcurementRequest() {
    return err("Procurement not yet implemented on local API");
  },

  async getMyProcurements() {
    return [];
  },

  async getAllProcurements() {
    return [];
  },

  async updateProcurementStatus() {
    return ok(null);
  },

  async getInventoryLifecycle() {
    return [];
  },

  async getBooksReturningByDate(adminToken: string, days: bigint) {
    const data = await request<{ timeline: Array<Record<string, unknown>> }>(
      `/api/admin/return-timeline?days=${days}`,
      { token: adminToken },
    );
    return data.timeline.map((e) => ({
      requestId: String(e.requestId),
      bookId: String(e.bookId ?? ""),
      bookTitle: String(e.bookTitle ?? ""),
      studentId: String(e.studentId),
      studentName: String(e.studentName),
      returnDate: toNs(e.returnDate as string),
      daysUntilReturn: BigInt(Number(e.daysRemaining ?? 0)),
    }));
  },

  async transferBook() {
    return err("Transfers not yet implemented on local API");
  },

  async getTransferHistory() {
    return [];
  },

  async getTransfersForBook() {
    return [];
  },

  async updateIssuedBookStatus(adminToken: string, requestId: string, returned: boolean) {
    if (returned) {
      return restBackend.updateRequestStatus(adminToken, requestId, "Returned");
    }
    return ok(null);
  },

  async getCollectionQueue() {
    return [];
  },

  async getAuditLog() {
    return ok([]);
  },

  async completeApproval(
    adminToken: string,
    requestId: string,
    collectionDate: string,
    collectionTime: string,
    collectionLocation: string,
    adminName: string,
  ) {
    try {
      const data = await request<{
        success: boolean;
        challanData: Record<string, unknown>;
        qrCodeDataUrl: string;
        requestId: string;
      }>("/api/challans/create", {
        method: "POST",
        token: adminToken,
        body: JSON.stringify({
          requestId,
          collectionDate,
          collectionTime,
          collectionLocation,
          adminName,
        }),
      });
      return ok(data);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async getAllCollectionOrders() {
    return [];
  },

  async getCollectionOrder(token: string, requestId: string) {
    try {
      const data = await request<{ request: Record<string, unknown> }>(
        `/api/requests/${requestId}`,
        { token },
      );
      const req = data.request;
      if (!req) return err('Request not found');

      // Try to parse challanData if present
      let challan = null as null | Record<string, unknown>;
      try {
        if (req.challanData) {
          challan = typeof req.challanData === 'string' ? JSON.parse(String(req.challanData)) : (req.challanData as Record<string, unknown>);
        }
      } catch {}

      const selected = Array.isArray(req.selectedBooks) ? req.selectedBooks as Record<string, unknown>[] : [];
      const selectedIds = Array.isArray(req.selectedBookIds) ? req.selectedBookIds : [];
      const requested = Array.isArray(req.requestedBooks) ? req.requestedBooks as Record<string, unknown>[] : [];

      const bookDecisions: Record<string, unknown>[] = [];
      // Library books
      for (let i = 0; i < Math.max(selected.length, (selectedIds as any).length); i++) {
        const sb = selected[i] || {};
        const idRaw = (selectedIds as any)[i];
        const inventoryId = typeof idRaw === 'object' && idRaw ? String((idRaw as { _id?: string })._id ?? idRaw) : String(idRaw ?? '');
        bookDecisions.push({
          bookId: inventoryId || `book_${i}`,
          bookName: String(sb.title ?? ''),
          bookNumber: String(i + 1),
          inventoryId,
          decision: String(sb.decision ?? '') || 'Pending',
          reason: sb.reason ?? null,
          expectedReturnDate: sb.returnDate ? toNs(String(sb.returnDate)) : null,
          currentHolder: sb.currentHolder ?? null,
          procurementCreated: false,
        });
      }

      // Manual/requested books
      for (let j = 0; j < requested.length; j++) {
        const rb = requested[j] || {};
        bookDecisions.push({
          bookId: `manual_${j}`,
          bookName: String(rb.title ?? ''),
          bookNumber: String(selected.length + j + 1),
          inventoryId: null,
          decision: String(rb.decision ?? '') || 'Pending',
          reason: String(rb.note ?? rb.reason ?? null) || null,
          expectedReturnDate: null,
          currentHolder: null,
          procurementCreated: false,
        });
      }

      const collectionDate = challan?.collectionDate ?? null;
      const collectionTime = challan?.collectionTime ?? null;
      const collectionLocation = challan?.collectionLocation ?? null;
      const adminName = challan?.adminName ?? null;
      const generatedAt = challan?.generatedAt ? toNs(String(challan.generatedAt)) : toNs(req.updatedAt as string);

      const orderNumber = req.requestId ? String(req.requestId) : String(req._id ?? '').slice(-8);

      return ok({
        orderId: String(req._id ?? orderNumber),
        orderNumber,
        collectionDate: collectionDate ?? null,
        collectionTime: collectionTime ?? null,
        collectionLocation: collectionLocation ?? null,
        bookDecisions,
        studentId: String(req.studentId ?? req.userId ?? ''),
        studentName: String(req.studentName ?? ''),
        requestId: String(req._id ?? orderNumber),
        adminName: adminName ?? null,
        generatedAt,
        challanId: null,
        studentEmail: String(req.studentEmail ?? ''),
        studentPhone: String(req.studentPhone ?? ''),
        studentCourse: String(req.studentCourse ?? ''),
        status: String(req.status ?? ''),
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async getRequestDetails(adminToken: string, requestId: string) {
    try {
      const data = await request<{ request: Record<string, unknown> }>(
        `/api/requests/${requestId}`,
        { token: adminToken },
      );
      const req = data.request;

      const books = Array.isArray(req.selectedBookIds)
        ? req.selectedBookIds.map((b: Record<string, unknown> | string, i: number) => {
            const book = typeof b === "object" ? b : {};
            const selectedBook = Array.isArray(req.selectedBooks)
              ? (req.selectedBooks as Record<string, unknown>[])[i]
              : undefined;
            return {
              bookId: String((book as { _id?: string })._id ?? `book_${i}`),
              title: String((book as { title?: string }).title ?? "Unknown Book"),
              bookNumber: String(i + 1),
              inventoryId: String((book as { _id?: string })._id ?? `inv_${i}`),
              subject: String(
                (book as { category?: string }).category ??
                  (book as { subject?: string }).subject ??
                  "",
              ),
              edition: String(
                (book as { edition?: string }).edition ??
                  (selectedBook as { edition?: string })?.edition ??
                  "",
              ),
              author: String(
                (book as { author?: string }).author ??
                  (selectedBook as { author?: string })?.author ??
                  "",
              ),
              publisher: String(
                (book as { publisher?: string }).publisher ??
                  (selectedBook as { publisher?: string })?.publisher ??
                  "",
              ),
              availabilityStatus: String(
                (book as { availability?: string }).availability ?? "available",
              ),
              queueLength: BigInt(
                (book as { queueLength?: number }).queueLength ?? 0,
              ),
              decision: (selectedBook as { decision?: string })?.decision || undefined,
              currentHolder: (book as { currentHolder?: string }).currentHolder,
              expectedReturnDate: (book as { expectedReturnDate?: string }).expectedReturnDate,
            };
          })
        : [];

      const requestData = mongoRequestToCanister(req);
      return ok({
        request: requestData,
        specialRequests: [],
        student: {
          studentId: requestData.studentId,
          name: requestData.studentName,
          firstName: "",
          middleName: "",
          grandFatherName: "",
          surname: "",
          academicYear: requestData.studentYear ?? "",
          aadhaarNumber: requestData.studentAadhaar ?? "",
          phone: requestData.studentPhone ?? "",
          course: requestData.studentCourse,
          college: "",
          frozenAadhaar: false,
          frozenPhone: false,
          profileImageUrl: "",
          membershipStatus: "NOT_PAID",
          paymentStatus: "PENDING",
          createdAt: BigInt(0),
          issuedBooksInfo: [],
          email: requestData.studentEmail ?? "",
        },
        books,
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async approveBook(adminToken: string, requestId: string, bookId: string) {
    try {
      const body: Record<string, unknown> = { bookId, decision: 'approved' };
      if (bookId.startsWith('manual:')) {
        const parts = bookId.split(':');
        const manualIndex = Number(parts[1]);
        if (!Number.isNaN(manualIndex)) {
          body.bookId = undefined;
          body.isManualBook = true;
          body.bookIndex = manualIndex;
        }
      }
      await request<{ request: Record<string, unknown> }>(
        `/api/admin/requests/${requestId}/book-decision`,
        {
          token: adminToken,
          method: 'PATCH',
          body: JSON.stringify(body),
        },
      );
      return ok(null);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async rejectBook(adminToken: string, requestId: string, bookId: string) {
    try {
      const body: Record<string, unknown> = { bookId, decision: 'rejected' };
      if (bookId.startsWith('manual:')) {
        const parts = bookId.split(':');
        const manualIndex = Number(parts[1]);
        if (!Number.isNaN(manualIndex)) {
          body.bookId = undefined;
          body.isManualBook = true;
          body.bookIndex = manualIndex;
        }
      }
      await request<{ request: Record<string, unknown> }>(
        `/api/admin/requests/${requestId}/book-decision`,
        {
          token: adminToken,
          method: 'PATCH',
          body: JSON.stringify(body),
        },
      );
      return ok(null);
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  },

  async reserveBook() {
    return ok(null);
  },

  async updateStudent() {
    return ok(null);
  },

  async getPendingRequests(adminToken: string) {
    const data = await request<{ requests: Record<string, unknown>[] }>(
      "/api/admin/requests?status=Pending",
      { token: adminToken },
    );
    return data.requests.map((r) => ({
      requestId: String(r._id),
      studentId: String(r.studentId ?? ""),
      studentName: String(r.studentName ?? ""),
      phoneNumber: String(r.studentPhone ?? ""),
      course: String(r.studentCourse ?? ""),
      requestDate: toNs(r.createdAt as string),
      totalBooksCount: BigInt(
        (Array.isArray(r.selectedBookIds) ? r.selectedBookIds.length : 0) +
          (Array.isArray(r.requestedBooks) ? r.requestedBooks.length : 0),
      ),
      status: String(r.status ?? "Pending"),
    }));
  },

  async getCompletedForms(adminToken: string) {
    const data = await request<{ requests: Record<string, unknown>[] }>(
      "/api/admin/requests?status=Approved",
      { token: adminToken },
    );
    return data.requests.map(mongoRequestToCanister);
  },

  async getManualBooksToPurchase(adminToken: string) {
    const data = await request<{ manualBooks: Record<string, unknown>[] }>(
      "/api/admin/manual-books",
      { token: adminToken },
    );
    return data.manualBooks.map((item) => {
      const procurement = (item.procurement ?? {}) as Record<string, unknown>;
      return {
        requestId: String(item.requestId ?? ""),
        studentId: String(item.studentId ?? ""),
        studentName: String(item.studentName ?? ""),
        studentCourse: String(item.studentCourse ?? ""),
        studentYear: String(item.studentYear ?? ""),
        studentPhone: String(item.studentPhone ?? ""),
        collectionDate: String(item.collectionDate ?? ""),
        collectionTime: String(item.collectionTime ?? ""),
        collectionLocation: String(item.collectionLocation ?? ""),
        requestNumber: String(item.requestNumber ?? ""),
        manualIndex: Number(item.manualIndex ?? 0),
        procurement: {
          id: String(procurement.id ?? ""),
          bookTitle: String(procurement.bookTitle ?? ""),
          author: String(procurement.author ?? ""),
          edition: String(procurement.edition ?? ""),
          publisher: String(procurement.publisher ?? ""),
          status: String(procurement.status ?? "Pending"),
          isPurchased: Boolean(procurement.isPurchased ?? false),
          purchaseBatchId: String(procurement.purchaseBatchId ?? ""),
          purchasePdfUrl: String(procurement.purchasePdfUrl ?? ""),
        },
      };
    });
  },

  async updateManualBookStatus(adminToken: string, requestId: string, bookTitle: string, newStatus: string) {
    const body: Record<string, unknown> = {
      decision: newStatus,
      bookTitle,
    };
    if (bookTitle.startsWith('manual:')) {
      const parts = bookTitle.split(':');
      const manualIndex = Number(parts[1]);
      if (!Number.isNaN(manualIndex)) {
        body.bookTitle = undefined;
        body.isManualBook = true;
        body.bookIndex = manualIndex;
      }
    }
    await request<{ request: Record<string, unknown> }>(
      `/api/admin/requests/${requestId}/book-decision`,
      {
        token: adminToken,
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
    return ok(null);
  },

  async setAdminCredentials() {
    return ok(null);
  },
} as unknown as Backend;
