import { isAdmin } from "@/lib/admin/auth";
import { CHANNEL_LABEL, PAYMENT_LABEL, REASON_LABEL, STATUS_META } from "@/lib/admin/format";
import { toStockItems } from "@/lib/admin/stock-items";
import { buildCustomers } from "@/lib/store/customers";
import { listMovements } from "@/lib/store/inventory";
import { listOrders } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/store/types";

type Cell = string | number | null | undefined;

const csv = (rows: Cell[][]) =>
  // The BOM tells Excel the file is UTF-8, so ₦ and Arabic titles survive.
  "﻿" +
  rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? "" : String(cell);
          // Neutralise spreadsheet formulas in user-typed text.
          const safe = /^[=+\-@\t\r]/.test(value) && typeof cell === "string" ? `'${value}` : value;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");

const lagos = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 3_600_000).toISOString().replace("T", " ").slice(0, 16) : "";

async function build(kind: string, params: URLSearchParams): Promise<Cell[][] | null> {
  if (kind === "products") {
    const products = await listProducts();
    return [
      ["ID", "Name", "Status", "SKU", "Price", "Max price", "Was price", "Stock", "In stock", "Options", "Categories", "Age groups", "Tags", "Web address", "Updated"],
      ...products.map((p) => [
        p.id, p.name, p.status, p.sku, p.price, p.priceMax, p.compareAtPrice, p.stock, p.inStock ? "yes" : "no",
        p.variants.map((v) => v.label).join(" | "), p.categories.join(" | "), p.ages.join(" | "), p.tags.join(" | "),
        `/products/${p.slug}`, lagos(p.updatedAt),
      ]),
    ];
  }
  if (kind === "stock") {
    const items = toStockItems(await listProducts(), await listMovements());
    return [
      ["Product ID", "Product", "Option", "SKU", "Stock", "In stock", "Unit price", "Stock value", "Last movement"],
      ...items.map((i) => [i.productId, i.name, i.variantLabel, i.sku, i.stock, i.inStock ? "yes" : "no", i.price, i.stock !== null ? i.stock * i.price : "", lagos(i.lastMovedAt)]),
    ];
  }
  if (kind === "stock-log") {
    const movements = await listMovements();
    return [
      ["When (Lagos)", "Product ID", "Product", "Option", "Reason", "Change", "Before", "After", "Order", "Note"],
      ...movements.map((m) => [lagos(m.at), m.productId, m.productName, m.variantLabel, REASON_LABEL[m.reason], m.change, m.before, m.after, m.orderRef, m.note]),
    ];
  }
  if (kind === "orders") {
    const status = params.get("status");
    const orders = (await listOrders()).filter((o) => !status || !ORDER_STATUSES.includes(status as OrderStatus) || o.status === status);
    return [
      ["Order", "Date (Lagos)", "Status", "Channel", "Customer", "Phone", "Email", "Fulfilment", "State", "City", "Address", "Items", "Units", "Subtotal", "Delivery", "Discount", "Total", "Paid by", "Paid at", "Sample"],
      ...orders.map((o) => [
        o.ref, lagos(o.createdAt), STATUS_META[o.status].label, CHANNEL_LABEL[o.channel], o.customer.name, o.customer.phone, o.customer.email,
        o.fulfilment, o.shipping.state, o.shipping.city, o.shipping.address,
        o.items.map((i) => `${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""} x${i.quantity}`).join(" | "),
        o.items.reduce((n, i) => n + i.quantity, 0), o.subtotal, o.deliveryFee, o.discount, o.total,
        o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod] : "", lagos(o.paidAt), o.demo ? "yes" : "",
      ]),
    ];
  }
  if (kind === "customers") {
    const customers = buildCustomers(await listOrders());
    return [
      ["Name", "Phone", "Email", "State", "City", "Orders", "Spent", "First order", "Last order", "Order refs"],
      ...customers.map((c) => [c.name, c.phone, c.email, c.state, c.city, c.orders, c.spent, lagos(c.firstOrderAt), lagos(c.lastOrderAt), c.refs.join(" ")]),
    ];
  }
  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isAdmin())) return new Response("Please sign in.", { status: 401 });
  const { kind } = await params;
  const rows = await build(kind, new URL(request.url).searchParams);
  if (!rows) return new Response("Unknown export.", { status: 404 });
  const stamp = new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jidderhs-${kind}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
