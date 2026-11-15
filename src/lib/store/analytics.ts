import { PAID_STATUSES } from "@/lib/store/orders";
import { phoneKey } from "@/lib/store/customers";
import { ORDER_STATUSES, type Order, type OrderStatus, type StoredProduct } from "@/lib/store/types";

/** Nigeria keeps West Africa Time all year (UTC+1, no daylight saving), so a fixed shift is exact. */
const WAT_OFFSET = 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const toWat = (date: Date) => new Date(date.getTime() + WAT_OFFSET);
const fromWat = (date: Date) => new Date(date.getTime() - WAT_OFFSET);
const pad = (n: number) => String(n).padStart(2, "0");

/** Midnight in Lagos, as a real instant. */
const startOfDay = (date: Date) => {
  const wat = toWat(date);
  return fromWat(new Date(Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate())));
};
const startOfMonth = (date: Date) => {
  const wat = toWat(date);
  return fromWat(new Date(Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), 1)));
};

export type Bucket = "day" | "week" | "month";

const bucketKey = (date: Date, bucket: Bucket) => {
  const wat = toWat(date);
  if (bucket === "month") return `${wat.getUTCFullYear()}-${pad(wat.getUTCMonth() + 1)}`;
  if (bucket === "week") {
    const monday = new Date(wat.getTime() - ((wat.getUTCDay() + 6) % 7) * DAY);
    return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
  }
  return `${wat.getUTCFullYear()}-${pad(wat.getUTCMonth() + 1)}-${pad(wat.getUTCDate())}`;
};

export const RANGES = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "12m", label: "Last 12 months" },
  { key: "all", label: "All time" },
] as const;
export type RangeKey = (typeof RANGES)[number]["key"];

export type Range = {
  key: RangeKey;
  label: string;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  bucket: Bucket;
};

export const isRangeKey = (value: unknown): value is RangeKey => RANGES.some((range) => range.key === value);

export function resolveRange(key: RangeKey, orders: Order[], now = new Date()): Range {
  const label = RANGES.find((range) => range.key === key)!.label;
  const end = now;
  let start: Date;
  let bucket: Bucket = "day";
  if (key === "7d") start = new Date(startOfDay(now).getTime() - 6 * DAY);
  else if (key === "30d") start = new Date(startOfDay(now).getTime() - 29 * DAY);
  else if (key === "90d") {
    // Weekly buckets start on a Monday, so the first bar is a whole week rather than a misleading stub.
    const rough = new Date(startOfDay(now).getTime() - 89 * DAY);
    start = new Date(rough.getTime() - ((toWat(rough).getUTCDay() + 6) % 7) * DAY);
    bucket = "week";
  } else {
    bucket = "month";
    const wat = toWat(now);
    const yearAgo = fromWat(new Date(Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth() - 11, 1)));
    if (key === "12m" || !orders.length) start = yearAgo;
    else {
      const earliest = orders.reduce((min, o) => (o.createdAt < min ? o.createdAt : min), orders[0].createdAt);
      start = startOfMonth(new Date(earliest));
      if (start > yearAgo) start = yearAgo;
    }
  }
  const span = end.getTime() - start.getTime();
  return { key, label, start, end, prevStart: new Date(start.getTime() - span), prevEnd: start, bucket };
}

const within = (order: Order, from: Date, to: Date) => {
  const t = new Date(order.createdAt).getTime();
  return t >= from.getTime() && t <= to.getTime();
};

const isPaid = (order: Order) => PAID_STATUSES.includes(order.status);

export type Summary = {
  revenue: number;
  placed: number;
  paid: number;
  pending: number;
  cancelled: number;
  aov: number;
  itemsSold: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  conversion: number;
};

function summarise(orders: Order[], firstOrderAt: Map<string, string>, from: Date, to: Date): Summary {
  const inRange = orders.filter((o) => within(o, from, to));
  const paid = inRange.filter(isPaid);
  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const buyers = new Set(inRange.filter((o) => o.status !== "cancelled").map((o) => phoneKey(o.customer.phone)));
  let newCustomers = 0;
  for (const key of buyers) {
    const first = firstOrderAt.get(key);
    if (first && new Date(first) >= from) newCustomers += 1;
  }
  const decided = inRange.filter((o) => o.status !== "pending").length;
  return {
    revenue,
    placed: inRange.length,
    paid: paid.length,
    pending: inRange.filter((o) => o.status === "pending").length,
    cancelled: inRange.filter((o) => o.status === "cancelled").length,
    aov: paid.length ? Math.round(revenue / paid.length) : 0,
    itemsSold: paid.reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0), 0),
    customers: buyers.size,
    newCustomers,
    returningCustomers: buyers.size - newCustomers,
    conversion: decided ? paid.length / decided : 0,
  };
}

export type SeriesPoint = { key: string; label: string; revenue: number; orders: number; paid: number };

const bucketLabel = (key: string, bucket: Bucket) => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d ?? 1));
  const opts: Intl.DateTimeFormatOptions =
    bucket === "month" ? { month: "short", year: "2-digit", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-GB", opts).format(date);
};

