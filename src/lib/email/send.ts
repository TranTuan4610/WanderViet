// Backwards-compat shim. The project now sends emails via Google Apps Script
// (see src/lib/email/google-mail.functions.ts). Keep this stub so any older
// client code that still imports `sendTransactionalEmail` does not crash;
// it routes welcome and payment-success templates to the new path.

import {
  sendWelcomeSignupEmail,
  sendPaymentSuccessEmail,
} from "@/lib/email/google-mail.functions";

interface SendTransactionalEmailParams {
  templateName: string;
  recipientEmail: string;
  idempotencyKey?: string;
  bookingId?: string;
  templateData?: Record<string, unknown>;
}

export async function sendTransactionalEmail(params: SendTransactionalEmailParams) {
  try {
    if (params.templateName === "welcome-signup") {
      const name =
        (params.templateData?.customerName as string | undefined) ?? undefined;
      return await sendWelcomeSignupEmail({
        data: { email: params.recipientEmail, customerName: name },
      });
    }
    if (params.templateName === "booking-confirmation" && params.bookingId) {
      return await sendPaymentSuccessEmail({ data: { bookingId: params.bookingId } });
    }
    console.warn("[sendTransactionalEmail] unsupported template", params.templateName);
    return { sent: false, reason: "unsupported_template" };
  } catch (e) {
    console.error("[sendTransactionalEmail] failed", e);
    return { sent: false, reason: "exception" };
  }
}
