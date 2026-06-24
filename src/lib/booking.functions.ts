import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const guestSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  cccd: z.string().min(1).max(20),
  email: z.string().max(200).optional().default(""),
});

const createPendingSchema = z.object({
  type: z.enum(["tour", "hotel", "flight", "rental"]),
  ref_id: z.string().min(1).max(200),
  ref_title: z.string().max(500).optional().nullable(),
  total: z.number().int().min(0).max(10_000_000_000),
  payment_method: z.enum(["qr", "momo"]),
  customer_info: z.object({
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(20),
    cccd: z.string().min(1).max(20),
    email: z.string().max(200).optional().default(""),
    guests: z.array(guestSchema).min(1).max(50),
    order_info: z.string().min(1).max(500),
    date: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    people: z.number().optional(),
    pax: z.number().optional(),
    rooms: z.number().optional(),
    guests_count: z.number().optional(),
    nights: z.number().optional(),
    pricePerNight: z.number().optional(),
    roomId: z.string().optional(),
    roomName: z.string().optional(),
    tier: z.string().optional(),
    class: z.string().optional(),
  }).passthrough(),
});

export const createPendingBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createPendingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { insertPendingBooking } = await import("./booking.server");
    const row = await insertPendingBooking({
      type: data.type,
      ref_id: data.ref_id,
      ref_title: data.ref_title ?? null,
      total: data.total,
      payment_method: data.payment_method,
      user_id: context.userId,
      customer_info: data.customer_info,
    });
    return row;
  });

export const getBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { fetchBookingStatus } = await import("./booking.server");
    const row = await fetchBookingStatus(data.id);
    if (!row) return { id: data.id, status: "not_found" as const };
    return row;
  });

/**
 * In-app fallback that marks a booking paid without a real bank webhook.
 * Use this only from the user's own confirm button — the canonical entry
 * point for production is the public webhook at /api/public/payment-callback.
 */
export const confirmBookingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: owned, error } = await context.supabase
      .from("bookings")
      .select("id")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!owned) throw new Error("Không tìm thấy đơn đặt của bạn");
    const { markBookingPaid } = await import("./booking.server");
    await markBookingPaid(data.id);
    return { ok: true };
  });
