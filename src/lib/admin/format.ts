import type { OrderChannel, OrderStatus, PaymentMethod, StockReason } from "@/lib/store/types";

const TZ = "Africa/Lagos";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const number = new Intl.NumberFormat("en-NG");

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
export const formatNumber = (value: number) => number.format(value);

export const formatPercent = (value: number, digits = 0) =>
  `${(value * 100).toFixed(digits).replace(/\.0+$/, "")}%`;

/** ₦1.2m, ₦450k, ₦900 — for chart axes and tight tiles. */
export const formatNairaCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `₦${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  if (abs >= 1_000) return `₦${(value / 1_000).toFixed(abs >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `₦${Math.round(value)}`;
};

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export const STATUS_META: Record<OrderStatus, { label: string; hint: string }> = {
  pending: { label: "Pending", hint: "Awaiting confirmation and payment" },
  confirmed: { label: "Confirmed", hint: "Paid — ready to pack" },
  dispatched: { label: "Dispatched", hint: "Handed to the courier or ready for pickup" },
  delivered: { label: "Delivered", hint: "In the customer's hands" },
  cancelled: { label: "Cancelled", hint: "Will not be fulfilled" },
};

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  "walk-in": "Walk-in",
  other: "Other",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  transfer: "Bank transfer",
  cash: "Cash",
  pos: "POS",
  other: "Other",
};

export const REASON_LABEL: Record<StockReason, string> = {
  restock: "Restock",
  sale: "Sale",
  return: "Returned",
  correction: "Stock count",
  damaged: "Damaged / lost",
  initial: "Opening stock",
};

/** wa.me wants international digits only: 0803… becomes 234803… */
export const whatsappNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return digits;
};
