import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type TablePayload = { table: "tours" | "hotels" | "flights"; values: Record<string, unknown> };

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !isAdmin) throw new Error("Bạn không có quyền quản trị");
}

export const adminGetHotelDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { hotelId: string }) => z.object({ hotelId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRe.test(data.hotelId);

    type Json = string | number | boolean | null | { [k: string]: Json } | Json[];
    type Row = Record<string, Json>;
    let hotel: Row | null = null;
    let rooms: Row[] = [];
    let bookings: Row[] = [];
    let owner: { id: string; name: string | null; phone: string | null; email: string | null } | null = null;

    if (isUuid) {
      const { data: h } = await supabaseAdmin.from("hotels").select("*").eq("id", data.hotelId).maybeSingle();
      hotel = (h ?? null) as unknown as Row | null;
      const { data: r } = await supabaseAdmin.from("hotel_rooms").select("*").eq("hotel_id", data.hotelId);
      rooms = (r ?? []) as unknown as Row[];
    }

    const { data: b } = await supabaseAdmin
      .from("bookings")
      .select("id, status, total, customer_info, created_at, ref_title, room_id, user_id")
      .eq("type", "hotel")
      .eq("ref_id", data.hotelId)
      .order("created_at", { ascending: false });
    bookings = (b ?? []) as unknown as Row[];

    const ownerId = (hotel?.owner_id as string | undefined) ?? undefined;
    if (ownerId) {
      const { data: p } = await supabaseAdmin.from("profiles").select("id, name, phone").eq("id", ownerId).maybeSingle();
      const { data: au } = await supabaseAdmin.auth.admin.getUserById(ownerId);
      owner = {
        id: ownerId,
        name: p?.name ?? null,
        phone: p?.phone ?? null,
        email: au?.user?.email ?? null,
      };
    }

    const totalBookings = bookings.length;
    const paidBookings = bookings.filter((x) => x.status === "paid").length;
    const revenue = bookings.filter((x) => x.status === "paid").reduce((s, x) => s + Number(x.total ?? 0), 0);
    const totalRooms = rooms.reduce((s, r) => s + Number(r.available ?? 0), 0);

    return { hotel, rooms, bookings, owner, stats: { totalBookings, paidBookings, revenue, totalRooms } };
  });

export const adminInsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: TablePayload) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from(data.table)
      .insert(data.values as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const adminUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: TablePayload & { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from(data.table)
      .update(data.values as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: "tours" | "hotels" | "flights"; id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
  await assertAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, type, ref_id, ref_title, total, status, payment_method, created_at, user_id, customer_info")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "paid", "cancelled", "refunded"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.status === "paid") {
      const { markBookingPaid } = await import("./booking.server");
      await markBookingPaid(data.id);
    } else {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("bookings").update({ status: data.status }).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/**
 * Admin-only: resend confirmation emails for a paid booking even if a previous
 * attempt failed (e.g. when GOOGLE_MAIL_SECRET was wrong). Resets the email_logs
 * row to allow the idempotent sender to retry.
 */
export const adminResendBookingEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Allow re-send: clear "sent" flags AND wipe stale failed log rows for this booking
    await supabaseAdmin
      .from("bookings")
      .update({ customer_email_sent: false, owner_email_sent: false })
      .eq("id", data.id);
    await supabaseAdmin
      .from("email_logs")
      .delete()
      .eq("booking_id", data.id)
      .neq("status", "sent");
    const { sendCustomerPaymentSuccess, sendOwnerBookingNotification } = await import(
      "@/lib/email/booking-mail.server"
    );
    const customer = await sendCustomerPaymentSuccess(data.id);
    const { data: row } = await supabaseAdmin.from("bookings").select("type").eq("id", data.id).maybeSingle();
    const owner = row?.type === "hotel" ? await sendOwnerBookingNotification(data.id) : { sent: false, skipped: true, reason: "not_hotel_booking" };
    return { customer, owner };
  });

