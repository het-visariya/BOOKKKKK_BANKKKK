/**
 * api.ts -- SVGA Book Bank API service layer
 *
 * This file provides HTTP-style API methods that map to canister/backend
 * operations. When an external REST backend is added (Firebase Functions,
 * Express, etc.), only this file needs changing -- all hooks import from here.
 *
 * OTP/SMS/WhatsApp: full infrastructure is ready.
 * Add API keys via environment variables to activate real delivery:
 *   VITE_MSG91_API_KEY       -- MSG91 SMS provider
 *   VITE_TWILIO_ACCOUNT_SID  -- Twilio SID (SMS + WhatsApp)
 *   VITE_TWILIO_AUTH_TOKEN   -- Twilio auth token
 *   VITE_TWILIO_FROM_NUMBER  -- Twilio phone number
 *   VITE_SENDGRID_API_KEY    -- SendGrid email delivery
 */

import type {
  NotificationChannel,
  NotificationDeliveryRecord,
  NotificationDeliveryStatus,
  NotificationEventType,
  OtpSendResult,
} from "@/hooks/useBackend";
import type { User } from "@/types";

// --- Storage helpers ----------------------------------------------------------

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

// --- OTP API ------------------------------------------------------------------

/**
 * Provider configuration -- add real keys to enable live delivery.
 * All SMS/WhatsApp providers use the same interface; swap provider
 * by changing these values in your .env file.
 */
const SMS_CONFIG = {
  /** MSG91 API key from VITE_MSG91_API_KEY env */
  msg91ApiKey: import.meta.env.VITE_MSG91_API_KEY as string | undefined,
  /** Twilio account SID from VITE_TWILIO_ACCOUNT_SID env */
  twilioAccountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID as
    | string
    | undefined,
  /** Twilio auth token from VITE_TWILIO_AUTH_TOKEN env */
  twilioAuthToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN as string | undefined,
  /** Twilio sender number from VITE_TWILIO_FROM_NUMBER env */
  twilioFrom: import.meta.env.VITE_TWILIO_FROM_NUMBER as string | undefined,
  /** Fast2SMS API key from VITE_FAST2SMS_API_KEY env */
  fast2smsApiKey: import.meta.env.VITE_FAST2SMS_API_KEY as string | undefined,
  /** Whether any real SMS provider is configured */
  get isConfigured() {
    return !!(
      this.msg91ApiKey ||
      (this.twilioAccountSid && this.twilioAuthToken) ||
      this.fast2smsApiKey
    );
  },
};

const EMAIL_CONFIG = {
  /** SendGrid API key from VITE_SENDGRID_API_KEY env */
  sendgridApiKey: import.meta.env.VITE_SENDGRID_API_KEY as string | undefined,
  /** Sender email from VITE_FROM_EMAIL env */
  fromEmail: import.meta.env.VITE_FROM_EMAIL as string | undefined,
  get isConfigured() {
    return !!(this.sendgridApiKey && this.fromEmail);
  },
};

const WHATSAPP_CONFIG = {
  /** Meta WhatsApp API token from VITE_META_WHATSAPP_TOKEN env */
  metaToken: import.meta.env.VITE_META_WHATSAPP_TOKEN as string | undefined,
  /** Meta Phone Number ID from VITE_META_PHONE_NUMBER_ID env */
  metaPhoneId: import.meta.env.VITE_META_PHONE_NUMBER_ID as string | undefined,
  get isConfigured() {
    return !!(this.metaToken && this.metaPhoneId);
  },
};

/**
 * Send OTP via SMS to the student's registered phone number.
 * Falls back to demo mode if no SMS provider is configured.
 */
