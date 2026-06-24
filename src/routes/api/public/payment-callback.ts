// Public payment webhook for SePay (TPBank / Momo aggregator).
//
// SePay sends:
//   Header: X-SePay-Signature: sha256=<hex HMAC-SHA256(rawBody, secret)>
//   Header: X-SePay-Timestamp: <epoch>
//   Body (JSON):
//     {
//       gateway, transactionDate, accountNumber, subAccount, code,
//       content, transferType ("in"|"out"), description,
//       transferAmount, referenceCode, accumulated, id
//     }
//
// We also still accept the simpler legacy shape:
//   { bookingId?, orderInfo?, amount?, status? }
// with header `x-payment-secret` (shared secret) or `x-signature` (raw hex HMAC).
//
// Booking matching, in priority order:
//   1) explicit `bookingId` field in payload
//   2) extract a 32-hex token from `content` / `description` / `orderInfo`
//      → reformat with dashes → match by bookings.id
//   3) fall back to exact `customer_info.order_info` lookup

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-payment-secret, x-signature, X-SePay-Signature, X-SePay-Timestamp",
} as const;

function safeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function verifyAuth(rawBody: string, headers: Headers): boolean {
  const secret = process.env.PAYMENT_CALLBACK_SECRET;
  if (!secret) return false;

  // 1) Shared-secret header (legacy)
  const shared = headers.get("x-payment-secret");
  if (shared && safeEq(shared, secret)) return true;

  // 2) Generic HMAC header (raw hex)
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const generic = headers.get("x-signature");
  if (generic && safeEq(generic, expectedHex)) return true;

  // 3) SePay HMAC header — value may be "sha256=<hex>" or bare "<hex>"
  const sepay = headers.get("x-sepay-signature");
  if (sepay) {
    const val = sepay.startsWith("sha256=") ? sepay.slice(7) : sepay;
    if (safeEq(val, expectedHex)) return true;
  }
  return false;
}

function extractBookingIdFromText(text: string | undefined | null): string | null {
  if (!text) return null;
  // Look for a 32-hex run (UUID without dashes), case-insensitive.
  const m = text.match(/[0-9a-fA-F]{32}/);
  if (!m) return null;
  const h = m[0].toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const Route = createFileRoute("/api/public/payment-callback")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () =>
        new Response(JSON.stringify({ ok: true, endpoint: "payment-callback" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS },
        }),
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!verifyAuth(raw, request.headers)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const str = (k: string): string | undefined => {
          const v = body[k];
          return typeof v === "string" ? v : undefined;
        };

        // Outgoing transfers aren't "payments" — skip them.
        const transferType = str("transferType");
        if (transferType && transferType.toLowerCase() === "out") {
          return new Response(JSON.stringify({ ok: true, ignored: "transferType=out" }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        const status = str("status");
        if (status && !/^(paid|success|succeeded|ok|completed)$/i.test(status)) {
          return new Response(JSON.stringify({ ok: true, ignored: `status=${status}` }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }

        // 1) explicit booking id
        let bookingId: string | null = (str("bookingId") || "").trim() || null;

        // 2) extract UUID from any text-bearing field
        if (!bookingId) {
          const haystack = [str("content"), str("description"), str("orderInfo"), str("code")]
            .filter(Boolean)
            .join(" ");
          bookingId = extractBookingIdFromText(haystack);
        }

        // 3) fall back to exact order_info match
        if (!bookingId) {
          const orderInfo = str("orderInfo") || str("content");
          if (orderInfo) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await supabaseAdmin
              .from("bookings")
              .select("id")
              .contains("customer_info", { order_info: orderInfo })
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            bookingId = (data?.id as string | undefined) ?? null;
          }
        }

        if (!bookingId) {
          return new Response(
            JSON.stringify({ error: "Booking not found", hint: "no UUID in content/description" }),
            { status: 404, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }

        // Verify the booking exists before flipping status.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: existing } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("id", bookingId)
          .maybeSingle();
        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Booking not found", bookingId }),
            { status: 404, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }

        const { markBookingPaid } = await import("@/lib/booking.server");
        const result = await markBookingPaid(bookingId);

        return new Response(JSON.stringify({ ok: true, bookingId, result }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
