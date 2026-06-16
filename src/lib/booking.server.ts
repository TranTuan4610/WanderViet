// Server-only helpers for the booking payment flow.
// Used by both the manual "confirm" server function and the public payment
// webhook to ensure a single, consistent code path.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { explainSupabaseError } from "@/lib/adminErrors";

export type BookingType = "tour" | "hotel" | "flight";

export type CreatePendingInput = {
  type: BookingType;
  ref_id: string;
  ref_title?: string | null;
  total: number;
  payment_method: "qr" | "momo";
  user_id?: string | null;
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
      user_id: input.user_id ?? null,
      customer_info: input.customer_info as never,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(explainSupabaseError(error, "Không tạo được booking pending"));
  return { id: data.id as string };
}

export async function fetchBookingStatus(id: string) {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(explainSupabaseError(error, "Không đọc được trạng thái booking"));
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
    .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .neq("status", "paid")
    .select("id, status")
    .maybeSingle();
  if (error) throw new Error(explainSupabaseError(error, "Không cập nhật thanh toán booking"));
  return data;
}