export async function sendOtpApi(
  phone: string,
  _aadhaarNumber: string,
): Promise<OtpSendResult> {
  // Demo mode: return a predictable OTP (use the canister for real OTP generation)
  if (!SMS_CONFIG.isConfigured) {
    const demoOtp = Math.floor(100_000 + Math.random() * 900_000).toString();
    return {
      success: true,
      otp: demoOtp,
      demo: true,
      message: `Demo OTP for ${phone}: ${demoOtp}`,
    };
  }

  // MSG91 integration
  if (SMS_CONFIG.msg91ApiKey) {
    try {
      const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
      const resp = await fetch("https://api.msg91.com/api/v5/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: SMS_CONFIG.msg91ApiKey,
        },
        body: JSON.stringify({
          mobile: `91${phone}`,
          otp,
          template_id: "svga_otp",
        }),
      });
      if (!resp.ok) throw new Error(`MSG91 error: ${resp.status}`);
      return { success: true, demo: false };
    } catch (err) {
      console.error("MSG91 OTP send failed:", err);
      return { success: false, demo: false, message: String(err) };
    }
  }

  // Twilio integration
  if (
    SMS_CONFIG.twilioAccountSid &&
    SMS_CONFIG.twilioAuthToken &&
    SMS_CONFIG.twilioFrom
  ) {
    try {
      const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
      const credentials = btoa(
        `${SMS_CONFIG.twilioAccountSid}:${SMS_CONFIG.twilioAuthToken}`,
      );
      const body = new URLSearchParams({
        To: `+91${phone}`,
        From: SMS_CONFIG.twilioFrom,
        Body: `Your SVGA Book Bank OTP is: ${otp}. Valid for 10 minutes. Do not share.`,
      });
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${SMS_CONFIG.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );
      if (!resp.ok) throw new Error(`Twilio error: ${resp.status}`);
      return { success: true, demo: false };
    } catch (err) {
      console.error("Twilio OTP send failed:", err);
      return { success: false, demo: false, message: String(err) };
    }
  }

  return { success: false, demo: false, message: "No SMS provider configured" };
}

// --- Email API ----------------------------------------------------------------

export interface EmailPayload {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: Array<{ filename: string; content: string; type: string }>;
}

/**
 * Send a transactional email via SendGrid.
 * Falls back to demo mode if not configured.
 */
export async function sendEmailApi(
  payload: EmailPayload,
): Promise<NotificationDeliveryRecord> {
  const now = new Date().toISOString();
  const recordBase: Omit<NotificationDeliveryRecord, "status" | "providerId"> =
    {
      id: `email_${Date.now()}`,
      userId: "",
      eventType: "registration_success",
      channel: "email" as NotificationChannel,
      sentAt: now,
    };

  if (!EMAIL_CONFIG.isConfigured) {
    console.info("[SVGA Email - Demo]", payload.to, payload.subject);
    return { ...recordBase, status: "demo" as NotificationDeliveryStatus };
  }

  try {
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_CONFIG.sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: EMAIL_CONFIG.fromEmail, name: "SVGA Book Bank" },
        subject: payload.subject,
        content: [
          {
            type: "text/plain",
            value: payload.bodyText ?? payload.bodyHtml,
          },
          { type: "text/html", value: payload.bodyHtml },
        ],
        ...(payload.attachments?.length
          ? { attachments: payload.attachments }
          : {}),
      }),
    });
    if (!resp.ok) throw new Error(`SendGrid error: ${resp.status}`);
    return {
      ...recordBase,
      status: "sent" as NotificationDeliveryStatus,
      providerId: `sg_${Date.now()}`,
    };
  } catch (err) {
    console.error("SendGrid email failed:", err);
    return {
      ...recordBase,
      status: "failed" as NotificationDeliveryStatus,
      error: String(err),
    };
  }
}

// --- WhatsApp API -------------------------------------------------------------

export interface WhatsAppPayload {
  to: string; // phone number e.g. "919876543210"
  message: string;
  templateName?: string;
  templateParams?: string[];
}

/**
 * Send a WhatsApp message via Meta WhatsApp Business API.
 * Falls back to demo mode if not configured.
 */
