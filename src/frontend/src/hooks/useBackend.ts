import type { BookDetailView as CanisterBookDetailView } from "@/backend";
import type {
  BookDecisionStatus,
  AnalyticsData as CanisterAnalyticsData,
  Book as CanisterBook,
  BookCsvRow as CanisterBookCsvRow,
  BookInput as CanisterBookInput,
  BookRequest as CanisterBookRequest,
  Notification as CanisterNotification,
  ProcurementRequest as CanisterProcurementRequest,
  RequestedBookPublic as CanisterRequestedBookPublic,
  Reservation as CanisterReservation,
  Transfer as CanisterTransfer,
  ProcurementStatus,
  ProcurementUrgency,
  ReturnTimelineEntry,
  UserPublic,
} from "@/backend";
import { useAnonActor } from "@/hooks/useAnonActor";
import { userPublicToUser } from "@/hooks/useAuth";
import type {
  AnalyticsData,
  Book,
  BookAvailability,
  BookCsvRow,
  BookInput,
  BookRequest,
  BookReturningEntry,
  CollectionOrder,
  CsvImportResult,
  InventoryLifecycleItem,
  Notification,
  ProcurementRequest,
  RequestedBookPublic,
  Reservation,
  ReturnTimelineItem,
  Transfer,
  User,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// ─── Token helpers ───────────────────────────────────────────────────────────

function getStudentToken(): string {
  const simple = localStorage.getItem("svga_token");
  if (simple) return simple;
  try {
    const raw = localStorage.getItem("svga_student_session");
    if (!raw) return "";
    const s = JSON.parse(raw) as { token: string; expiresAt: number };
    if (Date.now() > s.expiresAt) return "";
    return s.token ?? "";
  } catch {
    return "";
  }
}

function getAdminToken(): string {
  try {
    const raw = localStorage.getItem("svga_admin_session");
    if (!raw) return "";
    const s = JSON.parse(raw) as { token: string; expiresAt: number };
    if (Date.now() > s.expiresAt) return "";
    return s.token ?? "";
  } catch {
    return "";
  }
}

// ─── Canister type → frontend type converters ─────────────────────────────────

function canisterBookToBook(b: CanisterBook): Book {
  return {
    _id: b.bookId,
    bookId: b.bookId,
    title: b.title,
    author: b.author,
    edition: b.edition,
    publisher: b.publisher,
    category: b.category,
    quantity: Number(b.quantity),
    availableQuantity: Number(b.availableCount),
    availableCount: Number(b.availableCount),
    createdAt: new Date(Number(b.createdAt) / 1_000_000).toISOString(),
  };
}

function canisterRequestToBookRequest(r: CanisterBookRequest): BookRequest {
  const createdAt =
    typeof r.createdAt === "bigint"
      ? new Date(Number(r.createdAt) / 1_000_000).toISOString()
      : String(r.createdAt);
  return {
    _id: r.requestId,
    requestId: r.requestId,
    userId: r.userId,
    studentName: r.studentName,
    studentAadhaar: r.studentAadhaar,
    studentPhone: r.studentPhone,
    studentCourse: r.studentCourse,
    studentId: r.studentId,
    studentEmail: r.studentEmail ?? "",
    studentYear: r.studentYear ?? "",
    selectedBookIds: r.selectedBookIds,
    selectedBooks: [],
    requestedBooks: r.requestedBooks.map((rb) => ({
      title: rb.title,
      author: rb.author,
      edition: rb.edition,
      publisher: rb.publisher,
      imageUrl: rb.imageUrl,
      decision: String((rb as any).decision ?? ""),
    })),
    bookDecisions: (r.bookDecisions ?? []).map((bd) => ({
      bookId: bd.bookId,
      bookName: bd.bookName,
      bookNumber: bd.bookNumber,
      inventoryId: bd.inventoryId,
      decision: String(
        bd.decision,
      ) as BookRequest["bookDecisions"] extends Array<infer T>
        ? T extends { decision: infer D }
          ? D
          : string
        : string,
      reason: bd.reason ?? undefined,
      expectedReturnDate: bd.expectedReturnDate
        ? new Date(Number(bd.expectedReturnDate) / 1_000_000).toISOString()
        : undefined,
      currentHolder: bd.currentHolder ?? undefined,
      procurementCreated: bd.procurementCreated,
    })),
    specialRequests: (r.specialRequests ?? []).map((sr) => ({
      title: sr.title,
      author: sr.author,
      edition: sr.edition,
      publisher: sr.publisher,
      status: String(sr.status),
      reason: sr.reason ?? undefined,
      procurementId: sr.procurementId ?? undefined,
      expectedAvailabilityDate: sr.expectedAvailabilityDate ?? undefined,
    })),
    status: r.status as BookRequest["status"],
    challanGenerated: !!r.challanData,
    challanData: r.challanData,
    createdAt,
  };
}

function canisterAnalyticsToAnalytics(a: CanisterAnalyticsData): AnalyticsData {
  return {
    totalStudents: Number(a.totalStudents),
    activeMembers: Number(a.totalStudents),
    totalBooks: Number(a.totalBooks),
    totalIssuedBooks: Number(a.approvedRequests),
    pendingRequests: Number(a.pendingRequests),
    approvedRequests: Number(a.approvedRequests),
    procuredRequests: 0,
    rejectedRequests: Number(a.rejectedRequests),
    returnedRequests: Number(a.returnedRequests),
    totalRevenue: 0,
    lowStockBooks: Number(a.lowStockBooks),
    requestsOverTime: (a.requestsOverTime ?? []).map(([k, v]) => [
      k,
      Number(v),
    ]),
    booksByCategory: (a.booksByCategory ?? []).map(([k, v]) => [k, Number(v)]),
    courseDistribution: [],
  };
}

function canisterTimelineToItem(e: ReturnTimelineEntry): ReturnTimelineItem {
  const days = Number(e.daysUntilReturn ?? 0);
  const urgency: ReturnTimelineItem["urgency"] =
    days < 0 ? "overdue" : days <= 2 ? "red" : days <= 5 ? "yellow" : "green";
  return {
    requestId: e.requestId,
    studentName: e.studentName,
    studentId: e.studentId,
    bookTitle: e.bookTitles?.[0] ?? "",
    bookAuthor: "",
    returnDate: e.returnDate
      ? new Date(Number(e.returnDate) / 1_000_000).toISOString()
      : "",
    daysRemaining: days,
    urgency,
  };
}

function canisterReservationToReservation(r: CanisterReservation): Reservation {
  return {
    id: r.id,
    studentId: r.studentId,
    bookId: r.bookId,
    requestDate: new Date(Number(r.requestDate) / 1_000_000).toISOString(),
    expectedAvailabilityDate: r.expectedAvailabilityDate
      ? new Date(Number(r.expectedAvailabilityDate) / 1_000_000).toISOString()
      : undefined,
    status: r.status as Reservation["status"],
  };
}

function canisterProcurementToProcurement(
  p: CanisterProcurementRequest,
): ProcurementRequest {
  return {
    id: p.id,
    studentId: p.studentId,
    bookTitle: p.bookTitle,
    bookId: p.bookId ?? undefined,
    author: p.author ?? undefined,
    edition: p.edition ?? undefined,
    publisher: p.publisher ?? undefined,
    requestDate: new Date(Number(p.requestDate) / 1_000_000).toISOString(),
    urgency:
      p.urgency === ("Required" as unknown as ProcurementUrgency)
        ? "Required"
        : "Optional",
    status: p.status as ProcurementRequest["status"],
  };
}

function canisterTransferToTransfer(t: CanisterTransfer): Transfer {
  return {
    id: t.id,
    bookId: t.bookId,
    fromStudentId: t.fromStudentId,
    toStudentId: t.toStudentId,
    transferDate: new Date(Number(t.transferDate) / 1_000_000).toISOString(),
    adminNotes: t.adminNotes ?? undefined,
    challanId: t.challanId ?? undefined,
  };
}

// ─── Admin Alerts, Lifecycle Flow, and Notifications ─────────────────────────

export interface AdminReturnAlert {
  bookTitle: string;
  requestId: string;
  studentId: string;
  studentName: string;
  urgency: string;
  bookId: string;
  daysUntilReturn: number;
  returnDate?: string;
  nextReservedStudent?: { studentId: string; studentName: string };
}

export interface BookLifecycleFlowItem {
  bookId: string;
  bookTitle: string;
  currentHolder?: {
    userId: string;
    name: string;
    issueDate: string;
    returnDate?: string;
  };
  nextReservedStudent?: {
    userId: string;
    name: string;
    reservationDate: string;
  };
}

export function useGetAdminReturnAlerts() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<AdminReturnAlert[]>({
    queryKey: ["adminReturnAlerts"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const alerts = await actor.getAdminReturnAlerts(adminToken);
      return alerts.map((a) => ({
        bookTitle: a.bookTitle,
        requestId: a.requestId,
        studentId: a.studentId,
        studentName: a.studentName,
        urgency: a.urgency,
        bookId: a.bookId,
        daysUntilReturn: Number(a.daysUntilReturn),
        returnDate: a.returnDate
          ? new Date(Number(a.returnDate) / 1_000_000).toISOString()
          : undefined,
        nextReservedStudent: a.nextReservedStudent,
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export function useGetBookLifecycleFlow() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<BookLifecycleFlowItem[]>({
    queryKey: ["bookLifecycleFlow"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const items = await actor.getBookLifecycleFlow(adminToken);
      return items.map((item) => ({
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        currentHolder: item.currentHolder
          ? {
              userId: item.currentHolder.userId,
              name: item.currentHolder.name,
              issueDate: new Date(
                Number(item.currentHolder.issueDate) / 1_000_000,
              ).toISOString(),
              returnDate: item.currentHolder.returnDate
                ? new Date(
                    Number(item.currentHolder.returnDate) / 1_000_000,
                  ).toISOString()
                : undefined,
            }
          : undefined,
        nextReservedStudent: item.nextReservedStudent
          ? {
              userId: item.nextReservedStudent.userId,
              name: item.nextReservedStudent.name,
              reservationDate: new Date(
                Number(item.nextReservedStudent.reservationDate) / 1_000_000,
              ).toISOString(),
            }
          : undefined,
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  kind: string;
}

export function useGetAdminNotifications() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<AdminNotification[]>({
    queryKey: ["adminNotifications"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const notifs = await actor.getAdminNotifications(adminToken);
      return notifs.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        timestamp: new Date(Number(n.timestamp) / 1_000_000).toISOString(),
        actionUrl: n.actionUrl ?? undefined,
        kind: String(n.kind),
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
  });
}

export function useGetAdminUnreadCount() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<number>({
    queryKey: ["adminUnreadCount"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      // getUnreadCount takes a student token; use admin token
      const count = await actor.getUnreadCount(adminToken);
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

/** Poll the number of pending (unreviewed) requests — used for nav badge and toast alerts */
export function useAdminPendingCount() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<number>({
    queryKey: ["adminPendingCount"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const count = await actor.getAdminPendingCount(adminToken);
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

function canisterNotificationToNotification(
  n: CanisterNotification,
): Notification {
  return {
    id: n.id,
    userId: n.userId,
    kind: n.kind as string,
    title: n.title,
    message: n.message,
    actionUrl: n.actionUrl ?? undefined,
    timestamp: Number(n.timestamp) / 1_000_000,
    isRead: n.isRead,
  };
}

/** No-op stub kept for backward compat */
export function getActorPromise(): Promise<never> {
  return Promise.reject(new Error("ICP actor — use canister hooks"));
}

// ─── Aadhaar + OTP Auth ───────────────────────────────────────────────────────

/** Step 1: Send OTP to Aadhaar-linked phone */
export function useSendOtp() {
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      aadhaarNumber,
      phone,
    }: { aadhaarNumber: string; phone: string }) => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.sendOtp(aadhaarNumber, phone);
      if (result.__kind__ === "err") throw new Error(result.err);
      // Demo mode: OTP is returned for screen display
      return { otp: result.ok.otp, demo: result.ok.demo };
    },
  });
}

/** Step 2a: Verify OTP and login existing user OR complete new user registration */
export function useVerifyOtpAndLogin() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      aadhaarNumber,
      otp,
      name = "",
      phone = "",
      course = "",
      college = "",
    }: {
      aadhaarNumber: string;
      otp: string;
      name?: string;
      phone?: string;
      course?: string;
      college?: string;
    }) => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.verifyOtpAndLogin(
        aadhaarNumber,
        otp,
        name,
        phone,
        course,
        college,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      const user = userPublicToUser(result.ok.user);
      return { token: result.ok.token, user, userId: user._id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUser"] }),
  });
}

/** Complete Aadhaar registration + pay atomically */
export function useStudentSignupAndPay() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      aadhaarNumber,
      otp,
      name,
      firstName = "",
      middleName = "",
      grandFatherName = "",
      surname = "",
      email = "",
      phone,
      course,
      college = "",
      profileImageUrl = "",
      birthDate = "",
      parentsContact = "",
      nativePlace = "",
      educationLevel = "",
      educationSpecialization = "",
      occupation = "",
      occupationOther = "",
      officialSurname = "",
      academicYear = "",
      currentLocation = "",
      courseName = "",
    }: {
      aadhaarNumber: string;
      otp: string;
      name: string;
      firstName?: string;
      middleName?: string;
      grandFatherName?: string;
      surname?: string;
      email?: string;
      phone: string;
      course: string;
      college?: string;
      profileImageUrl?: string;
      birthDate?: string;
      parentsContact?: string;
      nativePlace?: string;
      educationLevel?: string;
      educationSpecialization?: string;
      occupation?: string;
      occupationOther?: string;
      officialSurname?: string;
      academicYear?: string;
      currentLocation?: string;
      courseName?: string;
    }) => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.studentSignupAndPay(
        aadhaarNumber,
        otp,
        name,
        phone,
        course,
        college,
        profileImageUrl,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      const token = result.ok.token;
      const user = userPublicToUser(result.ok.user);

      // Persist the 4-part name and all extended profile fields via updateStudentProfile
      if (token && (firstName || middleName || grandFatherName || surname)) {
        actor
          .updateStudentProfile(token, {
            firstName,
            middleName,
            grandFatherName,
            surname,
            email,
            course,
            courseName,
            college,
            academicYear,
            birthDate,
            parentContact: parentsContact,
            nativePlace,
            educationLevel,
            educationSpecialization,
            occupation,
            occupationOther,
            officialSurname,
            currentLocation,
          })
          .catch(() => {
            // Non-fatal — name fields will be stored locally via session
          });
      }

      // Merge the name parts into the returned user so local session is complete
      const enrichedUser = {
        ...user,
        firstName: firstName || user.firstName,
        middleName: middleName || user.middleName,
        grandFatherName: grandFatherName || user.grandFatherName,
        surname: surname || user.surname,
        email: email || user.email,
        membershipStatus: "PAID" as const,
        paymentStatus: "SUCCESS" as const,
      };

      return { token, user: enrichedUser, userId: enrichedUser._id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUser"] }),
  });
}

export function useStudentLogout() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (token: string): Promise<void> => {
      if (actor && token) await actor.studentLogout(token).catch(() => {});
    },
    onSuccess: () => qc.clear(),
  });
}

// ─── OTP Service hooks (production-ready, demo mode until API keys added) ─────

export interface OtpSendPayload {
  aadhaarNumber: string;
  phone: string;
  email?: string;
}

export interface OtpSendResult {
  success: boolean;
  otp?: string; // only in demo mode
  demo: boolean;
  message?: string;
}

export interface OtpVerifyPayload {
  aadhaarNumber: string;
  otp: string;
  phone?: string;
}

/** Send OTP to student's registered phone number */
export function useSendOTP() {
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      aadhaarNumber,
      phone,
    }: OtpSendPayload): Promise<OtpSendResult> => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.sendOtp(aadhaarNumber, phone);
      if (result.__kind__ === "err") throw new Error(result.err);
      return { success: true, otp: result.ok.otp, demo: result.ok.demo };
    },
  });
}

