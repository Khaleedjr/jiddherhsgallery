import { NextResponse } from "next/server";
import { PaystackError, initializePayment, paymentReference } from "@/lib/paystack";
import { getOrder, setPaymentReference } from "@/lib/store/orders";

/**
 * A new Paystack attempt for an unpaid website order (after a failed or
 * abandoned payment). The caller must send the order's latest payment
 * reference, which only the customer's own return link carries.
 */
export async function POST(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const body = (await request.json().catch(() => ({}))) as { reference?: unknown };
  const order = await getOrder(ref);
  if (!order?.payment || typeof body.reference !== "string" || body.reference !== order.payment.reference || !order.customer.email) {
    return NextResponse.json({ error: "We couldn't find that order." }, { status: 404 });
  }
  if (order.payment.status === "paid") {
    return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "This order was cancelled. Please place a new one." }, { status: 409 });
  }

  try {
    const reference = paymentReference(order.ref);
    const { authorizationUrl } = await initializePayment({
      email: order.customer.email,
      amount: order.total,
      reference,
      callbackUrl: `${new URL(request.url).origin}/api/paystack/callback?order=${order.ref}`,
      orderRef: order.ref,
      customerName: order.customer.name,
    });
    await setPaymentReference(order.ref, reference);
    return NextResponse.json({ authorizationUrl });
  } catch (error) {
    console.error("Paystack initialise failed", error instanceof PaystackError ? error.message : error);
    return NextResponse.json({ error: "We couldn't reach Paystack. Please try again in a moment." }, { status: 502 });
  }
}