export async function sendWhatsAppApi(
  payload: WhatsAppPayload,
): Promise<NotificationDeliveryRecord> {
  const now = new Date().toISOString();
  const recordBase: Omit<NotificationDeliveryRecord, "status" | "providerId"> =
    {
      id: `wa_${Date.now()}`,
      userId: "",
      eventType: "registration_success",
      channel: "whatsapp" as NotificationChannel,
      sentAt: now,
    };

  if (!WHATSAPP_CONFIG.isConfigured) {
    console.info("[SVGA WhatsApp - Demo]", payload.to, payload.message);
    return { ...recordBase, status: "demo" as NotificationDeliveryStatus };
  }

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_CONFIG.metaPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_CONFIG.metaToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: payload.to,
          type: payload.templateName ? "template" : "text",
          ...(payload.templateName
            ? {
                template: {
                  name: payload.templateName,
                  language: { code: "en_US" },
                  components: payload.templateParams?.length
                    ? [
                        {
                          type: "body",
                          parameters: payload.templateParams.map((v) => ({
                            type: "text",
                            text: v,
                          })),
                        },
                      ]
                    : [],
                },
              }
            : { text: { body: payload.message } }),
        }),
      },
    );
    if (!resp.ok) throw new Error(`WhatsApp API error: ${resp.status}`);
    const data = (await resp.json()) as {
      messages?: Array<{ id: string }>;
    };
    return {
      ...recordBase,
      status: "sent" as NotificationDeliveryStatus,
      providerId: data.messages?.[0]?.id,
    };
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return {
      ...recordBase,
      status: "failed" as NotificationDeliveryStatus,
      error: String(err),
    };
  }
}

// --- Multi-channel notification dispatcher ------------------------------------

export interface NotificationPayload {
  user: Pick<User, "_id" | "name" | "email" | "phone" | "studentId">;
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  whatsappMessage?: string;
  challanPdf?: string; // base64-encoded PDF
}

/**
 * Dispatch a notification across all requested channels.
 * Channels that are not configured run in demo mode automatically.
 * This is the single entry point for all notification sends.
 */
export async function dispatchNotification(
  payload: NotificationPayload,
): Promise<NotificationDeliveryRecord[]> {
  const results: NotificationDeliveryRecord[] = [];

  type ChannelFn = () => Promise<NotificationDeliveryRecord>;

  const channelFns: Partial<Record<NotificationChannel, ChannelFn>> = {
    email: () =>
      sendEmailApi({
        to: payload.user.email,
        subject: payload.subject,
        bodyHtml: payload.bodyHtml,
        bodyText: payload.bodyText,
        attachments: payload.challanPdf
          ? [
              {
                filename: "challan.pdf",
                content: payload.challanPdf,
                type: "application/pdf",
              },
            ]
          : undefined,
      }),
    sms: async () => {
      const otpResult = await sendOtpApi(payload.user.phone, "");
      return {
        id: `sms_${Date.now()}`,
        userId: payload.user._id,
        eventType: payload.eventType,
        channel: "sms" as NotificationChannel,
        status: (otpResult.success
          ? otpResult.demo
            ? "demo"
            : "sent"
          : "failed") as NotificationDeliveryStatus,
        sentAt: new Date().toISOString(),
        providerId: otpResult.demo ? undefined : `sms_${Date.now()}`,
      };
    },
    whatsapp: () =>
      sendWhatsAppApi({
        to: `91${payload.user.phone}`,
        message: payload.whatsappMessage ?? payload.bodyText ?? payload.subject,
      }),
    website: async () => ({
      id: `website_${Date.now()}`,
      userId: payload.user._id,
      eventType: payload.eventType,
      channel: "website" as NotificationChannel,
      status: "sent" as NotificationDeliveryStatus,
      sentAt: new Date().toISOString(),
    }),
  };

  await Promise.allSettled(
    payload.channels.map(async (channel) => {
      const fn = channelFns[channel];
      if (fn) {
        try {
          const record = await fn();
          results.push({
            ...record,
            userId: payload.user._id,
            eventType: payload.eventType,
          });
        } catch (err) {
          results.push({
            id: `${channel}_${Date.now()}`,
            userId: payload.user._id,
            eventType: payload.eventType,
            channel,
            status: "failed" as NotificationDeliveryStatus,
            sentAt: new Date().toISOString(),
            error: String(err),
          });
        }
      }
    }),
  );

  return results;
}

// --- Registration API helpers -------------------------------------------------

