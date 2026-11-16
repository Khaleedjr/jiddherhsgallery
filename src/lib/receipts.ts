import { isEmailConfigured, sendMail } from "@/lib/email";
import { renderOrderReceipt } from "@/lib/emails/order-receipt";
import { getSiteText } from "@/lib/content/text";
import { getOrder, recordReceipt } from "@/lib/store/orders";

/**
 * Emails a paid order's receipt to the customer. Sent once, automatically,
 * when Paystack confirms the payment; `force` sends it again (the dashboard's
 * "Email receipt" button). Never throws: the outcome is noted on the order.
 */
export async function sendOrderReceipt(ref: string, { force = false } = {}) {
  const order = await getOrder(ref);
  if (!order) return { ok: false, message: "Order not found." };
  if (!order.paidAt) return { ok: false, message: "This order isn't paid yet." };
  if (!order.customer.email) return { ok: false, message: "This order has no email address." };
  if (order.receiptSentAt && !force) return { ok: true, message: "Receipt already sent." };

  if (!isEmailConfigured()) {
    const message = "email isn't set up (add SMTP_USER and SMTP_PASS)";
    // One note is enough: don't repeat it every time the order is touched.
    if (!order.history.some((event) => event.note.endsWith(message))) await recordReceipt(order.ref, { error: message });
    return { ok: false, message: "Email isn't set up yet." };
  }

  try {
    const { store } = await getSiteText();
    await sendMail({ to: order.customer.email, ...renderOrderReceipt(order, store) });
    await recordReceipt(order.ref, { sentTo: order.customer.email });
    return { ok: true, message: `Receipt emailed to ${order.customer.email}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 200) : "unknown error";
    console.error("Receipt email failed", order.ref, message);
    await recordReceipt(order.ref, { error: message });
    return { ok: false, message: `Couldn't send the receipt: ${message}` };
  }
}
