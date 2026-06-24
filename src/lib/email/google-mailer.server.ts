// Server-only helper: POSTs email jobs to the existing Google Apps Script Web App.
// Do NOT import this file from client components. Use it only inside server functions/routes.

type PaymentBasePayload = {
  bookingId?: string;
  bookingCode?: string;
  bookingDate?: string;
  bookingType?: string;
  booking_time?: string;
  payment_status?: "paid" | string;
  paymentStatus?: string;
  serviceName?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCccd?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  hotel_name?: string;
  tour_name?: string;
  flight_name?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  scheduleInfo?: string;
  guestCount?: string | number;
  rooms?: string | number;
  nights?: string | number;
  orderInfo?: string;
  paymentMethod?: string;
  originalTotal?: string | number;
  voucherCode?: string;
  discountAmount?: string | number;
  totalPrice?: string | number;
  guestNote?: string;
  guests?: unknown;
  ticketClass?: string;
  airline?: string;
  flightCode?: string;
  fromCode?: string;
  toCode?: string;
  departTime?: string;
  arriveTime?: string;
  duration?: string;
  destination?: string;
  days?: string | number;
};

export type GoogleMailPayload =
  | { type: "welcome_signup"; to: string; customerName?: string }
  | { type: "password_reset"; to: string; resetLink: string; customerName?: string; expiresInMinutes?: number }
  | ({ type: "payment_success"; to: string } & PaymentBasePayload)
  | ({ type: "owner_booking_notification"; ownerEmail: string; owner_email?: string; ownerName?: string; hotelAddress?: string } & PaymentBasePayload);

export type SendGoogleMailResult = {
  sent: boolean;
  reason?: string;
  responseCode?: number;
  responseBody?: string;
  attempts?: number;
};

type EmailLogContext = {
  bookingId?: string;
  bookingType?: string;
  emailType?: string;
};

const SEND_TIMEOUT_MS = 15_000;
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function recipientOf(payload: GoogleMailPayload) {
  return "to" in payload ? payload.to : payload.ownerEmail;
}

function configuredWebhookHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid_url";
  }
}

function normalizeBody(text: string) {
  return text.length > 4_000 ? `${text.slice(0, 4_000)}…[truncated]` : text;
}