export function buildFullName({
  firstName,
  middleName,
  grandFatherName,
  surname,
}: {
  firstName: string;
  middleName: string;
  grandFatherName: string;
  surname: string;
}): string {
  return [firstName, middleName, grandFatherName, surname]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function getEffectiveSurname(
  surname: string,
  customSurname: string,
  notInList: boolean,
): string {
  return notInList ? customSurname : surname;
}

export function getEffectiveVillage(
  village: string,
  customVillage: string,
  otherVillage: boolean,
): string {
  return otherVillage ? customVillage : village;
}

export function getEffectiveCourse(
  course: string,
  customCourse: string,
): string {
  return course === "Other" ? customCourse : course;
}

// --- Auth API -----------------------------------------------------------------

export interface AadhaarLoginRequest {
  aadhaarNumber: string;
  phone: string;
  email?: string;
}

export interface OtpVerifyRequest {
  aadhaarNumber: string;
  otp: string;
  phone?: string;
  email?: string;
}

export interface AuthApiResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

/**
 * Verify OTP and complete login.
 * Thin wrapper used by components that need a promise-based API
 * rather than the React Query mutation pattern.
 */
export async function verifyOtpAndLogin(
  request: OtpVerifyRequest,
  actorFn: (
    aadhaar: string,
    otp: string,
    name: string,
    phone: string,
    course: string,
    college: string,
  ) => Promise<unknown>,
): Promise<AuthApiResponse> {
  try {
    const result = (await actorFn(
      request.aadhaarNumber,
      request.otp,
      "",
      request.phone ?? "",
      "",
      "",
    )) as {
      __kind__: string;
      ok?: { token: string; user: User };
      err?: string;
    };
    if (result.__kind__ === "err") return { success: false, error: result.err };
    return { success: true, token: result.ok?.token, user: result.ok?.user };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// --- Challan API --------------------------------------------------------------

export interface ChallanSendPayload {
  studentId: string;
  challanId: string;
  challanPdfBase64: string;
  studentEmail: string;
  studentPhone: string;
  studentName: string;
  channels: NotificationChannel[];
}

/**
 * After generating a challan, email + WhatsApp it to the student.
 */
export async function sendChallanNotification(
  payload: ChallanSendPayload,
): Promise<NotificationDeliveryRecord[]> {
  const authToken = getStudentToken() || getAdminToken();
  if (!authToken) throw new Error("Not authenticated");

  const user: Pick<User, "_id" | "name" | "email" | "phone" | "studentId"> = {
    _id: payload.studentId,
    name: payload.studentName,
    email: payload.studentEmail,
    phone: payload.studentPhone,
    studentId: payload.studentId,
  };

  return dispatchNotification({
    user,
    eventType: "challan_generated",
    channels: payload.channels,
    subject: `SVGA Book Bank - Your Challan (${payload.challanId})`,
    bodyHtml: `
      <h2>Dear ${payload.studentName},</h2>
      <p>Your challan <strong>${payload.challanId}</strong> has been generated.</p>
      <p>Please find your challan attached. Visit the SVGA Book Bank portal to view your request status.</p>
      <p>Thank you,<br/>SVGA Book Bank Team</p>
    `,
    bodyText: `Dear ${payload.studentName}, your challan ${payload.challanId} has been generated. Please visit the SVGA Book Bank portal.`,
    whatsappMessage: `Dear ${payload.studentName}, your SVGA Book Bank challan *${payload.challanId}* has been generated. Please visit the portal to view your request status.`,
    challanPdf: payload.challanPdfBase64,
  });
}

// --- Notification templates ---------------------------------------------------

interface TemplateVars {
  studentName: string;
  studentId?: string;
  bookTitle?: string;
  returnDate?: string;
  daysRemaining?: number;
  queuePosition?: number;
  expectedDate?: string;
  requestId?: string;
  challanId?: string;
}

function interpolate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{studentName\}\}/g, vars.studentName)
    .replace(/\{\{studentId\}\}/g, vars.studentId ?? "")
    .replace(/\{\{bookTitle\}\}/g, vars.bookTitle ?? "")
    .replace(/\{\{returnDate\}\}/g, vars.returnDate ?? "")
    .replace(/\{\{daysRemaining\}\}/g, String(vars.daysRemaining ?? ""))
    .replace(/\{\{queuePosition\}\}/g, String(vars.queuePosition ?? ""))
    .replace(/\{\{expectedDate\}\}/g, vars.expectedDate ?? "")
    .replace(/\{\{requestId\}\}/g, vars.requestId ?? "")
    .replace(/\{\{challanId\}\}/g, vars.challanId ?? "");
}