/** Verify OTP — returns user token on success */
export function useVerifyOTP() {
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      aadhaarNumber,
      otp,
      phone = "",
    }: OtpVerifyPayload) => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.verifyOtpAndLogin(
        aadhaarNumber,
        otp,
        "",
        phone,
        "",
        "",
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      const user = userPublicToUser(result.ok.user);
      return { token: result.ok.token, user, userId: user._id, verified: true };
    },
  });
}

// ─── Drop options (surnames, villages) ────────────────────────────────────────

/** Approved surnames (sourced from backend constants) */
export const APPROVED_SURNAMES = [
  "Bauva",
  "Buricha",
  "Charla",
  "Chhadwa",
  "Chheda",
  "Dagha",
  "Dedhia",
  "Furiya",
  "Gada",
  "Gala",
  "Gindra",
  "Gogri",
  "Karia",
  "Khirani-Gala",
  "Khuthia",
  "Mamania",
  "Mota",
  "Nandu",
  "Nisar",
  "Rambhia",
  "Rita",
  "Satra",
  "Savla",
  "Shah",
  "Vadhan",
  "Visaria",
  "Vora",
] as const;

/** Approved villages (sourced from backend constants) */
export const APPROVED_VILLAGES = [
  "Adhoi",
  "Bhachau",
  "Bharudia",
  "Gagodar",
  "Ghanithar",
  "Halra",
  "Kakrava",
  "Kharoi",
  "Lakadiya",
  "Manafra",
  "Nandasar",
  "N. Trambo",
  "Rav",
  "Samkhiyari",
  "Shivlakha",
  "Suvai",
  "Thoriyari",
  "Trambo",
  "Vanoi",
] as const;