async function postGoogleMail(payload: GoogleMailPayload): Promise<SendGoogleMailResult> {
  // Trim to defend against trailing whitespace/newline pasted into the secret value.
  const url = process.env.GOOGLE_MAIL_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_MAIL_SECRET?.trim();
  if (!url || !secret) {
    console.error("[google-mailer] missing config", {
      hasWebhookUrl: Boolean(url),
      hasSecret: Boolean(secret),
      type: payload.type,
      recipient: recipientOf(payload),
    });
    return { sent: false, reason: "missing_config" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    console.info("[google-mailer] sending", {
      type: payload.type,
      recipient: recipientOf(payload),
      webhookHost: configuredWebhookHost(url),
      bookingId: "bookingId" in payload ? payload.bookingId : undefined,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
      redirect: "follow",
      signal: controller.signal,
    });
    const text = normalizeBody(await res.text().catch(() => ""));
    let explicitFailure = false;
    try {
      const json = text ? JSON.parse(text) as { ok?: unknown; success?: unknown; error?: unknown } : null;
      explicitFailure = Boolean(json && (json.ok === false || json.success === false || json.error));
    } catch {
      // Apps Script often returns plain text; non-JSON is OK when HTTP status is OK.
    }

    if (!res.ok || explicitFailure) {
      console.error("[google-mailer] rejected", {
        status: res.status,
        body: text,
        type: payload.type,
        recipient: recipientOf(payload),
      });
      return { sent: false, reason: explicitFailure ? "apps_script_error" : `http_${res.status}`, responseCode: res.status, responseBody: text };
    }
    return { sent: true, responseCode: res.status, responseBody: text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const reason = msg.toLowerCase().includes("abort") ? "timeout" : "fetch_failed";
    console.error("[google-mailer] fetch failed", { reason, message: msg, type: payload.type, recipient: recipientOf(payload) });
    return { sent: false, reason, responseBody: msg };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send an email through Google Apps Script. This helper retries transient failures,
 * reads config on every call, and never throws.
 */
export async function sendGoogleMail(payload: GoogleMailPayload): Promise<SendGoogleMailResult> {
  let last: SendGoogleMailResult = { sent: false, reason: "not_attempted" };
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    if (attempt > 1) await sleep(RETRY_DELAYS_MS[attempt - 2]);
    last = await postGoogleMail(payload);
    last.attempts = attempt;
    if (last.sent) return last;
  }
  return last;
}

async function writeLegacyLog(idempotencyKey: string, payload: GoogleMailPayload, result: SendGoogleMailResult) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("email_send_log").insert({
      message_id: idempotencyKey,
      template_name: payload.type,
      recipient_email: recipientOf(payload),
      status: result.sent ? "sent" : "failed",
      error_message: result.sent ? null : result.reason ?? null,
      metadata: {
        responseCode: result.responseCode ?? null,
        responseBody: result.responseBody ?? null,
        attempts: result.attempts ?? null,
      } as never,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("idx_email_send_log_message_sent_unique")) {
      console.error("[google-mailer] legacy log insert failed", msg);
    }
  }
}

/**
 * Idempotent booking email send. The email_logs row is claimed before the fetch,
 * so concurrent callbacks/refreshes cannot send the same booking email twice.
 */
export async function sendGoogleMailOnce(
  idempotencyKey: string,
  payload: GoogleMailPayload,
  context: EmailLogContext = {},
): Promise<SendGoogleMailResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const recipient = recipientOf(payload);

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("email_logs")
    .insert({
      booking_id: context.bookingId ?? null,
      booking_type: context.bookingType ?? null,
      recipient,
      email_type: context.emailType ?? payload.type,
      status: "pending",
      request_body: payload as never,
      idempotency_key: idempotencyKey,
      attempt: 0,
    })
    .select("id")
    .single();
  let logId = claimed?.id as string | undefined;

  if (claimError || !logId) {
    const { data: existing } = await supabaseAdmin
      .from("email_logs")
      .select("id, status, response_code, response_body, error_message, attempt")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing?.status === "sent") return { sent: true, reason: "already_sent", responseCode: existing.response_code ?? undefined, responseBody: existing.response_body ?? undefined, attempts: existing.attempt ?? undefined };
    if (existing?.status === "pending" || existing?.status === "retrying") return { sent: false, reason: "already_in_progress", attempts: existing.attempt ?? undefined };
    if (existing?.status === "failed") {
      const { data: reclaimed, error: reclaimError } = await supabaseAdmin
        .from("email_logs")
        .update({ status: "pending", request_body: payload as never, attempt: 0, error_message: null })
        .eq("id", existing.id)
        .eq("status", "failed")
        .select("id")
        .maybeSingle();
      if (reclaimError || !reclaimed) return { sent: false, reason: "already_failed", responseCode: existing.response_code ?? undefined, responseBody: existing.response_body ?? undefined, attempts: existing.attempt ?? undefined };
      logId = reclaimed.id;
    }
    if (!logId) {
      console.error("[google-mailer] idempotency claim failed", claimError);
      return { sent: false, reason: "log_claim_failed" };
    }
  }

  let finalResult: SendGoogleMailResult = { sent: false, reason: "not_attempted" };
  const attemptBodies: Array<{ attempt: number; sent: boolean; reason?: string; responseCode?: number; responseBody?: string }> = [];
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    if (attempt > 1) await sleep(RETRY_DELAYS_MS[attempt - 2]);
    finalResult = await postGoogleMail(payload);
    finalResult.attempts = attempt;
    attemptBodies.push({
      attempt,
      sent: finalResult.sent,
      reason: finalResult.reason,
      responseCode: finalResult.responseCode,
      responseBody: finalResult.responseBody,
    });
    await supabaseAdmin
      .from("email_logs")
      .update({
        attempt,
        status: finalResult.sent ? "sent" : attempt <= RETRY_DELAYS_MS.length ? "retrying" : "failed",
        response_code: finalResult.responseCode ?? null,
        response_body: normalizeBody(JSON.stringify(attemptBodies)),
        error_message: finalResult.sent ? null : finalResult.reason ?? "send_failed",
      })
      .eq("id", logId);
    if (finalResult.sent) break;
  }

  await writeLegacyLog(idempotencyKey, payload, finalResult);
  return finalResult;
}
