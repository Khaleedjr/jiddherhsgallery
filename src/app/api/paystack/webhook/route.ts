import { NextResponse } from "next/server";
import { isValidWebhookSignature, type PaystackTransaction } from "@/lib/paystack";
import { applySuccessfulPayment, orderRefOf } from "@/lib/payments";
import { OrderError } from "@/lib/store/orders";

/**
 * Paystack's server-to-server notice of a payment. It arrives even when the
 * customer closes the tab before returning to the store, so it is what makes
 * an order paid in every case. Set this URL (https://<your site>/api/paystack/webhook)
 * as the webhook URL in the Paystack dashboard. Only bodies signed with our
 * secret key are accepted.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: PaystackTransaction };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const orderRef = orderRefOf(event.data);
    if (orderRef) {
      try {
        await applySuccessfulPayment(orderRef, event.data);
      } catch (error) {
        // Not one of our website orders (or since deleted): acknowledge, so Paystack stops retrying.
        if (!(error instanceof OrderError)) throw error;
      }
    }
  }
  return NextResponse.json({ received: true });
}
