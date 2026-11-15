import { PAID_STATUSES } from "@/lib/store/orders";
import type { Customer, Order } from "@/lib/store/types";

/** One customer per phone number, however they typed it: 0803…, +234 803…, 234803… */
export const phoneKey = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return digits;
};

export function buildCustomers(orders: Order[]): Customer[] {
  const byKey = new Map<string, Customer>();
  const chronological = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const order of chronological) {
    // An unpaid Paystack attempt doesn't make someone a customer.
    if (order.payment?.status === "awaiting") continue;
    const key = phoneKey(order.customer.phone);
    const counted = PAID_STATUSES.includes(order.status) ? order.total : 0;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        key,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        state: order.shipping.state,
        city: order.shipping.city,
        orders: 1,
        spent: counted,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        refs: [order.ref],
      });
      continue;
    }
    // Later orders carry the freshest contact details.
    existing.name = order.customer.name || existing.name;
    existing.phone = order.customer.phone || existing.phone;
    existing.email = order.customer.email ?? existing.email;
    existing.state = order.shipping.state ?? existing.state;
    existing.city = order.shipping.city ?? existing.city;
    existing.orders += 1;
    existing.spent += counted;
    existing.lastOrderAt = order.createdAt;
    existing.refs.push(order.ref);
  }
  return [...byKey.values()].sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}
