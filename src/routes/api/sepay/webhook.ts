// SePay webhook — alias of /api/public/payment-callback exposed at
// the canonical path `/api/sepay/webhook` for the SePay dashboard.
//
// All verification, idempotency, amount-safety, and booking-matching logic
// lives in /api/public/payment-callback. This file simply forwards the
// request to that handler so a single code path stays the source of truth.
//
// SePay dashboard URL (production):  https://wandervietuth.shop/api/sepay/webhook
// Required env: PAYMENT_CALLBACK_SECRET (used by the underlying verifier).

import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-payment-secret, x-signature, X-SePay-Signature, X-SePay-Timestamp",
} as const;

async function forwardToCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = `${url.origin}/api/public/payment-callback`;
  const raw = await request.text();
  // Preserve auth + signature headers
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");
  return fetch(target, { method: "POST", headers, body: raw });
}

export const Route = createFileRoute("/api/sepay/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () =>
        new Response(
          JSON.stringify({ ok: true, endpoint: "sepay-webhook", note: "POST only" }),
          { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
        ),
      POST: async ({ request }) => {
        try {
          const res = await forwardToCallback(request);
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        } catch (err) {
          // Never crash: log and return JSON
          console.error("[sepay/webhook] forward error", err);
          return new Response(
            JSON.stringify({ success: false, error: "internal" }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }
      },
    },
  },
});
