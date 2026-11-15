import { NextResponse } from "next/server";
import { PaystackError, initializePayment, isPaystackConfigured, paymentReference } from "@/lib/paystack";
import { resolveShipping } from "@/lib/shipping";
import { OrderError, createOrder, deleteOrder, priceLines, setPaymentReference, type LineInput } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";

type IncomingItem = {
  productId?: unknown;
  variantId?: unknown;
  slug?: unknown;
  variantLabel?: unknown;
  quantity?: unknown;
};

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Places a website order and starts its Paystack payment. Prices, the
 * delivery fee and the total always come from the store, never from the
 * browser. The order waits as "awaiting payment" until Paystack confirms it
 * (see /api/paystack/callback and /api/paystack/webhook).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isPaystackConfigured()) {
    console.error("Checkout refused: PAYSTACK_SECRET_KEY is not set.");
    return NextResponse.json(
      { error: "Online payment isn't available right now. Please try again shortly, or message us on WhatsApp." },
      { status: 503 },
    );
  }

  const rawItems = Array.isArray(body.items) ? (body.items as IncomingItem[]).slice(0, 60) : [];
  const products = await listProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: LineInput[] = [];
  for (const item of rawItems) {
    const product =
      (typeof item.productId === "string" && byId.get(item.productId)) ||
      (typeof item.slug === "string" && bySlug.get(item.slug)) ||
      null;
    if (!product || product.status !== "published") {
      return NextResponse.json({ error: "Something in your bag is no longer available. Please review your bag." }, { status: 409 });
    }
    let variantId: string | null = null;
    if (product.variants.length) {
      const variant =
        product.variants.find((v) => v.id === item.variantId) ??
        product.variants.find((v) => v.label === item.variantLabel);
      if (!variant) {
        return NextResponse.json({ error: `${product.name}: that option is no longer available.` }, { status: 409 });
      }
      variantId = variant.id;
    }
    lines.push({ productId: product.id, variantId, quantity: Number(item.quantity) });
  }

  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const shipping = (body.shipping ?? {}) as Record<string, unknown>;
  const fulfilment = body.fulfilment === "pickup" ? "pickup" : "delivery";
  const email = text(customer.email, 160);
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email: Paystack sends your receipt there." }, { status: 400 });
  }

  let order;
  try {
    const subtotal = priceLines(lines, products, false).reduce((sum, item) => sum + item.price * item.quantity, 0);
    const state = text(shipping.state, 60);
    const option = resolveShipping(fulfilment, state, text(shipping.option, 40), subtotal);
    if (!option) {
      return NextResponse.json({ error: "Please choose a delivery option for your state." }, { status: 400 });
    }
    order = await createOrder({
      channel: "website",
      customer: { name: text(customer.name, 120), phone: text(customer.phone, 40), email },
      fulfilment,
      shipping: { state, city: text(shipping.city, 80), address: text(shipping.address, 300), method: option.name },
      deliveryFee: option.cost,
      customerNote: text(body.note, 1000) || null,
      items: lines,
      paymentMethod: "paystack",
      payment: { provider: "paystack", status: "awaiting", reference: "", amount: null, channel: null, paidAt: null },
    });
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Failed to record order", error);
    return NextResponse.json({ error: "We couldn't record the order. Please try again." }, { status: 500 });
  }

  try {
    const reference = paymentReference(order.ref);
    const { authorizationUrl } = await initializePayment({
      email,
      amount: order.total,
      reference,
      callbackUrl: `${new URL(request.url).origin}/api/paystack/callback?order=${order.ref}`,
      orderRef: order.ref,
      customerName: order.customer.name,
    });
    await setPaymentReference(order.ref, reference);
    return NextResponse.json({ ref: order.ref, total: order.total, authorizationUrl });
  } catch (error) {
    // No payment page means no order: don't leave a half-made one in the dashboard.
    await deleteOrder(order.ref).catch(() => undefined);
    console.error("Paystack initialise failed", error instanceof PaystackError ? error.message : error);
    return NextResponse.json(
      { error: "We couldn't reach Paystack to start your payment. Please try again in a moment." },
      { status: 502 },
    );
  }
}
