import { getDriver } from "@/lib/store/driver";
import { adjustStock } from "@/lib/store/inventory";
import { listProducts } from "@/lib/store/products";
import type {
  Order,
  OrderChannel,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  StoredProduct,
} from "@/lib/store/types";

const COLLECTION = "orders";

/** Statuses where the goods are spoken for, so their units are out of stock. */
export const STOCK_OUT_STATUSES: OrderStatus[] = ["confirmed", "dispatched", "delivered"];
/** Statuses that count as money in — pending orders are still unconfirmed WhatsApp requests. */
export const PAID_STATUSES: OrderStatus[] = ["confirmed", "dispatched", "delivered"];

export const orderRef = (seq: number) => `JG-${1000 + seq}`;

export type LineInput = {
  productId: string;
  variantId: string | null;
  quantity: number;
  /** Admin-entered orders may set their own price; website orders never can. */
  price?: number;
};

export type NewOrder = {
  channel: OrderChannel;
  customer: { name: string; phone: string; email?: string | null };
  fulfilment: "delivery" | "pickup";
  shipping?: { state?: string | null; city?: string | null; address?: string | null };
  items: LineInput[];
  customerNote?: string | null;
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: PaymentMethod | null;
  status?: OrderStatus;
  createdAt?: string;
  by?: OrderEvent["by"];
  demo?: boolean;
};

export class OrderError extends Error {}

/** Price each line from the catalogue so a tampered cart can't set its own prices. */
export function priceLines(lines: LineInput[], products: StoredProduct[], allowOverride: boolean): OrderItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new OrderError("One of the items is no longer in the catalogue.");
    const variant = line.variantId ? product.variants.find((v) => v.id === line.variantId) : null;
    if (line.variantId && !variant) throw new OrderError(`${product.name}: that option is no longer available.`);
    if (!line.variantId && product.variants.length) throw new OrderError(`${product.name}: please choose an option.`);
    const quantity = Math.floor(line.quantity);
    if (!(quantity >= 1 && quantity <= 999)) throw new OrderError(`${product.name}: quantity must be at least 1.`);
    const catalogPrice = variant ? (variant.price ?? product.price) : product.price;
    const price = allowOverride && line.price !== undefined && line.price >= 0 ? Math.round(line.price) : catalogPrice;
    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: product.name,
      variantLabel: variant?.label ?? null,
      sku: product.sku,
      image: variant?.image ?? product.images[0] ?? null,
      price,
      quantity,
    };
  });
}

const totals = (items: OrderItem[], deliveryFee: number, discount: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { subtotal, total: Math.max(0, subtotal + deliveryFee - discount) };
};

