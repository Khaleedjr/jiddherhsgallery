import { formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/content/format";
import type { SiteText } from "@/lib/content/schema";
import { site } from "@/lib/site";
import type { Order } from "@/lib/store/types";

/**
 * The receipt emailed to a customer once their payment is confirmed. Built as
 * email HTML (tables, inline styles, system fonts) in the site's colours, with
 * a plain-text twin for clients that don't show HTML. Everything the customer
 * typed is escaped.
 */

const GOLD = "#cd9a32";
const INK = "#14110a";
const MUTED = "#6f6450";
const PAPER = "#fffdf8";
const CREAM = "#f1e7cf";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Where this site actually lives, for the logo and links. SITE_URL wins;
 * on Vercel the project's production domain is used; site.url last (it still
 * points at the old WordPress shop until the domain moves over).
 */
function baseUrl() {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : site.url;
}

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const lagos = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const OFFLINE_METHOD: Record<string, string> = { transfer: "bank transfer", cash: "cash", pos: "POS" };

const paidWith = (order: Order) => {
  if (order.payment?.status !== "paid") return OFFLINE_METHOD[order.paymentMethod ?? ""] ?? null;
  const channel = order.payment.channel?.replace(/_/g, " ");
  return channel ? `Paystack (${channel})` : "Paystack";
};