export const NOTIFICATION_TEMPLATES: Record<
  NotificationEventType,
  { subject: string; html: string; text: string; whatsapp: string }
> = {
  registration_success: {
    subject: "Welcome to SVGA Book Bank!",
    html: "<h2>Welcome, {{studentName}}!</h2><p>Your registration (ID: <strong>{{studentId}}</strong>) is complete. Please complete your payment to start borrowing books.</p>",
    text: "Welcome {{studentName}}! Registration complete (ID: {{studentId}}). Complete payment to borrow books.",
    whatsapp:
      "Welcome *{{studentName}}*! Your SVGA Book Bank registration is complete. Student ID: *{{studentId}}*. Please complete your payment.",
  },
  payment_success: {
    subject: "SVGA Book Bank - Payment Confirmed",
    html: "<h2>Payment Confirmed!</h2><p>Dear {{studentName}}, your Rs.200 membership deposit is confirmed. You can now request books.</p>",
    text: "Payment confirmed for {{studentName}}. Membership active. You may now request books.",
    whatsapp:
      "*Payment Confirmed* Dear *{{studentName}}*, your Rs.200 membership is active. You can now request books from SVGA Book Bank.",
  },
  book_approved: {
    subject: "SVGA Book Bank - Book Request Approved",
    html: "<h2>Book Approved!</h2><p>Dear {{studentName}}, your request for <strong>{{bookTitle}}</strong> (Ref: {{requestId}}) has been approved. Please collect it from the library.</p>",
    text: "Book approved: {{bookTitle}} (Ref: {{requestId}}). Please collect from the library.",
    whatsapp:
      "*Book Approved* Dear *{{studentName}}*, your request for *{{bookTitle}}* has been approved. Please collect it from the SVGA library.",
  },
  book_rejected: {
    subject: "SVGA Book Bank - Book Request Update",
    html: "<h2>Book Request Update</h2><p>Dear {{studentName}}, your request for <strong>{{bookTitle}}</strong> could not be fulfilled at this time.</p>",
    text: "Request for {{bookTitle}} could not be fulfilled. Contact the library for alternatives.",
    whatsapp:
      "Dear *{{studentName}}*, your request for *{{bookTitle}}* could not be fulfilled. Please visit the library for alternatives.",
  },
  book_reserved: {
    subject: "SVGA Book Bank - Book Reserved (Queue #{{queuePosition}})",
    html: "<h2>Reservation Confirmed</h2><p>Dear {{studentName}}, you are at queue position <strong>{{queuePosition}}</strong> for <strong>{{bookTitle}}</strong>. Expected: {{expectedDate}}.</p>",
    text: "Reserved: {{bookTitle}}. Queue position: {{queuePosition}}. Expected: {{expectedDate}}.",
    whatsapp:
      "*Reservation Confirmed* Dear *{{studentName}}*, you are at queue position *{{queuePosition}}* for *{{bookTitle}}*. Expected availability: {{expectedDate}}.",
  },
  book_available: {
    subject: "SVGA Book Bank - Your Reserved Book is Available!",
    html: "<h2>Book Available!</h2><p>Dear {{studentName}}, your reserved book <strong>{{bookTitle}}</strong> is now available. Please collect within 3 days.</p>",
    text: "Your reserved book {{bookTitle}} is now available. Please collect within 3 days.",
    whatsapp:
      "*Book Available!* Dear *{{studentName}}*, your reserved book *{{bookTitle}}* is now available. Please collect within 3 days.",
  },
  return_reminder: {
    subject: "SVGA Book Bank - Book Return Reminder ({{daysRemaining}} days)",
    html: "<h2>Return Reminder</h2><p>Dear {{studentName}}, your book <strong>{{bookTitle}}</strong> is due in <strong>{{daysRemaining}} days</strong> ({{returnDate}}).</p>",
    text: "Return reminder: {{bookTitle}} due in {{daysRemaining}} days on {{returnDate}}.",
    whatsapp:
      "*Return Reminder* Dear *{{studentName}}*, your book *{{bookTitle}}* is due in *{{daysRemaining}} days* ({{returnDate}}). Please return it on time.",
  },
  due_date_reminder: {
    subject: "SVGA Book Bank - Book Due Tomorrow!",
    html: "<h2>Book Due Tomorrow!</h2><p>Dear {{studentName}}, your book <strong>{{bookTitle}}</strong> is due <strong>tomorrow</strong> ({{returnDate}}).</p>",
    text: "URGENT: {{bookTitle}} is due tomorrow ({{returnDate}}). Please return it.",
    whatsapp:
      "*URGENT* Dear *{{studentName}}*, your book *{{bookTitle}}* is due *tomorrow* ({{returnDate}}). Please return it immediately.",
  },
  course_completion: {
    subject: "SVGA Book Bank - Course Completion Notice",
    html: "<h2>Course Completion</h2><p>Dear {{studentName}}, your academic year is ending. Please return all books or choose to continue to next year.</p>",
    text: "Course completion: Please return all books or choose to continue next year.",
    whatsapp:
      "Dear *{{studentName}}*, your academic year is ending. Please return all SVGA books or visit the portal to continue to next year.",
  },
  year_promotion: {
    subject: "SVGA Book Bank - Year Promotion",
    html: "<h2>Year Promotion</h2><p>Dear {{studentName}}, you have been promoted to the next academic year. New book recommendations are available in your dashboard.</p>",
    text: "You have been promoted to the next year. Check your dashboard for new book recommendations.",
    whatsapp:
      "*Year Promotion* Congratulations *{{studentName}}*! You have been promoted to the next academic year. Check your SVGA dashboard for new book recommendations.",
  },
  challan_generated: {
    subject: "SVGA Book Bank - Challan Generated ({{challanId}})",
    html: "<h2>Challan Generated</h2><p>Dear {{studentName}}, your challan <strong>{{challanId}}</strong> has been generated. Please find it attached.</p>",
    text: "Challan {{challanId}} generated for {{studentName}}. Please check the attachment.",
    whatsapp:
      "Dear *{{studentName}}*, your SVGA Book Bank challan *{{challanId}}* has been generated. Please visit the portal to download it.",
  },
  procurement_needed: {
    subject: "SVGA Book Bank - Procurement Request",
    html: "<h2>Procurement Request Submitted</h2><p>Dear {{studentName}}, your urgent request for <strong>{{bookTitle}}</strong> has been submitted. Admin has been notified.</p>",
    text: "Procurement request submitted for {{bookTitle}}. Admin notified.",
    whatsapp:
      "Dear *{{studentName}}*, your urgent request for *{{bookTitle}}* has been submitted for procurement. Admin has been notified.",
  },
  procurement_ready: {
    subject: "SVGA Book Bank - Procured Book Ready for Collection!",
    html: "<h2>Book Ready!</h2><p>Dear {{studentName}}, your procured book <strong>{{bookTitle}}</strong> is ready for collection at the library.</p>",
    text: "Procured book {{bookTitle}} is ready for collection.",
    whatsapp:
      "*Book Ready!* Dear *{{studentName}}*, your procured book *{{bookTitle}}* is ready for collection at the SVGA library.",
  },
  waiting_list_update: {
    subject: "SVGA Book Bank - Waiting List Update",
    html: "<h2>Waiting List Update</h2><p>Dear {{studentName}}, your queue position for <strong>{{bookTitle}}</strong> is now <strong>#{{queuePosition}}</strong>.</p>",
    text: "Waiting list update: {{bookTitle}}, queue position: {{queuePosition}}.",
    whatsapp:
      "Dear *{{studentName}}*, your waiting list position for *{{bookTitle}}* is now *#{{queuePosition}}*.",
  },
};

/** Build a filled notification template */
export function buildNotificationContent(
  eventType: NotificationEventType,
  vars: TemplateVars,
) {
  const template = NOTIFICATION_TEMPLATES[eventType];
  return {
    subject: interpolate(template.subject, vars),
    html: interpolate(template.html, vars),
    text: interpolate(template.text, vars),
    whatsapp: interpolate(template.whatsapp, vars),
  };
}
