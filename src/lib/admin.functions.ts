import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { explainSupabaseError } from "@/lib/adminErrors";

const adminTables = ["tours", "hotels", "flights", "hotel_rooms", "vouchers", "content_posts"] as const;
type AdminTable = (typeof adminTables)[number];
type TablePayload = { table: AdminTable; values: Record<string, unknown> };

function throwDb(error: unknown, context: string): never {
  throw new Error(explainSupabaseError(error, context));
}

export const adminHealthCheck = createServerFn({ method: "GET" }).handler(async () => {
  const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
  if (error) throwDb(error, "Kiểm tra kết nối Supabase");
  return { ok: true };
});

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
    let owner: { id: string; name: string | null; full_name: string | null; phone: string | null; email: string | null } | null = null;

    if (isUuid) {
      const { data: h, error: hErr } = await supabaseAdmin.from("hotels").select("*").eq("id", data.hotelId).maybeSingle();
      if (hErr) throwDb(hErr, "Không tải được chi tiết khách sạn");
      hotel = (h ?? null) as unknown as Row | null;
      const { data: r, error: rErr } = await supabaseAdmin
        .from("hotel_rooms")
        .select("*")
        .eq("hotel_id", data.hotelId)
        .order("created_at", { ascending: true });
      if (rErr) throwDb(rErr, "Không tải được danh sách phòng");
      rooms = (r ?? []) as unknown as Row[];
    }

    const { data: b, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("id, status, total, customer_info, created_at, ref_title, room_id, user_id, type, ref_id, payment_method")
      .eq("type", "hotel")
      .eq("ref_id", data.hotelId)
      .order("created_at", { ascending: false });
    if (bErr) throwDb(bErr, "Không tải được booking của khách sạn");
    bookings = (b ?? []) as unknown as Row[];

    const ownerId = (hotel?.owner_id as string | undefined) ?? undefined;
    if (ownerId) {
      const { data: p, error: pErr } = await supabaseAdmin.from("profiles").select("id, email, name, full_name, phone").eq("id", ownerId).maybeSingle();
      if (pErr) throwDb(pErr, "Không tải được thông tin chủ khách sạn");
      const { data: au } = await supabaseAdmin.auth.admin.getUserById(ownerId);
      owner = {
        id: ownerId,
        name: p?.name ?? p?.full_name ?? null,
        full_name: p?.full_name ?? p?.name ?? null,
        phone: p?.phone ?? null,
        email: p?.email ?? au?.user?.email ?? null,
      };
    }

    const totalBookings = bookings.length;
    const paidBookings = bookings.filter((x) => x.status === "paid").length;
    const revenue = bookings.filter((x) => x.status === "paid").reduce((s, x) => s + Number(x.total ?? 0), 0);
    const totalRooms = rooms.reduce((s, r) => s + Number(r.available ?? 0), 0);

    return { hotel, rooms, bookings, owner, stats: { totalBookings, paidBookings, revenue, totalRooms } };
  });

export const adminInsert = createServerFn({ method: "POST" })
  .inputValidator((d: TablePayload) => z.object({ table: z.enum(adminTables), values: z.record(z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from(data.table)
      .insert(data.values as never)
      .select("id")
      .single();
    if (error) throwDb(error, `Không thể thêm dữ liệu vào bảng ${data.table}`);
    return { id: (row as { id: string }).id };
  });

export const adminUpdate = createServerFn({ method: "POST" })
  .inputValidator((d: TablePayload & { id: string }) =>
    z.object({ table: z.enum(adminTables), id: z.string().min(1), values: z.record(z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from(data.table)
      .update(data.values as never)
      .eq("id", data.id);
    if (error) throwDb(error, `Không thể cập nhật bảng ${data.table}`);
    return { ok: true };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .inputValidator((d: { table: AdminTable; id: string }) => z.object({ table: z.enum(adminTables), id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throwDb(error, `Không thể xóa dữ liệu trong bảng ${data.table}`);
    return { ok: true };
  });

export const adminListBookings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, type, ref_id, ref_title, total, status, payment_method, created_at, updated_at, paid_at, user_id, customer_info")
    .order("created_at", { ascending: false });
  if (error) throwDb(error, "Không tải được danh sách booking");
  return data ?? [];
});

export const adminUpdateBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "paid", "cancelled", "refunded"]) }).parse(d))
  .handler(async ({ data }) => {
    const payload: Record<string, unknown> = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.status === "paid") payload.paid_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("bookings").update(payload as never).eq("id", data.id);
    if (error) throwDb(error, "Không cập nhật được trạng thái booking");
    return { ok: true };
  });

export const adminUpsertRoom = createServerFn({ method: "POST" })
  .inputValidator((d: { hotelId: string; roomId?: string | null; values: Record<string, unknown> }) =>
    z.object({ hotelId: z.string().uuid(), roomId: z.string().uuid().optional().nullable(), values: z.record(z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const values = { ...data.values, hotel_id: data.hotelId };
    const result = data.roomId
      ? await supabaseAdmin.from("hotel_rooms").update(values as never).eq("id", data.roomId).select("id").single()
      : await supabaseAdmin.from("hotel_rooms").insert(values as never).select("id").single();
    if (result.error) throwDb(result.error, data.roomId ? "Không cập nhật được phòng" : "Không thêm được phòng");
    return { id: (result.data as { id: string }).id };
  });

export const adminDeleteRoom = createServerFn({ method: "POST" })
  .inputValidator((d: { roomId: string }) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("hotel_rooms").delete().eq("id", data.roomId);
    if (error) throwDb(error, "Không xóa được phòng");
    return { ok: true };
  });

export const adminListVouchers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("vouchers").select("*").order("created_at", { ascending: false });
  if (error) throwDb(error, "Không tải được danh sách voucher");
  return data ?? [];
});

export const adminUpsertVoucher = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string | null; values: Record<string, unknown> }) =>
    z.object({ id: z.string().uuid().optional().nullable(), values: z.record(z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const result = data.id
      ? await supabaseAdmin.from("vouchers").update(data.values as never).eq("id", data.id).select("id").single()
      : await supabaseAdmin.from("vouchers").insert(data.values as never).select("id").single();
    if (result.error) throwDb(result.error, data.id ? "Không cập nhật được voucher" : "Không tạo được voucher");
    return { id: (result.data as { id: string }).id };
  });

export const adminDeleteVoucher = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("vouchers").delete().eq("id", data.id);
    if (error) throwDb(error, "Không xóa được voucher");
    return { ok: true };
  });

export const adminListContentPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("content_posts").select("*").order("created_at", { ascending: false });
  if (error) throwDb(error, "Không tải được danh sách nội dung");
  return data ?? [];
});

export const adminUpsertContentPost = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string | null; values: Record<string, unknown> }) =>
    z.object({ id: z.string().uuid().optional().nullable(), values: z.record(z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const result = data.id
      ? await supabaseAdmin.from("content_posts").update(data.values as never).eq("id", data.id).select("id").single()
      : await supabaseAdmin.from("content_posts").insert(data.values as never).select("id").single();
    if (result.error) throwDb(result.error, data.id ? "Không cập nhật được nội dung" : "Không tạo được nội dung");
    return { id: (result.data as { id: string }).id };
  });

export const adminDeleteContentPost = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("content_posts").delete().eq("id", data.id);
    if (error) throwDb(error, "Không xóa được nội dung");
    return { ok: true };
  });