/** `store` is the dashboard's store details (phone, pickup times), so the email matches the site. */
export function renderOrderReceipt(order: Order, store: SiteText["store"]) {
  const base = baseUrl();
  const firstName = order.customer.name.trim().split(/\s+/)[0] || order.customer.name;
  const pickup = order.fulfilment === "pickup";
  const paidAt = order.paidAt ?? order.updatedAt;
  const deliveryLabel = order.shipping.method ?? (pickup ? "Pickup in Kaduna" : "Delivery");
  const deliveryAmount = order.deliveryFee ? formatPrice(order.deliveryFee) : "Free";
  const nextStep = pickup
    ? `Pick up in ${site.address.city} (${store.pickupDays}, ${store.pickupTime}). Please call ${store.phoneDisplay} at least an hour before coming, and have ${order.ref} ready.`
    : order.shipping.state === site.address.city
      ? `We dispatch within ${store.dispatchHours} hours and will call ${order.customer.phone} before we deliver.`
      : `We dispatch within ${store.dispatchHours} hours. Interstate parcels leave on ${store.interstateDays}, and we will message ${order.customer.phone} with the driver's details.`;
  const address = pickup
    ? []
    : [order.shipping.address, [order.shipping.city, order.shipping.state].filter(Boolean).join(", ")].filter(Boolean) as string[];
  const help = whatsappHref(store.whatsapp, `As-salamu alaykum ${site.name}, a question about my order ${order.ref}.`);

  const method = paidWith(order);
  const reference = order.payment?.status === "paid" ? order.payment.reference : "";
  const paymentLine = [
    method ? `Paid with ${escape(method)}` : "",
    reference ? `<span style="white-space:nowrap;">Ref ${escape(reference)}</span>` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const subject = `Order ${order.ref} confirmed: your receipt from ${site.name}`;

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${CREAM};font:15px/1.4 ${FONT};color:${INK};">
            <strong style="font-weight:600;">${escape(item.name)}</strong>${
              item.variantLabel ? `<br><span style="color:${MUTED};font-size:13px;">${escape(item.variantLabel)}</span>` : ""
            }<br><span style="color:${MUTED};font-size:13px;">${item.quantity} × ${formatPrice(item.price)}</span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${CREAM};font:600 15px/1.4 ${FONT};color:${INK};white-space:nowrap;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
        <tr>
          <td style="padding:${strong ? "12px" : "4px"} 0 0;font:${strong ? "700 17px" : "14px"}/1.4 ${FONT};color:${strong ? INK : MUTED};">${label}</td>
          <td align="right" style="padding:${strong ? "12px" : "4px"} 0 0;font:${strong ? "700 17px" : "14px"}/1.4 ${FONT};color:${INK};white-space:nowrap;">${value}</td>
        </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
<div style="display:none;max-height:0;overflow:hidden;">Thank you for your order. Here is your receipt for ${order.ref}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PAPER};border-radius:20px;overflow:hidden;">
      <tr><td align="center" style="background:${GOLD};padding:28px 24px 22px;">
        <img src="${base}/logo.png" width="72" height="72" alt="${escape(site.name)}" style="display:block;border-radius:50%;border:1px solid ${INK};">
        <p style="margin:12px 0 0;font:600 12px/1 ${FONT};letter-spacing:3px;text-transform:uppercase;color:${INK};">Order confirmed</p>
      </td></tr>
      <tr><td style="padding:28px 28px 8px;">
        <h1 style="margin:0;font:700 26px/1.2 ${FONT};color:${INK};">Thank you, ${escape(firstName)}</h1>
        <p style="margin:10px 0 0;font:15px/1.6 ${FONT};color:${MUTED};">Your payment went through and your order is confirmed. Keep this email as your receipt.</p>
      </td></tr>
      <tr><td style="padding:16px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border-radius:14px;">
          <tr>
            <td style="padding:14px 16px;font:13px/1.5 ${FONT};color:${MUTED};">Order<br><strong style="font:700 16px/1.4 ${FONT};color:${INK};">${order.ref}</strong></td>
            <td style="padding:14px 16px;font:13px/1.5 ${FONT};color:${MUTED};">Paid<br><strong style="font:600 14px/1.4 ${FONT};color:${INK};">${lagos(paidAt)}</strong></td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0 16px 14px;font:13px/1.5 ${FONT};color:${MUTED};">${paymentLine || "&nbsp;"}</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="padding:20px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
          ${totalRow("Subtotal", formatPrice(order.subtotal))}
          ${totalRow(escape(deliveryLabel), deliveryAmount)}
          ${order.discount ? totalRow("Discount", `−${formatPrice(order.discount)}`) : ""}
          ${totalRow("Total paid", formatPrice(order.total), true)}
        </table>
      </td></tr>
      <tr><td style="padding:24px 28px 0;">
        <p style="margin:0;font:600 12px/1 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${INK};">${pickup ? "Pickup" : "Delivering to"}</p>
        <p style="margin:8px 0 0;font:15px/1.6 ${FONT};color:${INK};">${escape(order.customer.name)}<br>${
          pickup ? `${escape(site.address.city)}, ${escape(store.state)}<br>` : address.map((line) => `${escape(line)}<br>`).join("")
        }${escape(order.customer.phone)}</p>
        <p style="margin:12px 0 0;font:15px/1.6 ${FONT};color:${MUTED};">${escape(nextStep)}</p>
        ${order.customerNote ? `<p style="margin:12px 0 0;font:14px/1.6 ${FONT};color:${MUTED};"><strong style="color:${INK};">Your note:</strong> ${escape(order.customerNote)}</p>` : ""}
      </td></tr>
      <tr><td style="padding:28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${CREAM};">
          <tr><td style="padding-top:20px;font:14px/1.6 ${FONT};color:${MUTED};">
            Questions about your order? Reply to this email, message us on <a href="${help}" style="color:${INK};font-weight:600;">WhatsApp</a> or call ${store.phoneDisplay}.
          </td></tr>
          <tr><td style="padding-top:16px;">
            <a href="${base}/shop" style="display:inline-block;background:${INK};color:${GOLD};font:600 14px/1 ${FONT};text-decoration:none;padding:14px 22px;border-radius:999px;">Continue shopping</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font:12px/1.6 ${FONT};color:${MUTED};">${escape(site.name)} · ${escape(store.tagline)} · ${escape(store.state)}, ${escape(store.country)}</p>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Thank you, ${firstName}.`,
    `Your payment went through and order ${order.ref} is confirmed. Keep this email as your receipt.`,
    "",
    `Order: ${order.ref}`,
    `Paid: ${lagos(paidAt)}${method ? ` with ${method}` : ""}`,
    ...(reference ? [`Payment ref: ${reference}`] : []),
    "",
    ...order.items.map(
      (item) => `- ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`,
    ),
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `${deliveryLabel}: ${deliveryAmount}`,
    ...(order.discount ? [`Discount: -${formatPrice(order.discount)}`] : []),
    `Total paid: ${formatPrice(order.total)}`,
    "",
    pickup ? "Pickup:" : "Delivering to:",
    order.customer.name,
    ...(pickup ? [`${site.address.city}, ${store.state}`] : address),
    order.customer.phone,
    "",
    nextStep,
    ...(order.customerNote ? ["", `Your note: ${order.customerNote}`] : []),
    "",
    `Questions? Reply to this email, or WhatsApp or call us on ${store.phoneDisplay}.`,
    `${site.name} · ${base}`,
  ].join("\n");

  return { subject, html, text };
}
