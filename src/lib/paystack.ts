import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Paystack, the payment provider the old store used. Server-only: it needs
 * PAYSTACK_SECRET_KEY (sk_test_… while testing, sk_live_… in production) and
 * must never be imported into client code.
 *
 * The customer pays on Paystack's own page (card, bank transfer, USSD), is
 * sent back to /checkout/complete, and the payment is confirmed twice over:
 * by verifying the transaction from that page, and by Paystack's webhook
 * (POST /api/paystack/webhook), which still arrives if the customer closes
 * the tab before getting back.
 */

/* PAYSTACK_API_BASE exists only to test the whole flow locally against a stand-in; leave it unset. */
const API = process.env.PAYSTACK_API_BASE?.trim() || "https://api.paystack.co";

export class PaystackError extends Error {}

const secretKey = () => process.env.PAYSTACK_SECRET_KEY?.trim() || null;

export const isPaystackConfigured = () => Boolean(secretKey());

/** A fresh reference for each payment attempt: the order ref plus a random suffix (Paystack rejects reused references). */
export const paymentReference = (orderRef: string) => `${orderRef}-${randomBytes(4).toString("hex")}`;

/** The order a payment reference belongs to: "JG-1043-a1b2c3d4" → "JG-1043". */
export const orderRefFromReference = (reference: string) => reference.match(/^(JG-\d+)-/i)?.[1]?.toUpperCase() ?? null;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = secretKey();
  if (!key) throw new PaystackError("Paystack is not set up: PAYSTACK_SECRET_KEY is missing.");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const body = (await response.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!response.ok || !body?.status || !body.data) {
    throw new PaystackError(body?.message ?? `Paystack returned ${response.status}.`);
  }
  return body.data;
}

/** Starts a payment and returns the Paystack page to send the customer to. */
export async function initializePayment(input: {
  email: string;
  /** Naira; converted to kobo here. */
  amount: number;
  reference: string;
  callbackUrl: string;
  orderRef: string;
  customerName: string;
}) {
  const data = await call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: {
        orderRef: input.orderRef,
        custom_fields: [
          { display_name: "Order", variable_name: "order_ref", value: input.orderRef },
          { display_name: "Customer", variable_name: "customer_name", value: input.customerName },
        ],
      },
    }),
  });
  return { authorizationUrl: data.authorization_url, reference: data.reference };
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  /** Kobo. */
  amount: number;
  currency: string;
  channel?: string | null;
  paid_at?: string | null;
  metadata?: { orderRef?: string } | string | null;
};

/** Looks the transaction up on Paystack: the only trustworthy answer to "did they pay?". */
export const verifyPayment = (reference: string) =>
  call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);

/** True when a webhook body was signed with our secret key (HMAC-SHA512, hex, in x-paystack-signature). */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const key = secretKey();
  if (!key || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", key).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
