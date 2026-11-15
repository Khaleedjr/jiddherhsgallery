import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, Card, OrderStatusBadge, Pill, Thumb, adminButton, cx, td, th } from "@/components/admin/ui";
import { MailIcon, PhoneIcon, WhatsappIcon } from "@/components/icons";
import { CHANNEL_LABEL, formatDate, formatDateTime, whatsappNumber } from "@/lib/admin/format";
import { formatPrice } from "@/lib/format";
import { buildCustomers, phoneKey } from "@/lib/store/customers";
import { PAID_STATUSES, listOrders } from "@/lib/store/orders";

type Params = { key: string };

async function load(key: string) {
  const orders = await listOrders();
  const customer = buildCustomers(orders).find((c) => c.key === key);
  if (!customer) return null;
  return { customer, orders: orders.filter((o) => phoneKey(o.customer.phone) === key) };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load((await params).key);
  return { title: data ? data.customer.name : "Customer not found" };
}

export default async function CustomerPage({ params }: { params: Promise<Params> }) {
  const data = await load((await params).key);
  if (!data) notFound();
  const { customer, orders } = data;

  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const aov = paid.length ? Math.round(customer.spent / paid.length) : 0;
  const favourites = new Map<string, { productId: string; name: string; image: string | null; units: number }>();
  for (const order of paid) {
    for (const item of order.items) {
      const entry = favourites.get(item.productId) ?? { productId: item.productId, name: item.name, image: item.image, units: 0 };
      entry.units += item.quantity;
      favourites.set(item.productId, entry);
    }
  }
  const top = [...favourites.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  const isSample = orders.every((o) => o.demo);

  return (
    <AdminPage
      title={
        <span className="flex flex-wrap items-center gap-3">
          {customer.name}
          {customer.orders > 1 ? <Pill tone="good">Returning</Pill> : <Pill>New</Pill>}
          {isSample ? <Pill>Sample</Pill> : null}
        </span>
      }
      description={`Customer since ${formatDate(customer.firstOrderAt)} · ${[customer.city, customer.state].filter(Boolean).join(", ") || "Collects in Kaduna"}`}
      back={{ href: "/admin/customers", label: "All customers" }}
      actions={
        <a href={`https://wa.me/${whatsappNumber(customer.phone)}`} target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "secondary" })}>
          <WhatsappIcon className="size-4 text-[#1a9e4a]" />
          WhatsApp
        </a>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: "Total spent", value: formatPrice(customer.spent) },
          { label: "Orders", value: String(customer.orders) },
          { label: "Average order", value: formatPrice(aov) },
          { label: "Last order", value: formatDate(customer.lastOrderAt) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-sand-200 bg-white p-4 sm:p-5">
            <p className="text-[0.75rem] font-medium text-ink-500">{stat.label}</p>
            <p className="mt-1.5 font-sans text-[1.35rem] leading-none font-semibold tracking-tight text-ink-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card title="Order history" flush>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead className="border-b border-sand-200 bg-sand-50/60">
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Items</th>
                  <th className={th}>Status</th>
                  <th className={cx(th, "text-right")}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200/80">
                {orders.map((order) => (
                  <tr key={order.ref} className="relative hover:bg-sand-50">
                    <td className={td}>
                      <Link href={`/admin/orders/${order.ref}`} className="font-semibold text-coal-800 after:absolute after:inset-0 hover:underline">
                        {order.ref}
                      </Link>
                      <p className="text-[0.72rem] text-ink-500">
                        {formatDateTime(order.createdAt)} · {CHANNEL_LABEL[order.channel]}
                      </p>
                    </td>
                    <td className={cx(td, "max-w-[14rem]")}>
                      <p className="truncate">{order.items.map((i) => i.name).join(", ")}</p>
                    </td>
                    <td className={td}>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className={cx(td, "text-right font-semibold tabular-nums")}>{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card title="Contact">
            <ul className="space-y-2.5 text-[0.82rem]">
              <li className="flex items-center gap-2.5">
                <PhoneIcon className="size-4 text-ink-400" />
                <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="text-coal-700 hover:underline">
                  {customer.phone}
                </a>
              </li>
              {customer.email ? (
                <li className="flex items-center gap-2.5">
                  <MailIcon className="size-4 shrink-0 text-ink-400" />
                  <a href={`mailto:${customer.email}`} className="break-all text-coal-700 hover:underline">
                    {customer.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </Card>
          <Card title="Favourite products">
            {top.length ? (
              <ul className="space-y-3">
                {top.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3">
                    <Thumb src={item.image} alt="" size={36} />
                    <Link href={`/admin/products/${item.productId}`} className="line-clamp-2 flex-1 text-[0.8rem] font-medium text-ink-800 hover:text-coal-700">
                      {item.name}
                    </Link>
                    <span className="text-[0.74rem] font-semibold text-ink-500 tabular-nums">×{item.units}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.78rem] text-ink-500">Nothing paid for yet.</p>
            )}
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
