// Server-only helpers for the booking payment flow.
// Used by both the manual "confirm" server function and the public payment
// webhook to ensure a single, consistent code path.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BookingType = "tour" | "hotel" | "flight" | "rental";

export type CreatePendingInput = {
  type: BookingType;
  ref_id: string;
  ref_title?: string | null;
  total: number;
  payment_method: "qr" | "momo";
  user_id: string;
  customer_info: Record<string, unknown>;
};

export async function insertPendingBooking(input: CreatePendingInput) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      type: input.type,
      ref_id: input.ref_id,
      ref_title: input.ref_title ?? null,
      total: input.total,
      payment_method: input.payment_method,
      status: "pending",
      user_id: input.user_id,
      customer_info: input.customer_info as never,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export async function fetchBookingStatus(id: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { id: data.id as string, status: data.status as string } : null;
}

/**
 * Mark a booking as "paid" (idempotent). Used by:
 *  - the public payment webhook (after signature verification), and
 *  - the in-app fallback "Tôi đã hoàn tất thanh toán" button.
 */
export async function markBookingPaid(id: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ status: "paid" })
    .eq("id", id)
    .neq("status", "paid")
    .select("id, status")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("customer_info")
      .eq("id", id)
      .maybeSingle();
    const info = (booking?.customer_info ?? {}) as Record<string, unknown>;
    const voucher = info.voucher as Record<string, unknown> | null | undefined;
    const voucherId = typeof voucher?.id === "string" ? voucher.id : null;
    if (voucherId) {
      const { data: row } = await supabaseAdmin
        .from("vouchers")
        .select("used")
        .eq("id", voucherId)
        .maybeSingle();
      await supabaseAdmin
        .from("vouchers")
        .update({ used: Number(row?.used ?? 0) + 1 })
        .eq("id", voucherId);
    }
  }

  const { data: paidBooking, error: paidError } = await supabaseAdmin
    .from("bookings")
    .select("id, type, status")
    .eq("id", id)
    .maybeSingle();
  if (paidError) throw new Error(paidError.message);
  if (paidBooking?.status === "paid") {
    const { sendCustomerPaymentSuccess, sendOwnerBookingNotification } = await import("@/lib/email/booking-mail.server");
    const customerEmail = await sendCustomerPaymentSuccess(id);
    const ownerEmail = paidBooking.type === "hotel" ? await sendOwnerBookingNotification(id) : { sent: false, skipped: true, reason: "not_hotel_booking" };
    return { booking: paidBooking, customerEmail, ownerEmail };
  }
  return data;
}