export interface DropOptions {
  surnames: string[];
  villages: string[];
}

/** Get dropdown options for registration form */
export function useGetDropOptions() {
  return useQuery<DropOptions>({
    queryKey: ["dropOptions"],
    queryFn: async (): Promise<DropOptions> => ({
      surnames: [...APPROVED_SURNAMES],
      villages: [...APPROVED_VILLAGES],
    }),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// ─── Notification Service hooks ────────────────────────────────────────────────

export type NotificationChannel = "website" | "email" | "sms" | "whatsapp";
export type NotificationEventType =
  | "registration_success"
  | "payment_success"
  | "book_approved"
  | "book_rejected"
  | "book_reserved"
  | "book_available"
  | "return_reminder"
  | "due_date_reminder"
  | "course_completion"
  | "year_promotion"
  | "challan_generated"
  | "procurement_needed"
  | "procurement_ready"
  | "waiting_list_update";

export type NotificationDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "demo";

export interface NotificationDeliveryRecord {
  id: string;
  userId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  error?: string;
  providerId?: string;
}

export interface SendNotificationPayload {
  userId: string;
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  data: Record<string, string>;
}

/** Send a multi-channel notification */
export function useSendNotification() {
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (
      payload: SendNotificationPayload,
    ): Promise<NotificationDeliveryRecord[]> => {
      if (!actor) throw new Error("Canister not ready");
      const token = getStudentToken() || getAdminToken();
      if (!token) throw new Error("Not authenticated");
      // Store notification via canister; external delivery handled by cloud function infra
      try {
        // Use createStudentNotification to store in-app notification in canister
        await actor.createStudentNotification(
          token,
          payload.userId,
          payload.eventType,
          payload.data.title ?? payload.eventType,
          payload.data.message ?? "",
          payload.data.actionUrl ?? null,
        );
      } catch {
        // non-fatal: always return demo records
      }
      // Return demo delivery records for each requested channel
      const now = new Date().toISOString();
      return payload.channels.map(
        (channel): NotificationDeliveryRecord => ({
          id: `${Date.now()}_${channel}`,
          userId: payload.userId,
          eventType: payload.eventType,
          channel,
          status: channel === "website" ? "sent" : "demo",
          sentAt: now,
          providerId:
            channel !== "website" ? `demo_${channel}_${Date.now()}` : undefined,
        }),
      );
    },
  });
}

/** Get notification delivery status for a specific notification */
export function useGetDeliveryStatus(notificationId: string) {
  return useQuery<NotificationDeliveryRecord | null>({
    queryKey: ["notificationDelivery", notificationId],
    queryFn: async (): Promise<NotificationDeliveryRecord | null> => {
      if (!notificationId) return null;
      return {
        id: notificationId,
        userId: "",
        eventType: "registration_success",
        channel: "website",
        status: "sent",
        sentAt: new Date().toISOString(),
      };
    },
    enabled: !!notificationId,
    staleTime: 10_000,
  });
}

// ─── Legacy stubs (kept for type compat) ──────────────────────────────────────
/** @deprecated Use useVerifyOtpAndLogin instead */
export function useStudentLogin() {
  return useMutation({
    mutationFn: async (_args: { email: string; password: string }) => {
      throw new Error("Use Aadhaar+OTP login");
    },
  });
}
/** @deprecated Not used in Aadhaar flow */
export function useForgotPassword() {
  return useMutation({ mutationFn: async (_email: string) => "" });
}
/** @deprecated Not used in Aadhaar flow */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (_args: {
      email: string;
      resetToken: string;
      newPassword: string;
    }) => "",
  });
}

export function useVerifyStudentToken(token: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<User | null>({
    queryKey: ["verifyToken", token],
    queryFn: async () => {
      if (!token || !actor) return null;
      const result = await actor.verifyStudentToken(token);
      return result ? userPublicToUser(result) : null;
    },
    enabled: !!token && !!actor && !isFetching,
  });
}

// ─── QR helpers ───────────────────────────────────────────────────────────────

export function useGetStudentQrUrl(userId: string) {
  return useQuery<string>({
    queryKey: ["studentQrUrl", userId],
    queryFn: () =>
      userId
        ? Promise.resolve(`${window.location.origin}/student/qr/${userId}`)
        : Promise.resolve(""),
    enabled: !!userId,
  });
}

export function useGetQrCodeData(studentId: string) {
  return useQuery<string>({
    queryKey: ["qrcode", studentId],
    queryFn: () =>
      studentId
        ? Promise.resolve(`${window.location.origin}/student/qr/${studentId}`)
        : Promise.resolve(""),
    enabled: !!studentId,
  });
}

// ─── Books ────────────────────────────────────────────────────────────────────

export function useAllBooks() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: async () => {
      if (!actor) return [];
      const adminToken = getAdminToken();
      if (adminToken) {
        const books = await actor.getAllBooks(adminToken);
        return books.filter((b) => !b.isDeleted).map(canisterBookToBook);
      }
      const books = await actor.searchBooks("", "");
      return books.filter((b) => !b.isDeleted).map(canisterBookToBook);
    },
    enabled: !!actor && !isFetching,
    staleTime: 120_000,
  });
}

