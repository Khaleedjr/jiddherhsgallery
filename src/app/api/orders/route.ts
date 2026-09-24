import { NextResponse } from "next/server";
import { OrderError, createOrder, type LineInput } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";

type IncomingItem = {
  productId?: unknown;
  variantId?: unknown;
  slug?: unknown;
  variantLabel?: unknown;
  quantity?: unknown;
};

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * Records a website order before the customer is handed to WhatsApp. Prices
 * always come from the store, never from the browser.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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

  try {
    const order = await createOrder({
      channel: "website",
      customer: { name: text(customer.name, 120), phone: text(customer.phone, 40), email: text(customer.email, 160) || null },
      fulfilment: body.fulfilment === "pickup" ? "pickup" : "delivery",
      shipping: { state: text(shipping.state, 60), city: text(shipping.city, 80), address: text(shipping.address, 300) },
      customerNote: text(body.note, 1000) || null,
      items: lines,
    });
    return NextResponse.json({
      ref: order.ref,
      subtotal: order.subtotal,
      total: order.total,
      items: order.items.map(({ name, variantLabel, price, quantity }) => ({ name, variantLabel, price, quantity })),
    });
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Failed to record order", error);
    return NextResponse.json({ error: "We couldn't record the order." }, { status: 500 });
  }
}
