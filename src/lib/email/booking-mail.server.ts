import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGoogleMailOnce, type SendGoogleMailResult } from "./google-mailer.server";

type BookingMailResult = SendGoogleMailResult & { skipped?: boolean };

const formatVnd = (value: unknown) => `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;
const formatDateTime = (value?: string | null) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleString("vi-VN");
};
const strFrom = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "string" ? (data[key] as string) : undefined;
const numFrom = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "number" ? (data[key] as number) : undefined;
const paymentLabel = (method?: string | null) =>
  method === "momo" ? "Momo QR" : "Chuyển khoản QR - TP Bank";

const buildScheduleInfo = (ci: Record<string, unknown>) => {
  const parts: string[] = [];
  const date = strFrom(ci, "date");
  const checkIn = strFrom(ci, "checkIn");
  const checkOut = strFrom(ci, "checkOut");
  const people = numFrom(ci, "people");
  const pax = numFrom(ci, "pax");
  const rooms = numFrom(ci, "rooms");
  const nights = numFrom(ci, "nights");
  if (date) parts.push(`Ngày: ${date}`);
  if (checkIn || checkOut) parts.push(`${checkIn ?? "—"} → ${checkOut ?? "—"}`);
  if (rooms) parts.push(`${rooms} phòng`);
  if (nights) parts.push(`${nights} đêm`);
  if (people) parts.push(`${people} khách`);
  if (pax) parts.push(`${pax} hành khách`);
  return parts.join(" · ") || undefined;
};

const voucherInfo = (ci: Record<string, unknown>) => {
  const v = ci.voucher as Record<string, unknown> | null | undefined;
  if (!v || typeof v !== "object") return { voucherCode: undefined, discountAmount: undefined };
  return {
    voucherCode: typeof v.code === "string" ? v.code : undefined,
    discountAmount: typeof v.discount_amount === "number" ? formatVnd(v.discount_amount) : undefined,
  };
};

const emailOk = (value?: string | null): value is string => Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));

const paymentSubjectName = (type?: string | null) => {
  if (type === "hotel") return "Khách sạn";
  if (type === "flight") return "Vé máy bay";
  return "Tour";
};

async function logSkippedEmail(args: {
  bookingId: string;
  bookingType?: string | null;
  recipient?: string | null;
  emailType: string;
  reason: string;
  requestBody?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("email_logs").upsert(
      {
        booking_id: args.bookingId,
        booking_type: args.bookingType ?? null,
        recipient: args.recipient || "missing-recipient@local.invalid",
        email_type: args.emailType,
        status: "failed",
        error_message: args.reason,
        request_body: (args.requestBody ?? {}) as never,
        idempotency_key: `${args.emailType}-${args.bookingId}-validation`,
        attempt: 0,
      },
      { onConflict: "idempotency_key" },
    );
  } catch (e) {
    console.error("[booking-mail] failed to log skipped email", { bookingId: args.bookingId, reason: args.reason, error: e });
  }
}

/**
 * Load booking and enrich with type-specific reference data
 * (tour destination, flight route, hotel address...).
 */
async function loadBookingContext(bookingId: string) {
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, type, ref_id, ref_title, total, payment_method, status, created_at, customer_info, customer_email_sent, owner_email_sent, email_sent_at",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;

  let extras: Record<string, unknown> = {};
  try {
    if (booking.type === "flight" && booking.ref_id) {
      const { data: flight } = await supabaseAdmin
        .from("flights")
        .select("id, airline, from_code, to_code, depart, arrive, duration")
        .eq("id", booking.ref_id)
        .maybeSingle();
      if (flight) {
        extras = {
          airline: flight.airline,
          flightCode: flight.id,
          fromCode: flight.from_code,
          toCode: flight.to_code,
          departTime: flight.depart,
          arriveTime: flight.arrive,
          duration: flight.duration,
        };
      }
    } else if (booking.type === "tour" && booking.ref_id) {
      const { data: tour } = await supabaseAdmin
        .from("tours")
        .select("destination, days, nights")
        .eq("id", booking.ref_id)
        .maybeSingle();
      if (tour) {
        extras = {
          destination: tour.destination,
          days: tour.days,
          nights: tour.nights,
        };
      }
    } else if (booking.type === "hotel" && booking.ref_id) {
      const { data: hotel } = await supabaseAdmin
        .from("hotels")
        .select("name, city")
        .eq("id", booking.ref_id)
        .maybeSingle();
      if (hotel) {
        extras = { hotelName: hotel.name, hotelAddress: hotel.city };
      }
    }
  } catch (e) {
    console.error("[booking-mail] enrichment failed", e);
  }

  return { booking, extras };
}

export async function sendCustomerPaymentSuccess(bookingId: string): Promise<BookingMailResult> {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return { sent: false, reason: "booking_not_found" };
  const { booking, extras } = ctx;

  // Hard gates: only send for paid + once per booking.
  if (booking.status !== "paid") return { sent: false, skipped: true, reason: `status_${booking.status}` };
  if (booking.customer_email_sent) return { sent: true, skipped: true, reason: "already_sent" };

  const ci = (booking.customer_info ?? {}) as Record<string, unknown>;
  const customerEmail = strFrom(ci, "email")?.trim();
  if (!emailOk(customerEmail)) {
    await logSkippedEmail({
      bookingId: booking.id,
      bookingType: booking.type,
      recipient: customerEmail,
      emailType: "payment_success",
      reason: "invalid_or_missing_customer_email",
      requestBody: { bookingId: booking.id, bookingType: booking.type, customerEmail },
    });
    return { sent: false, reason: "invalid_or_missing_customer_email" };
  }
  const voucher = voucherInfo(ci);
  const serviceName = booking.ref_title ?? undefined;
  const bookingCode = booking.id.slice(0, 8).toUpperCase();
  const bookingDate = formatDateTime(booking.created_at);
  const payload = {
    type: "payment_success" as const,
    to: customerEmail,
    bookingId: booking.id,
    bookingCode,
    bookingDate,
    booking_time: bookingDate,
    bookingType: paymentSubjectName(booking.type),
    payment_status: "paid",
    paymentStatus: "Đã thanh toán",
    customerName: strFrom(ci, "name"),
    customerPhone: strFrom(ci, "phone"),
    customerEmail,
    customerCccd: strFrom(ci, "cccd"),
    customer_name: strFrom(ci, "name"),
    customer_phone: strFrom(ci, "phone"),
    customer_email: customerEmail,
    serviceName,
    hotel_name: booking.type === "hotel" ? (strFrom(extras, "hotelName") ?? serviceName) : undefined,
    tour_name: booking.type === "tour" ? serviceName : undefined,
    flight_name: booking.type === "flight" ? serviceName : undefined,
    roomType: strFrom(ci, "roomName"),
    checkIn: strFrom(ci, "checkIn") ?? strFrom(ci, "date"),
    checkOut: strFrom(ci, "checkOut"),
    scheduleInfo: buildScheduleInfo(ci),
    guestCount: numFrom(ci, "guests_count") ?? numFrom(ci, "people") ?? numFrom(ci, "pax"),
    rooms: numFrom(ci, "rooms"),
    nights: numFrom(ci, "nights"),
    orderInfo: strFrom(ci, "order_info"),
    paymentMethod: paymentLabel(booking.payment_method),
    originalTotal: ci.original_total ? formatVnd(ci.original_total) : undefined,
    voucherCode: voucher.voucherCode,
    discountAmount: voucher.discountAmount,
    totalPrice: formatVnd(booking.total),
    guestNote: strFrom(ci, "note"),
    guests: ci.guests,
    ticketClass: strFrom(ci, "tier") ?? strFrom(ci, "class"),
    ...extras,
  };

  const result = await sendGoogleMailOnce(`booking-${booking.id}`, payload, {
    bookingId: booking.id,
    bookingType: booking.type,
    emailType: "payment_success",
  });

  if (result.sent) {
    try {
      await supabaseAdmin
        .from("bookings")
        .update({ customer_email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("id", booking.id);
    } catch (e) {
      console.error("[booking-mail] failed to set customer_email_sent", e);
    }
  } else {
    console.error("[booking-mail] customer send failed", booking.id, result.reason);
  }
  return result;
}

export async function sendOwnerBookingNotification(bookingId: string): Promise<BookingMailResult> {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return { sent: false, reason: "booking_not_found" };
  const { booking, extras } = ctx;

  if (booking.type !== "hotel") return { sent: false, skipped: true, reason: "not_hotel_booking" };
  if (booking.status !== "paid") return { sent: false, skipped: true, reason: `status_${booking.status}` };
  if (booking.owner_email_sent) return { sent: true, skipped: true, reason: "already_sent" };

  const ci = (booking.customer_info ?? {}) as Record<string, unknown>;
  const roomId = strFrom(ci, "roomId");
  const [{ data: hotel }, { data: room }] = await Promise.all([
    supabaseAdmin.from("hotels").select("id, name, city, owner_id, owner_email, owner_name").eq("id", booking.ref_id).maybeSingle(),
    roomId
      ? supabaseAdmin.from("hotel_rooms").select("owner_email").eq("id", roomId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let ownerEmail = room?.owner_email ?? hotel?.owner_email ?? undefined;
  let ownerName = hotel?.owner_name ?? undefined;
  if (!ownerEmail && hotel?.owner_id) {
    const { data: ownerUser } = await supabaseAdmin.auth.admin.getUserById(hotel.owner_id);
    ownerEmail = ownerUser?.user?.email ?? undefined;
    if (!ownerName) ownerName = (ownerUser?.user?.user_metadata as { name?: string } | null)?.name;
  }
  // Only fall back to default owner if no real owner is configured for the hotel.
  if (!ownerEmail) ownerEmail = process.env.DEFAULT_HOTEL_OWNER_EMAIL;
  if (!emailOk(ownerEmail)) {
    await logSkippedEmail({
      bookingId: booking.id,
      bookingType: booking.type,
      recipient: ownerEmail,
      emailType: "owner_booking_notification",
      reason: "invalid_or_missing_owner_email",
      requestBody: { bookingId: booking.id, hotelId: booking.ref_id, roomId, ownerEmail },
    });
    return { sent: false, reason: "invalid_or_missing_owner_email" };
  }

  const voucher = voucherInfo(ci);
  const bookingCode = booking.id.slice(0, 8).toUpperCase();
  const bookingDate = formatDateTime(booking.created_at);
  const hotelName = hotel?.name ?? booking.ref_title ?? undefined;
  const payload = {
    type: "owner_booking_notification" as const,
    ownerEmail,
    owner_email: ownerEmail,
    ownerName,
    bookingId: booking.id,
    bookingCode,
    bookingDate,
    booking_time: bookingDate,
    bookingType: "Khách sạn",
    payment_status: "paid",
    paymentStatus: "Đã thanh toán",
    customerName: strFrom(ci, "name"),
    customerEmail: strFrom(ci, "email"),
    customerPhone: strFrom(ci, "phone"),
    customerCccd: strFrom(ci, "cccd"),
    customer_name: strFrom(ci, "name"),
    customer_email: strFrom(ci, "email"),
    customer_phone: strFrom(ci, "phone"),
    hotelName,
    hotel_name: hotelName,
    hotelAddress: hotel?.city ?? undefined,
    roomType: strFrom(ci, "roomName"),
    checkIn: strFrom(ci, "checkIn") ?? strFrom(ci, "date"),
    checkOut: strFrom(ci, "checkOut"),
    scheduleInfo: buildScheduleInfo(ci),
    guestCount: numFrom(ci, "guests_count") ?? numFrom(ci, "people"),
    rooms: numFrom(ci, "rooms"),
    nights: numFrom(ci, "nights"),
    orderInfo: strFrom(ci, "order_info"),
    paymentMethod: paymentLabel(booking.payment_method),
    originalTotal: ci.original_total ? formatVnd(ci.original_total) : undefined,
    voucherCode: voucher.voucherCode,
    discountAmount: voucher.discountAmount,
    totalPrice: formatVnd(booking.total),
    guestNote: strFrom(ci, "note"),
    guests: ci.guests,
    ...extras,
  };

  const result = await sendGoogleMailOnce(`owner-${booking.id}`, payload, {
    bookingId: booking.id,
    bookingType: booking.type,
    emailType: "owner_booking_notification",
  });

  if (result.sent) {
    try {
      await supabaseAdmin
        .from("bookings")
        .update({ owner_email_sent: true })
        .eq("id", booking.id);
    } catch (e) {
      console.error("[booking-mail] failed to set owner_email_sent", e);
    }
  } else {
    console.error("[booking-mail] owner send failed", booking.id, result.reason);
  }
  return result;
}