export function useSearchBooks(searchTerm: string, course: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Book[]>({
    queryKey: ["books", "search", searchTerm, course],
    queryFn: async () => {
      if (!actor) return [];
      const books = await actor.searchBooks(
        searchTerm,
        course === "All" ? "" : course,
      );
      return books.filter((b) => !b.isDeleted).map(canisterBookToBook);
    },
    enabled: !!actor && !isFetching,
    staleTime: 120_000,
  });
}

export function useBookRecommendations(bookIdOrCourse: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Book[]>({
    queryKey: ["books", "recommendations", bookIdOrCourse],
    queryFn: async () => {
      if (!actor || !bookIdOrCourse) return [];
      const books = await actor.getBookRecommendations(bookIdOrCourse);
      return books.filter((b) => !b.isDeleted).map(canisterBookToBook);
    },
    enabled: !!actor && !isFetching && !!bookIdOrCourse,
  });
}

export function useGetBookById(bookId: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Book | null>({
    queryKey: ["book", bookId],
    queryFn: async () => {
      if (!actor || !bookId) return null;
      const result = await actor.getBookById(bookId);
      if (result.__kind__ === "err") return null;
      return canisterBookToBook(result.ok);
    },
    enabled: !!actor && !isFetching && !!bookId,
  });
}