export async function listOrders(): Promise<Order[]> {
  const all = await getDriver().all<Order>(COLLECTION);
  return Object.values(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(ref: string) {
  return getDriver().get<Order>(COLLECTION, ref.toUpperCase());
}

async function writeOrder(order: Order) {
  await getDriver().put(COLLECTION, { [order.ref]: order });
  return order;
}

/** Move stock in or out so it matches what the order's status says should have happened. */
async function syncStock(order: Order, reason: string): Promise<Order> {
  const shouldBeOut = STOCK_OUT_STATUSES.includes(order.status);
  if (order.demo || shouldBeOut === order.stockDeducted) return order;
  for (const item of order.items) {
    await adjustStock({
      productId: item.productId,
      variantId: item.variantId,
      mode: "change",
      amount: shouldBeOut ? -item.quantity : item.quantity,
      reason: shouldBeOut ? "sale" : "return",
      note: reason,
      orderRef: order.ref,
      skipUntracked: true,
    });
  }
  return { ...order, stockDeducted: shouldBeOut };
}

export async function createOrder(input: NewOrder): Promise<Order> {
  if (!input.items.length) throw new OrderError("The order has no items.");
  const name = input.customer.name.trim();
  const phone = input.customer.phone.trim();
  if (!name) throw new OrderError("Customer name is required.");
  if (!/^[0-9+\s()-]{7,}$/.test(phone)) throw new OrderError("A reachable phone number is required.");

  const products = await listProducts();
  const items = priceLines(input.items, products, input.channel !== "website");
  const deliveryFee = Math.max(0, Math.round(input.deliveryFee ?? 0));
  const discount = Math.max(0, Math.round(input.discount ?? 0));
  const status = input.status ?? "pending";
  const now = input.createdAt ?? new Date().toISOString();
  const seq = await getDriver().incr("order");

  const placedBy = input.by ?? (input.channel === "website" ? "customer" : "admin");
  let order: Order = {
    id: String(seq),
    ref: orderRef(seq),
    createdAt: now,
    updatedAt: now,
    status,
    channel: input.channel,
    customer: { name, phone, email: input.customer.email?.trim() || null },
    fulfilment: input.fulfilment,
    shipping:
      input.fulfilment === "pickup"
        ? { state: null, city: null, address: null }
        : {
            state: input.shipping?.state?.trim() || null,
            city: input.shipping?.city?.trim() || null,
            address: input.shipping?.address?.trim() || null,
          },
    items,
    ...totals(items, deliveryFee, discount),
    deliveryFee,
    discount,
    paymentMethod: input.paymentMethod ?? null,
    paidAt: PAID_STATUSES.includes(status) ? now : null,
    customerNote: input.customerNote?.trim() || null,
    history: [
      {
        at: now,
        status,
        note: input.channel === "website" ? "Order placed on the website" : `Order recorded from ${input.channel}`,
        by: placedBy,
      },
    ],
    stockDeducted: false,
    ...(input.demo ? { demo: true } : {}),
  };
  order = await syncStock(order, `Order ${order.ref}`);
  return writeOrder(order);
}

export async function setOrderStatus(ref: string, status: OrderStatus, note?: string) {
  const current = await getOrder(ref);
  if (!current) throw new OrderError("Order not found.");
  if (current.status === status) return current;
  const now = new Date().toISOString();
  let order: Order = {
    ...current,
    status,
    updatedAt: now,
    paidAt: PAID_STATUSES.includes(status) ? (current.paidAt ?? now) : status === "cancelled" ? null : current.paidAt,
    history: [...current.history, { at: now, status, note: note?.trim() || "", by: "admin" }],
  };
  order = await syncStock(
    order,
    status === "cancelled" ? `Order ${order.ref} cancelled` : `Order ${order.ref} marked ${status}`,
  );
  return writeOrder(order);
}

export type OrderPatch = {
  customer?: Order["customer"];
  fulfilment?: Order["fulfilment"];
  shipping?: Order["shipping"];
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: PaymentMethod | null;
};

export async function updateOrder(ref: string, patch: OrderPatch) {
  const current = await getOrder(ref);
  if (!current) throw new OrderError("Order not found.");
  const deliveryFee = Math.max(0, Math.round(patch.deliveryFee ?? current.deliveryFee));
  const discount = Math.max(0, Math.round(patch.discount ?? current.discount));
  const next: Order = {
    ...current,
    ...patch,
    deliveryFee,
    discount,
    ...totals(current.items, deliveryFee, discount),
    updatedAt: new Date().toISOString(),
  };
  return writeOrder(next);
}

export async function addOrderNote(ref: string, note: string) {
  const current = await getOrder(ref);
  if (!current) throw new OrderError("Order not found.");
  const now = new Date().toISOString();
  return writeOrder({
    ...current,
    updatedAt: now,
    history: [...current.history, { at: now, status: null, note: note.trim(), by: "admin" }],
  });
}

/** Deleting puts any units the order took back on the shelf first. */
export async function deleteOrder(ref: string) {
  const current = await getOrder(ref);
  if (!current) return;
  if (current.stockDeducted) await syncStock({ ...current, status: "cancelled" }, `Order ${current.ref} deleted`);
  await getDriver().remove(COLLECTION, [current.ref]);
}

export async function deleteDemoOrders() {
  const demo = (await listOrders()).filter((order) => order.demo).map((order) => order.ref);
  await getDriver().remove(COLLECTION, demo);
  return demo.length;
}
