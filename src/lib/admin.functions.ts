import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type TablePayload = { table: "tours" | "hotels" | "flights"; values: Record<string, unknown> };

export const adminGetHotelDetails = createServerFn({ method: "POST" })
  .inputValidator((d: { hotelId: string }) => z.object({ hotelId: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
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
  .inputValidator((d: TablePayload) => d)
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from(data.table)
      .insert(data.values as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const adminUpdate = createServerFn({ method: "POST" })
  .inputValidator((d: TablePayload & { id: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from(data.table)
      .update(data.values as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .inputValidator((d: { table: "tours" | "hotels" | "flights"; id: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListBookings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, type, ref_id, ref_title, total, status, payment_method, created_at, user_id, customer_info")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "paid", "cancelled", "refunded"]) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("bookings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