export function useSearchInventory(
  searchQuery: string,
  category: string | null,
  availabilityFilter: string | null,
  edition: string | null = null,
  sortBy: string | null = null,
) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Book[]>({
    queryKey: [
      "inventory",
      "search",
      searchQuery,
      category,
      availabilityFilter,
      edition,
      sortBy,
    ],
    queryFn: async () => {
      if (!actor) return [];
      const cat = category && category !== "All" ? category : null;
      const avail =
        availabilityFilter && availabilityFilter !== "All"
          ? availabilityFilter
          : null;
      const books = await actor.searchInventory(searchQuery, cat, avail);
      let mapped = books.filter((b) => !b.isDeleted).map(canisterBookToBook);
      if (edition && edition !== "All")
        mapped = mapped.filter(
          (b) => b.edition?.toLowerCase() === edition.toLowerCase(),
        );
      if (sortBy === "title-asc")
        mapped = [...mapped].sort((a, b) => a.title.localeCompare(b.title));
      else if (sortBy === "title-desc")
        mapped = [...mapped].sort((a, b) => b.title.localeCompare(a.title));
      else if (sortBy === "author-asc")
        mapped = [...mapped].sort((a, b) => a.author.localeCompare(b.author));
      else if (sortBy === "newest") mapped = [...mapped].reverse();
      return mapped;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBook() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (input: BookInput) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.addBook(
        adminToken,
        input.title,
        input.author,
        input.edition ?? "",
        input.publisher ?? "",
        input.category,
        BigInt(input.quantity),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterBookToBook(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      bookId,
      title,
      author,
      edition,
      publisher,
      category,
      quantity,
      availableCount,
    }: {
      bookId: string;
      title: string;
      author: string;
      edition: string;
      publisher: string;
      category: string;
      quantity: bigint | number;
      availableCount: bigint | number;
    }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.updateBook(
        adminToken,
        bookId,
        title,
        author,
        edition,
        publisher,
        category,
        BigInt(quantity),
        BigInt(availableCount),
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterBookToBook(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (bookId: string) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.deleteBook(adminToken, bookId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useSeedBooks() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (books: BookInput[]) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const booksInput: CanisterBookInput[] = books.map((b) => ({
        title: b.title,
        author: b.author,
        edition: b.edition ?? "",
        publisher: b.publisher ?? "",
        category: b.category ?? "",
        quantity: BigInt(b.quantity),
      }));
      const result = await actor.seedBooks(adminToken, booksInput);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useImportBooksFromCsv() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (rows: BookCsvRow[]): Promise<CsvImportResult> => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const canisterRows: CanisterBookCsvRow[] = rows.map((r) => ({
        title: r.title,
        author: r.author,
        edition: r.edition ?? "",
        publisher: r.publisher ?? "",
        category: r.category ?? "",
        totalCopies: BigInt(r.quantity ?? 1),
        availableCopies: BigInt(r.quantity ?? 1),
      }));
      const result = await actor.importBooksFromCsv(adminToken, canisterRows);
      if (result.__kind__ === "err") throw new Error(result.err);
      return {
        inserted: Number(result.ok.processed),
        skipped: Number(result.ok.skipped),
        errors: result.ok.errors,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ─── Book Availability & Reservations ────────────────────────────────────────

export function useCheckBookAvailability(bookId: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<BookAvailability | null>({
    queryKey: ["bookAvailability", bookId],
    queryFn: async () => {
      if (!actor || !bookId) return null;
      const result = await actor.checkBookAvailability(bookId);
      if (result.__kind__ === "err") return null;
      const r = result.ok;
      return {
        available: r.available,
        expectedReturnDate: r.expectedReturnDate
          ? Number(r.expectedReturnDate) / 1_000_000
          : undefined,
        waitingCount: Number(r.waitingCount),
        daysUntilReturn: r.daysUntilReturn
          ? Number(r.daysUntilReturn)
          : undefined,
      };
    },
    enabled: !!actor && !isFetching && !!bookId,
    staleTime: 30_000,
  });
}

export function useCreateBookReservation() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      bookId,
      expectedAvailabilityDate,
    }: {
      bookId: string;
      expectedAvailabilityDate?: number;
    }): Promise<Reservation & { queuePosition: number }> => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated");
      if (!actor) throw new Error("Canister not ready");
      const ts = expectedAvailabilityDate
        ? BigInt(Math.round(expectedAvailabilityDate * 1_000_000))
        : null;
      const result = await actor.createBookReservation(token, bookId, ts);
      if (result.__kind__ === "err") throw new Error(result.err);
      // Derive queue position from waiting list for this book
      let queuePosition = 1;
      try {
        const allForBook = await actor.getReservationsForBook(bookId);
        const waitingCount = allForBook.filter(
          (r) => (r.status as string) === "Waiting",
        ).length;
        queuePosition = waitingCount;
      } catch {
        // non-fatal
      }
      return {
        ...canisterReservationToReservation(result.ok),
        queuePosition,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myReservations"] });
      qc.invalidateQueries({ queryKey: ["bookAvailability"] });
    },
  });
}

export function useGetMyReservations() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Reservation[]>({
    queryKey: ["myReservations"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return [];
      const reservations = await actor.getMyReservations(token);
      return reservations.map(canisterReservationToReservation);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useGetReservationsForBook(bookId: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Reservation[]>({
    queryKey: ["reservationsForBook", bookId],
    queryFn: async () => {
      if (!actor || !bookId) return [];
      const reservations = await actor.getReservationsForBook(bookId);
      return reservations.map(canisterReservationToReservation);
    },
    enabled: !!actor && !isFetching && !!bookId,
    staleTime: 60_000,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetMyNotifications() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Notification[]>({
    queryKey: ["myNotifications"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return [];
      const notifications = await actor.getMyNotifications(token);
      return notifications
        .map(canisterNotificationToNotification)
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

export function useGetUnreadCount() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<number>({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return 0;
      const count = await actor.getUnreadCount(token);
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (notifId: string) => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.markNotificationRead(token, notifId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myNotifications"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async () => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.markAllNotificationsRead(token);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myNotifications"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

// ─── Procurement Requests ─────────────────────────────────────────────────────

/** Create urgent procurement when student needs book immediately */
export function useCreateUrgentProcurement() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      bookTitle,
      bookId,
      author,
      edition,
      publisher,
    }: {
      bookTitle: string;
      bookId?: string;
      author?: string;
      edition?: string;
      publisher?: string;
    }): Promise<ProcurementRequest> => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.createUrgentProcurementRequest(
        token,
        bookTitle,
        bookId ?? null,
        author ?? null,
        edition ?? null,
        publisher ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterProcurementToProcurement(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProcurements"] });
      qc.invalidateQueries({ queryKey: ["allProcurements"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useCreateProcurementRequest() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      bookTitle,
      bookId,
      author,
      edition,
      publisher,
      urgency,
    }: {
      bookTitle: string;
      bookId?: string;
      author?: string;
      edition?: string;
      publisher?: string;
      urgency: "Required" | "Optional";
    }): Promise<ProcurementRequest> => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated");
      if (!actor) throw new Error("Canister not ready");
      const canisterUrgency = urgency as unknown as ProcurementUrgency;
      const result = await actor.createProcurementRequest(
        token,
        bookTitle,
        bookId ?? null,
        author ?? null,
        edition ?? null,
        publisher ?? null,
        canisterUrgency,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterProcurementToProcurement(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProcurements"] });
      qc.invalidateQueries({ queryKey: ["allProcurements"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useGetMyProcurements() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<ProcurementRequest[]>({
    queryKey: ["myProcurements"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return [];
      const procurements = await actor.getMyProcurements(token);
      return procurements.map(canisterProcurementToProcurement);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useGetAllProcurements() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<ProcurementRequest[]>({
    queryKey: ["allProcurements"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const procurements = await actor.getAllProcurements(adminToken);
      return procurements.map(canisterProcurementToProcurement);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export function useUpdateProcurementStatus() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      procurementId,
      status,
    }: {
      procurementId: string;
      status:
        | "Pending"
        | "Ordered"
        | "Procured"
        | "ReadyForCollection"
        | "Issued"
        | "Cancelled";
    }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const canisterStatus = status as unknown as ProcurementStatus;
      const result = await actor.updateProcurementStatus(
        adminToken,
        procurementId,
        canisterStatus,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allProcurements"] });
      qc.invalidateQueries({ queryKey: ["myProcurements"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ─── Inventory Lifecycle ──────────────────────────────────────────────────────

export function useGetInventoryLifecycle() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<InventoryLifecycleItem[]>({
    queryKey: ["inventoryLifecycle"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const items = await actor.getInventoryLifecycle(adminToken);
      return items.map((item) => ({
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        author: item.author,
        edition: item.edition,
        publisher: item.publisher,
        totalQuantity: Number(item.totalQuantity),
        availableCount: Number(item.availableCount),
        currentHolders: item.currentHolders.map((h) => ({
          studentId: h.studentId,
          studentName: h.studentName,
          issueDate: new Date(Number(h.issueDate) / 1_000_000).toISOString(),
          expectedReturnDate: new Date(
            Number(h.expectedReturnDate) / 1_000_000,
          ).toISOString(),
        })),
        waitingQueue: item.waitingQueue.map((w) => ({
          studentId: w.studentId,
          studentName: w.studentName,
          reservationDate: new Date(
            Number(w.reservationDate) / 1_000_000,
          ).toISOString(),
        })),
        procurementRequests: item.procurementRequests.map(
          canisterProcurementToProcurement,
        ),
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export function useGetBooksReturningByDate(days = 7) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<BookReturningEntry[]>({
    queryKey: ["booksReturningByDate", days],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const entries = await actor.getBooksReturningByDate(
        adminToken,
        BigInt(days),
      );
      return entries.map((e) => ({
        requestId: e.requestId,
        bookId: e.bookId,
        bookTitle: e.bookTitle,
        studentId: e.studentId,
        studentName: e.studentName,
        returnDate: new Date(Number(e.returnDate) / 1_000_000).toISOString(),
        daysUntilReturn: Number(e.daysUntilReturn),
        nextReservedStudent: e.nextReservedStudent
          ? {
              studentId: e.nextReservedStudent.studentId,
              studentName: e.nextReservedStudent.studentName,
            }
          : undefined,
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  });
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export function useTransferBook() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      fromStudentId,
      toStudentId,
      bookId,
      adminNotes,
    }: {
      fromStudentId: string;
      toStudentId: string;
      bookId: string;
      adminNotes?: string;
    }): Promise<Transfer> => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.transferBook(
        adminToken,
        fromStudentId,
        toStudentId,
        bookId,
        adminNotes ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterTransferToTransfer(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transferHistory"] });
      qc.invalidateQueries({ queryKey: ["inventoryLifecycle"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useGetTransferHistory() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Transfer[]>({
    queryKey: ["transferHistory"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const transfers = await actor.getTransferHistory(adminToken);
      return transfers.map(canisterTransferToTransfer);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
  });
}

export function useGetTransfersForBook(bookId: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<Transfer[]>({
    queryKey: ["transfersForBook", bookId],
    queryFn: async () => {
      if (!actor || !bookId) return [];
      const transfers = await actor.getTransfersForBook(bookId);
      return transfers.map(canisterTransferToTransfer);
    },
    enabled: !!actor && !isFetching && !!bookId,
  });
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export function useMyRequests() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<BookRequest[]>({
    queryKey: ["myRequests"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return [];
      const requests = await actor.getMyRequests(token);
      return requests.map(canisterRequestToBookRequest);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export function useAllRequests() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<BookRequest[]>({
    queryKey: ["allRequests"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const requests = await actor.getAllRequests(adminToken);
      return requests.map(canisterRequestToBookRequest);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export function useSearchRequests(
  searchQuery: string,
  statusFilter: string | null,
  course: string | null,
) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<BookRequest[]>({
    queryKey: ["requests", "search", searchQuery, statusFilter, course],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const status =
        statusFilter && statusFilter !== "All" ? statusFilter : null;
      const c = course && course !== "All" ? course : null;
      const requests = await actor.searchRequests(
        adminToken,
        searchQuery,
        status,
        c,
      );
      return requests.map(canisterRequestToBookRequest);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });
}

export function useGetMyIssuedBooks() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<BookRequest[]>({
    queryKey: ["myIssuedBooks"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return [];
      const requests = await actor.getMyIssuedBooks(token);
      return requests.map(canisterRequestToBookRequest);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBookRequest() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      selectedBookIds,
      requestedBooks,
    }: {
      selectedBookIds: string[];
      requestedBooks: RequestedBookPublic[];
    }) => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const reqBooks: CanisterRequestedBookPublic[] = requestedBooks.map(
        (rb) => ({
          title: rb.title,
          author: rb.author ?? "",
          edition: rb.edition ?? "",
          publisher: rb.publisher ?? "",
          imageUrl: rb.imageUrl ?? "",
        }),
      );
      const result = await actor.createBookRequest(
        token,
        selectedBookIds,
        reqBooks,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterRequestToBookRequest(result.ok);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myRequests"] }),
  });
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: { requestId: string; status: string }) => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.updateRequestStatus(
        adminToken,
        requestId,
        status,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterRequestToBookRequest(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ─── Challans ─────────────────────────────────────────────────────────────────

export interface ChallanResult {
  challanData: Record<string, unknown>;
  qrCodeDataUrl: string;
  requestId: string;
}

export function useCreateChallan() {
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (requestId: string): Promise<ChallanResult> => {
      const token = getStudentToken();
      if (!token) throw new Error("Not authenticated");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.getRequestById(token, requestId);
      if (result.__kind__ === "err") throw new Error(result.err);
      const req = result.ok;
      const userId = req.userId;
      const qrUrl = `${window.location.origin}/student/qr/${userId}`;
      return {
        challanData: {
          requestId: req.requestId,
          studentName: req.studentName,
          studentAadhaar: req.studentAadhaar,
          studentCourse: req.studentCourse,
          selectedBookIds: req.selectedBookIds,
          requestedBooks: req.requestedBooks,
          status: req.status,
          createdAt: req.createdAt,
        },
        qrCodeDataUrl: qrUrl,
        requestId,
      };
    },
  });
}

export function useMarkBookReturned() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.markBookReturned(adminToken, requestId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return canisterRequestToBookRequest(result.ok);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ─── Users / Students ─────────────────────────────────────────────────────────

export function useAllUsers() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery<User[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const users = await actor.getAllUsers(adminToken);
      return users.map(userPublicToUser);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
    refetchInterval: isVisible ? 30_000 : false,
  });
}

export function useSearchStudents(
  searchQuery: string,
  course: string | null,
  membershipStatus: string | null,
) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<User[]>({
    queryKey: ["students", "search", searchQuery, course, membershipStatus],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const c = course && course !== "All" ? course : null;
      const ms =
        membershipStatus && membershipStatus !== "All"
          ? membershipStatus
          : null;
      const users = await actor.searchStudents(adminToken, searchQuery, c, ms);
      return users.map(userPublicToUser);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });
}

export function useRegisterUser() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      name,
      aadhaarNumber,
      otp,
      phone,
      course,
      college,
    }: {
      name: string;
      aadhaarNumber: string;
      otp: string;
      phone: string;
      course: string;
      college?: string;
      profileImageFile?: File;
    }) => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.studentSignupAndPay(
        aadhaarNumber,
        otp,
        name,
        phone,
        course,
        college ?? "",
        "",
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      const user = userPublicToUser(result.ok.user);
      return { token: result.ok.token, user, userId: user._id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUser"] }),
  });
}

export function useGetStudentProfile(userId: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<User | null>({
    queryKey: ["studentProfile", userId],
    queryFn: async () => {
      if (!userId || !actor) return null;
      const result = await actor.getStudentProfile(userId);
      return result ? userPublicToUser(result) : null;
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export function useAdminLogin() {
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: { username: string; password: string }) => {
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.adminLogin(username, password);
      if (result.__kind__ === "err") throw new Error(result.err);
      return { token: result.ok.token, expiresAt: result.ok.expiresAt };
    },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useAnalyticsData() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<AnalyticsData | null>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const data = await actor.getAnalyticsData(adminToken);
      return canisterAnalyticsToAnalytics(data);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

// ─── Return Timeline ──────────────────────────────────────────────────────────

export function useGetReturnTimeline() {
  const { actor, isFetching } = useAnonActor();
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return useQuery({
    queryKey: ["returnTimeline"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const entries = await actor.getReturnTimeline(adminToken);
      return entries.map(canisterTimelineToItem);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: isVisible ? 30_000 : false,
    retry: false,
  });
}

export function useSetReturnDate() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      returnDate,
    }: { requestId: string; returnDate: bigint | string }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const ts =
        typeof returnDate === "bigint"
          ? returnDate
          : BigInt(new Date(String(returnDate)).getTime()) * BigInt(1_000_000);
      const result = await actor.setReturnDate(adminToken, requestId, ts);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returnTimeline"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

export function useUpdateIssuedBookStatus() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      returned,
    }: { requestId: string; returned: boolean }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.updateIssuedBookStatus(
        adminToken,
        requestId,
        returned,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returnTimeline"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function usePaymentStatus() {
  const { actor, isFetching } = useAnonActor();
  return useQuery({
    queryKey: ["paymentStatus"],
    queryFn: async () => {
      const token = getStudentToken();
      if (!token || !actor) return null;
      try {
        const result = await actor.getPaymentStatus(token);
        if (result.__kind__ === "err") return null;
        const p = result.ok;
        return {
          _id: p.paymentId,
          userId: p.userId,
          amount: Number(p.amount),
          status: p.status,
          createdAt: new Date(Number(p.createdAt) / 1_000_000).toISOString(),
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async ({
      successUrl,
      cancelUrl: _cancelUrl,
    }: { successUrl: string; cancelUrl: string }) => {
      // Demo mode: return fake URL immediately
      return `${successUrl}?demo=true`;
    },
  });
}

// ─── Collection Queue ───────────────────────────────────────────────────────

export function useGetCollectionQueue() {
  const { actor, isFetching } = useAnonActor();
  return useQuery({
    queryKey: ["collectionQueue"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      return await actor.getCollectionQueue(adminToken);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export function useGetAuditLog() {
  const { actor, isFetching } = useAnonActor();
  return useQuery({
    queryKey: ["auditLog"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.getAuditLog(
        adminToken,
        null,
        null,
        null,
        null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });
}

// ─── Analytics Data (enhanced) ──────────────────────────────────────────────

export function useGetAnalyticsData() {
  const { actor, isFetching } = useAnonActor();
  return useQuery({
    queryKey: ["analyticsData"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const data = await actor.getAnalyticsData(adminToken);
      return canisterAnalyticsToAnalytics(data);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    retry: false,
  });
}

// ─── Complete Approval (Finalize Request with collection details) ─────────────

export function useCompleteApproval() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      collectionDate,
      collectionTime,
      collectionLocation,
      adminName,
    }: {
      requestId: string;
      collectionDate: string;
      collectionTime: string;
      collectionLocation: string;
      adminName: string;
    }) => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.completeApproval(
        adminToken,
        requestId,
        collectionDate,
        collectionTime,
        collectionLocation,
        adminName,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["collectionOrders"] });
    },
  });
}

export function useGetAllCollectionOrders() {
  const { actor, isFetching } = useAnonActor();
  return useQuery<CollectionOrder[]>({
    queryKey: ["collectionOrders"],
    queryFn: async () => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const orders = await actor.getAllCollectionOrders(adminToken);
      return orders.map((o) => ({
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        collectionDate: o.collectionDate,
        collectionTime: o.collectionTime,
        collectionLocation: o.collectionLocation,
        bookDecisions: o.bookDecisions.map((bd) => ({
          bookId: bd.bookId,
          bookName: bd.bookName,
          bookNumber: bd.bookNumber,
          inventoryId: bd.inventoryId,
          decision:
            bd.decision as CollectionOrder["bookDecisions"][number]["decision"],
          reason: bd.reason ?? undefined,
          expectedReturnDate: bd.expectedReturnDate
            ? new Date(Number(bd.expectedReturnDate) / 1_000_000).toISOString()
            : undefined,
          currentHolder: bd.currentHolder ?? undefined,
          procurementCreated: bd.procurementCreated,
        })),
        studentId: o.studentId,
        studentName: o.studentName,
        requestId: o.requestId,
        adminName: o.adminName,
        generatedAt: new Date(Number(o.generatedAt) / 1_000_000).toISOString(),
        challanId: o.challanId ?? undefined,
        studentEmail: o.studentEmail,
        studentPhone: o.studentPhone,
        studentCourse: o.studentCourse,
        status: o.status as string,
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false,
  });
}

export function useGetCollectionOrderForRequest(requestId: string) {
  const { actor, isFetching } = useAnonActor();
  const studentToken =
    localStorage.getItem("svga_token") ||
    (() => {
      try {
        const raw = localStorage.getItem("svga_student_session");
        if (!raw) return "";
        const s = JSON.parse(raw) as { token: string; expiresAt: number };
        if (Date.now() > s.expiresAt) return "";
        return s.token ?? "";
      } catch {
        return "";
      }
    })();
  return useQuery<CollectionOrder | null>({
    queryKey: ["collectionOrder", requestId],
    queryFn: async () => {
      if (!requestId || !actor) return null;
      const token = getAdminToken() || studentToken;
      if (!token) return null;
      const result = await actor.getCollectionOrder(token, requestId);
      if (result.__kind__ === "err") return null;
      const o = result.ok;
      return {
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        collectionDate: o.collectionDate,
        collectionTime: o.collectionTime,
        collectionLocation: o.collectionLocation,
        bookDecisions: o.bookDecisions.map((bd) => ({
          bookId: bd.bookId,
          bookName: bd.bookName,
          bookNumber: bd.bookNumber,
          inventoryId: bd.inventoryId,
          decision:
            bd.decision as CollectionOrder["bookDecisions"][number]["decision"],
          reason: bd.reason ?? undefined,
          expectedReturnDate: bd.expectedReturnDate
            ? new Date(Number(bd.expectedReturnDate) / 1_000_000).toISOString()
            : undefined,
          currentHolder: bd.currentHolder ?? undefined,
          procurementCreated: bd.procurementCreated,
        })),
        studentId: o.studentId,
        studentName: o.studentName,
        requestId: o.requestId,
        adminName: o.adminName,
        generatedAt: new Date(Number(o.generatedAt) / 1_000_000).toISOString(),
        challanId: o.challanId ?? undefined,
        studentEmail: o.studentEmail,
        studentPhone: o.studentPhone,
        studentCourse: o.studentCourse,
        status: o.status as string,
      };
    },
    enabled: !!requestId && !!actor && !isFetching,
    staleTime: 0,
    retry: false,
    refetchInterval: 10000,
  });
}

// ─── Request Details & Per-Book Actions ─────────────────────────────────────

export interface BookDetailItem {
  bookId: string;
  title: string;
  bookNumber: string;
  inventoryId: string;
  subject: string;
  edition: string;
  author: string;
  publisher: string;
  availabilityStatus: string;
  currentHolder?: string;
  expectedReturnDate?: string;
  queueLength: number;
  decision?: string;
}

// Converts a Motoko variant like { Approved: null } or a plain string to a lowercase status string
function toDecisionStatus(d: unknown): string | undefined {
  if (!d) return undefined;
  if (typeof d === "string") return d.toLowerCase();
  if (typeof d === "object" && d !== null) {
    const key = Object.keys(d)[0];
    return key ? key.toLowerCase() : undefined;
  }
  return undefined;
}

function normalizeManualBookStatus(status: string): string {
  const raw = String(status ?? "").trim().toLowerCase();
  switch (raw) {
    case "requested":
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "ordered":
      return "Ordered";
    case "arrived":
    case "reached office":
    case "reachedoffice":
      return "Arrived";
    case "readyforcollection":
    case "ready_for_collection":
      return "ReadyForCollection";
    case "issued":
    case "collected":
      return "Issued";
    case "returned":
      return "Returned";
    case "procured":
      return "Procured";
    case "specialorder":
      return "SpecialOrder";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function canisterBookDetailToItem(b: CanisterBookDetailView): BookDetailItem {
  return {
    bookId: b.bookId,
    title: b.title,
    bookNumber: b.bookNumber,
    inventoryId: b.inventoryId,
    subject: b.subject,
    edition: b.edition,
    author: b.author,
    publisher: b.publisher,
    availabilityStatus: b.availabilityStatus,
    currentHolder: b.currentHolder ?? undefined,
    expectedReturnDate: b.expectedReturnDate
      ? new Date(Number(b.expectedReturnDate) / 1_000_000).toISOString()
      : undefined,
    queueLength: Number(b.queueLength),
    decision: b.decision ? toDecisionStatus(b.decision) : undefined,
  };
}

export interface RequestDetailsQueryResult {
  books: BookDetailItem[];
  request: BookRequest;
}

export function useGetRequestDetails(requestId: string) {
  const { actor, isFetching } = useAnonActor();
  return useQuery<RequestDetailsQueryResult>({
    queryKey: ["requestDetails", requestId],
    queryFn: async () => {
      if (!actor || !requestId) throw new Error("Actor not ready");
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      const result = await actor.getRequestDetails(adminToken, requestId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return {
        books: result.ok.books.map(canisterBookDetailToItem),
        request: canisterRequestToBookRequest(result.ok.request),
      };
    },
    enabled: !!actor && !isFetching && !!requestId,
    staleTime: 0,
    retry: false,
  });
}

export function useApproveBook() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      bookId,
    }: { requestId: string; bookId: string }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.approveBook(adminToken, requestId, bookId);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onMutate: async ({ requestId, bookId }) => {
      await qc.cancelQueries({ queryKey: ["requestDetails", requestId] });
      const previous = qc.getQueryData<RequestDetailsQueryResult>([
        "requestDetails",
        requestId,
      ]);
      if (previous) {
        qc.setQueryData<RequestDetailsQueryResult>(
          ["requestDetails", requestId],
          {
            ...previous,
            books: previous.books.map((b) =>
              b.bookId === bookId ? { ...b, decision: "approved" } : b,
            ),
          },
        );
      }
      return { previous };
    },
    onError: (_err, { requestId }, context) => {
      if (context?.previous) {
        qc.setQueryData(["requestDetails", requestId], context.previous);
      }
    },
    onSettled: (_data, _err, { requestId }) => {
      qc.invalidateQueries({ queryKey: ["requestDetails", requestId] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useRejectBook() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      bookId,
      reason,
    }: { requestId: string; bookId: string; reason?: string }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.rejectBook(
        adminToken,
        requestId,
        bookId,
        reason ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onMutate: async ({ requestId, bookId }) => {
      await qc.cancelQueries({ queryKey: ["requestDetails", requestId] });
      const previous = qc.getQueryData<RequestDetailsQueryResult>([
        "requestDetails",
        requestId,
      ]);
      if (previous) {
        qc.setQueryData<RequestDetailsQueryResult>(
          ["requestDetails", requestId],
          {
            ...previous,
            books: previous.books.map((b) =>
              b.bookId === bookId ? { ...b, decision: "rejected" } : b,
            ),
          },
        );
      }
      return { previous };
    },
    onError: (_err, { requestId }, context) => {
      if (context?.previous) {
        qc.setQueryData(["requestDetails", requestId], context.previous);
      }
    },
    onSettled: (_data, _err, { requestId }) => {
      qc.invalidateQueries({ queryKey: ["requestDetails", requestId] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useReserveBookForRequest() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      requestId,
      bookId,
      expectedAvailabilityDate,
    }: {
      requestId: string;
      bookId: string;
      expectedAvailabilityDate?: string;
    }) => {
      const adminToken = getAdminToken();
      if (!adminToken) throw new Error("Admin session expired");
      if (!actor) throw new Error("Canister not ready");
      const ts = expectedAvailabilityDate
        ? BigInt(Date.parse(expectedAvailabilityDate) * 1_000_000)
        : null;
      const result = await actor.reserveBook(adminToken, requestId, bookId, ts);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_data, { requestId }) => {
      qc.invalidateQueries({ queryKey: ["requestDetails", requestId] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["bookAvailability"] });
    },
  });
}

// ─── Update Student ───────────────────────────────────────────────────────────

export function useUpdateStudent() {
  const qc = useQueryClient();
  const { actor } = useAnonActor();
  return useMutation({
    mutationFn: async ({
      userId,
      firstName,
      middleName,
      grandFatherName,
      surname,
      phone,
      aadhaar,
      course,
      academicYear,
      membershipStatusText,
      issueStatusText,
    }: {
      userId: string;
      firstName: string;
      middleName: string;
      grandFatherName: string;
      surname: string;
      phone: string;
      aadhaar: string;
      course: string;
      academicYear: string;
      membershipStatusText: string;
      issueStatusText: string;
    }) => {
      const adminToken = getAdminToken();
      if (!adminToken)
        throw new Error("Admin session expired — please log in again");
      if (!actor) throw new Error("Canister not ready");
      const result = await actor.updateStudent(
        adminToken,
        userId,
        firstName,
        middleName,
        grandFatherName,
        surname,
        phone,
        aadhaar,
        course,
        academicYear,
        membershipStatusText,
        issueStatusText,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
      qc.invalidateQueries({ queryKey: ["analyticsData"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
// ─── Admin Pending Requests ──────────────────────────────────────────────────

export interface AdminPendingRequestSummary {
  requestId: string;
  studentId: string;
  studentName: string;
  phoneNumber: string;
  course: string;
  requestDate: bigint;
  totalBooksCount: bigint;
  status: string;
}

export function useAdminPendingRequests() {
  const { actor, isFetching } = useAnonActor();
  const adminToken = getAdminToken();
  return useQuery<AdminPendingRequestSummary[]>({
    queryKey: ["adminPendingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return (await actor.getPendingRequests(
        adminToken,
      )) as AdminPendingRequestSummary[];
    },
    enabled: !!actor && !isFetching && !!adminToken,
    refetchInterval: 30000,
  });
}

// ─── Completed Forms ─────────────────────────────────────────────────────────

export function useCompletedForms() {
  const { actor, isFetching } = useAnonActor();
  const adminToken = getAdminToken();
  return useQuery<BookRequest[]>({
    queryKey: ["completedForms"],
    queryFn: async () => {
      if (!actor) return [];
      const raw = await actor.getCompletedForms(adminToken);
      return raw as unknown as BookRequest[];
    },
    enabled: !!actor && !isFetching && !!adminToken,
  });
}

// ─── Manual Books To Purchase ────────────────────────────────────────────────

export interface ManualBookToPurchase {
  requestId: string;
  studentId: string;
  studentName: string;
  studentCourse: string;
  studentYear: string;
  studentPhone: string;
  collectionDate: string;
  collectionTime: string;
  collectionLocation: string;
  requestNumber: string;
  manualIndex: number;
  procurement: ProcurementRequest;
  challanId?: string;
}

export function useManualBooksToPurchase() {
  const { actor, isFetching } = useAnonActor();
  const adminToken = getAdminToken();
  return useQuery<ManualBookToPurchase[]>({
    queryKey: ["manualBooksToPurchase"],
    queryFn: async () => {
      if (!actor) return [];
      return (await actor.getManualBooksToPurchase(
        adminToken,
      )) as unknown as ManualBookToPurchase[];
    },
    enabled: !!actor && !isFetching && !!adminToken,
  });
}

// ─── Update Manual Book Status ───────────────────────────────────────────────

export function useUpdateManualBookStatus() {
  const { actor } = useAnonActor();
  const adminToken = getAdminToken();
  const qc = useQueryClient();

  const parseManualIndex = (bookTitle: string) => {
    if (!bookTitle.startsWith("manual:")) return null;
    const parts = bookTitle.split(":");
    const index = Number(parts[1]);
    return Number.isNaN(index) ? null : index;
  };

  const normalizeManualStatus = (status: string): BookDecisionStatus => {
    const raw = String(status ?? "").trim().toLowerCase();
    switch (raw) {
      case "requested":
      case "pending":
        return "Pending" as BookDecisionStatus;
      case "approved":
        return "Approved" as BookDecisionStatus;
      case "ordered":
        return "Ordered" as BookDecisionStatus;
      case "arrived":
      case "reached office":
      case "reachedoffice":
        return "Arrived" as BookDecisionStatus;
      case "readyforcollection":
      case "ready_for_collection":
        return "ReadyForCollection" as BookDecisionStatus;
      case "issued":
      case "collected":
        return "Issued" as BookDecisionStatus;
      case "returned":
        return "Returned" as BookDecisionStatus;
      case "procured":
        return "Procured" as BookDecisionStatus;
      case "specialorder":
        return "SpecialOrder" as BookDecisionStatus;
      case "rejected":
        return "Rejected" as BookDecisionStatus;
      default:
        return "Pending" as BookDecisionStatus;
    }
  };

  const normalizeManualProcurementStatus = (
    status: BookDecisionStatus,
  ): ProcurementRequest["status"] | null => {
    const raw = String(status ?? "").trim().toLowerCase();
    switch (raw) {
      case "requested":
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "ordered":
        return "Ordered";
      case "arrived":
      case "reached office":
      case "reachedoffice":
        return "Arrived";
      case "readyforcollection":
      case "ready_for_collection":
        return "ReadyForCollection";
      case "issued":
      case "collected":
        return "Issued";
      case "returned":
        return "Returned";
      case "procured":
        return "Procured";
      default:
        return null;
    }
  };

  return useMutation({
    mutationFn: async ({
      requestId,
      bookTitle,
      newStatus,
    }: {
      requestId: string;
      bookTitle: string;
      newStatus: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const canonicalStatus = normalizeManualStatus(newStatus);
      const result = await actor.updateManualBookStatus(
        adminToken,
        requestId,
        bookTitle,
        canonicalStatus as unknown as BookDecisionStatus,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onMutate: async ({ requestId, bookTitle, newStatus }) => {
      await qc.cancelQueries({ queryKey: ["requestDetails", requestId] });
      await qc.cancelQueries({ queryKey: ["manualBooksToPurchase"] });

      const previousRequestDetails = qc.getQueryData<RequestDetailsQueryResult>([
        "requestDetails",
        requestId,
      ]);
      const previousManualBooks = qc.getQueryData<ManualBookToPurchase[]>([
        "manualBooksToPurchase",
      ]);

      if (previousRequestDetails) {
        const manualIndex = parseManualIndex(bookTitle);
        const canonicalStatus = normalizeManualStatus(newStatus);
        if (manualIndex !== null) {
          qc.setQueryData<RequestDetailsQueryResult>(
            ["requestDetails", requestId],
            {
              ...previousRequestDetails,
              request: {
                ...previousRequestDetails.request,
                requestedBooks: previousRequestDetails.request.requestedBooks.map(
                  (book, index) =>
                    index === manualIndex
                      ? { ...book, decision: canonicalStatus }
                      : book,
                ),
              },
            },
          );
        }
      }

      if (previousManualBooks) {
        const manualIndex = parseManualIndex(bookTitle);
        const canonicalStatus = normalizeManualStatus(newStatus);
        const procurementStatus = normalizeManualProcurementStatus(canonicalStatus);
        qc.setQueryData<ManualBookToPurchase[]>(
          ["manualBooksToPurchase"],
          previousManualBooks.map((item) => {
            if (item.requestId !== requestId || manualIndex === null) return item;
            if (!procurementStatus) return item;
            return {
              ...item,
              procurement: {
                ...item.procurement,
                status: procurementStatus,
              },
            };
          }),
        );
      }

      return { previousRequestDetails, previousManualBooks };
    },
    onError: (_err, { requestId }, context) => {
      if (context?.previousRequestDetails) {
        qc.setQueryData([
          "requestDetails",
          requestId,
        ], context.previousRequestDetails);
      }
      if (context?.previousManualBooks) {
        qc.setQueryData([
          "manualBooksToPurchase"], context.previousManualBooks);
      }
    },
    onSettled: (_data, _err, { requestId }) => {
      qc.invalidateQueries({ queryKey: ["manualBooksToPurchase"] });
      qc.invalidateQueries({ queryKey: ["completedForms"] });
      qc.invalidateQueries({ queryKey: ["adminPendingRequests"] });
      qc.invalidateQueries({ queryKey: ["requestDetails", requestId] });
    },
  });
}
