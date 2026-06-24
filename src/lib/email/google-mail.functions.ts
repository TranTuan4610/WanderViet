// Server functions exposing the Google Apps Script mailer to the client.
// Mail failures must never break the user-facing flow (signup / booking),
// so handlers swallow errors and return { sent: false, reason }.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertBookingAccess(context: { supabase: any; userId: string }, bookingId: string) {
  const { data: owned, error } = await context.supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (owned) return;
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Bạn không có quyền gửi email cho booking này");
}

export const sendWelcomeSignupEmail = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().email(),
        customerName: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { sendGoogleMail } = await import("@/lib/email/google-mailer.server");
    return sendGoogleMail({
      type: "welcome_signup",
      to: data.email,
      customerName: data.customerName,
    });
  });

export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ email: z.string().email(), origin: z.string().url().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const origin = data.origin ?? process.env.SITE_URL ?? "https://travel-weaver-65.lovable.app";
      const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: data.email,
        options: { redirectTo: `${origin.replace(/\/$/, "")}/reset-password` },
      });
      if (error || !linkData.properties?.action_link) {
        console.error("[password_reset] generate link failed", error);
        return { sent: true };
      }
      const name = data.email.split("@")[0];
      const { sendGoogleMail } = await import("@/lib/email/google-mailer.server");
      await sendGoogleMail({
        type: "password_reset",
        to: data.email,
        customerName: name,
        resetLink: linkData.properties.action_link,
        expiresInMinutes: 60,
      });
      return { sent: true };
    } catch (e) {
      console.error("[password_reset] failed", e);
      return { sent: true };
    }
  });

export const sendPaymentSuccessEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        bookingId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertBookingAccess(context, data.bookingId);
    const { sendCustomerPaymentSuccess } = await import("./booking-mail.server");
    return sendCustomerPaymentSuccess(data.bookingId);
  });

export const notifyOwnerOfBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ bookingId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertBookingAccess(context, data.bookingId);
    const { sendOwnerBookingNotification } = await import("./booking-mail.server");
    return sendOwnerBookingNotification(data.bookingId);
  });
