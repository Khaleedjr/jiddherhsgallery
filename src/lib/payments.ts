import { after } from "next/server";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { orderRefFromReference, verifyPayment, type PaystackTransaction } from "@/lib/paystack";
import { sendOrderReceipt } from "@/lib/receipts";
import { getOrder, markOrderPaid } from "@/lib/store/orders";

/** What the confirmation page should tell the customer. */
export type PaymentState = "paid" | "processing" | "failed" | "mismatch" | "unknown";

/** The order a Paystack transaction belongs to, from its metadata or else its reference. */
export function orderRefOf(tx: Pick<PaystackTransaction, "reference" | "metadata">) {
  let metadata = tx.metadata;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata) as { orderRef?: string };
    } catch {
      metadata = null;
    }
  }
  const fromMetadata = metadata && typeof metadata === "object" ? metadata.orderRef : undefined;
  return (fromMetadata?.toUpperCase() || orderRefFromReference(tx.reference)) ?? null;
}

/**
 * Applies a successful transaction to its order, then rebuilds storefront
 * pages whose stock changed and emails the customer their receipt. The email
 * goes out after the response, so nobody waits on the mail server.
 */
export async function applySuccessfulPayment(orderRef: string, tx: PaystackTransaction): Promise<PaymentState> {
  const { outcome } = await markOrderPaid(orderRef, {
    reference: tx.reference,
    amountKobo: Number(tx.amount),
    currency: tx.currency,
    channel: tx.channel ?? null,
    paidAt: tx.paid_at ?? null,
  });
  if (outcome === "paid") {
    refreshStorefront();
    after(() => sendOrderReceipt(orderRef));
  }
  return outcome === "amount-mismatch" ? "mismatch" : "paid";
}

/**
 * Asks Paystack how a payment went and records it. Used when the customer
 * comes back from Paystack; the webhook does the same from Paystack's side.
 */
export async function confirmPayment(orderRef: string, reference: string): Promise<PaymentState> {
  const order = await getOrder(orderRef);
  if (!order) return "unknown";
  if (order.payment?.status === "paid") return "paid";
  if (orderRefFromReference(reference) !== order.ref) return "unknown";
  try {
    const tx = await verifyPayment(reference);
    if (tx.status === "success") return applySuccessfulPayment(order.ref, tx);
    if (["failed", "abandoned", "reversed"].includes(tx.status)) return "failed";
    return "processing";
  } catch (error) {
    console.error("Paystack verify failed", error);
    return "processing";
  }
}