function buildSeries(orders: Order[], range: Range): SeriesPoint[] {
  const points = new Map<string, SeriesPoint>();
  const step = range.bucket === "month" ? 28 * DAY : range.bucket === "week" ? 7 * DAY : DAY;
  for (let t = range.start.getTime(); t <= range.end.getTime(); t += step) {
    const key = bucketKey(new Date(t), range.bucket);
    if (!points.has(key)) points.set(key, { key, label: bucketLabel(key, range.bucket), revenue: 0, orders: 0, paid: 0 });
  }
  const lastKey = bucketKey(range.end, range.bucket);
  if (!points.has(lastKey)) points.set(lastKey, { key: lastKey, label: bucketLabel(lastKey, range.bucket), revenue: 0, orders: 0, paid: 0 });

  for (const order of orders) {
    if (!within(order, range.start, range.end)) continue;
    const point = points.get(bucketKey(new Date(order.createdAt), range.bucket));
    if (!point) continue;
    point.orders += 1;
    if (isPaid(order)) {
      point.paid += 1;
      point.revenue += order.total;
    }
  }
  return [...points.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export type Breakdown = { key: string; label: string; value: number; count: number };

const top = (map: Map<string, Breakdown>, limit: number, otherLabel = "Everything else") => {
  const sorted = [...map.values()].sort((a, b) => b.value - a.value || b.count - a.count);
  if (sorted.length <= limit) return sorted;
  const rest = sorted.slice(limit - 1);
  return [
    ...sorted.slice(0, limit - 1),
    {
      key: "__other",
      label: otherLabel,
      value: rest.reduce((s, r) => s + r.value, 0),
      count: rest.reduce((s, r) => s + r.count, 0),
    },
  ];
};

const bump = (map: Map<string, Breakdown>, key: string, label: string, value: number, count = 1) => {
  const entry = map.get(key) ?? { key, label, value: 0, count: 0 };
  entry.value += value;
  entry.count += count;
  map.set(key, entry);
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type Analytics = ReturnType<typeof buildAnalytics>;

export function buildAnalytics(
  allOrders: Order[],
  products: StoredProduct[],
  departments: Array<{ slug: string; name: string }>,
  rangeKey: RangeKey,
  now = new Date(),
) {
  // Website orders sent to Paystack but never paid aren't sales, or even real orders yet.
  const orders = allOrders.filter((order) => order.payment?.status !== "awaiting");
  const range = resolveRange(rangeKey, orders, now);
  const firstOrderAt = new Map<string, string>();
  for (const order of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (order.status === "cancelled") continue;
    const key = phoneKey(order.customer.phone);
    if (!firstOrderAt.has(key)) firstOrderAt.set(key, order.createdAt);
  }

  const current = summarise(orders, firstOrderAt, range.start, range.end);
  const previous = summarise(orders, firstOrderAt, range.prevStart, range.prevEnd);
  const inRange = orders.filter((o) => within(o, range.start, range.end));
  const paid = inRange.filter(isPaid);

  const productDept = new Map<string, string>();
  for (const product of products) {
    const dept = departments.find((d) => product.categories.includes(d.slug));
    if (dept) productDept.set(product.id, dept.slug);
  }
  const deptName = new Map(departments.map((d) => [d.slug, d.name]));

  const productsSold = new Map<string, Breakdown>();
  const categories = new Map<string, Breakdown>();
  const states = new Map<string, Breakdown>();
  const channels = new Map<string, Breakdown>();
  const fulfilment = new Map<string, Breakdown>();
  const weekdays = WEEKDAYS.map((label) => ({ key: label, label, value: 0, count: 0 }));

  for (const order of paid) {
    for (const item of order.items) {
      const line = item.price * item.quantity;
      bump(productsSold, item.productId, item.name, line, item.quantity);
      const dept = productDept.get(item.productId);
      bump(categories, dept ?? "other", dept ? deptName.get(dept)! : "Other / removed", line, item.quantity);
    }
    if (order.fulfilment === "pickup") bump(states, "pickup", "Pickup — Kaduna", order.total);
    else bump(states, order.shipping.state ?? "unknown", order.shipping.state ?? "Not given", order.total);
    const weekday = (toWat(new Date(order.createdAt)).getUTCDay() + 6) % 7;
    weekdays[weekday].value += order.total;
    weekdays[weekday].count += 1;
  }
  for (const order of inRange) {
    bump(channels, order.channel, order.channel[0].toUpperCase() + order.channel.slice(1), 0);
    bump(fulfilment, order.fulfilment, order.fulfilment === "pickup" ? "Pickup" : "Delivery", 0);
  }

  const statuses = ORDER_STATUSES.map((status) => {
    const matching = inRange.filter((o) => o.status === status);
    return { status, count: matching.length, value: matching.reduce((sum, o) => sum + o.total, 0) };
  });

  return {
    range,
    current,
    previous,
    series: buildSeries(orders, range),
    statuses: statuses as Array<{ status: OrderStatus; count: number; value: number }>,
    topProducts: [...productsSold.values()].sort((a, b) => b.value - a.value).slice(0, 8),
    categories: top(categories, 5),
    states: top(states, 8, "Other states"),
    channels: [...channels.values()].sort((a, b) => b.count - a.count),
    fulfilment: [...fulfilment.values()].sort((a, b) => b.count - a.count),
    weekdays,
  };
}

/** Percentage change, or null when there's no earlier figure to compare with. */
export const delta = (now: number, before: number) => (before > 0 ? (now - before) / before : null);
