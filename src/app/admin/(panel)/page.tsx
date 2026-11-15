import type { Metadata } from "next";
import Link from "next/link";
import { RankedBars } from "@/components/admin/bars";
import { TrendChart } from "@/components/admin/charts";
import { SubmitButton } from "@/components/admin/controls";
import { AlertIcon, BoxIcon, ClockIcon, ReceiptIcon } from "@/components/admin/icons";
import { AdminLink, AdminPage, Card, OrderStatusBadge, Pill, StatTile, Thumb, adminButton, cx, td, th } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { clearSampleDataAction, loadSampleDataAction } from "@/lib/admin/actions/orders";
import { formatNumber, timeAgo } from "@/lib/admin/format";
import { stockState, toStockItems } from "@/lib/admin/stock-items";
import { taxonomy } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { buildAnalytics, delta } from "@/lib/store/analytics";
import { listMovements } from "@/lib/store/inventory";
import { isAwaitingPayment, listOrders } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";

export const metadata: Metadata = { title: "Overview" };

const greeting = () => {
  const hour = (new Date().getUTCHours() + 1) % 24;
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ sample?: string }> }) {
  const { sample } = await searchParams;
  const [orders, products, movements] = await Promise.all([listOrders(), listProducts(), listMovements()]);
  const week = buildAnalytics(orders, products, taxonomy.departments, "7d");
  const month = buildAnalytics(orders, products, taxonomy.departments, "30d");
  const { current: c, previous: p } = week;

  // Unpaid Paystack attempts aren't orders to confirm yet.
  const pending = orders.filter((o) => o.status === "pending" && !isAwaitingPayment(o));
  const toShip = orders.filter((o) => o.status === "confirmed");
  const published = products.filter((pr) => pr.status === "published");
  const items = toStockItems(published, movements).map((i) => ({ ...i, state: stockState(i) }));
  const restock = items
    .filter((i) => i.state === "low" || i.state === "out")
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 6);
  const outCount = items.filter((i) => i.state === "out").length;
  const lowCount = items.filter((i) => i.state === "low").length;
  const hasDemo = orders.some((o) => o.demo);
  const hasReal = orders.some((o) => !o.demo);
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date());

  return (
    <AdminPage
      title={`${greeting()}`}
      description={`${today} · here's how the gallery is doing.`}
      actions={
        <>
          <AdminLink href="/admin/orders/new" variant="secondary">
            <PlusIcon className="size-4" />
            Record order
          </AdminLink>
          <AdminLink href="/admin/products/new">
            <PlusIcon className="size-4" />
            Add product
          </AdminLink>
        </>
      }
    >
      {sample === "cleared" ? (
        <p role="status" className="rounded-lg border border-coal-200 bg-coal-50 px-4 py-2.5 text-[0.8rem] font-medium text-coal-700">
          Sample data removed.
        </p>
      ) : null}

      {!orders.length ? (
        <div className="flex flex-col gap-4 rounded-xl border border-sand-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.95rem] font-semibold text-ink-900">No orders yet</p>
            <p className="mt-0.5 max-w-xl text-[0.8rem] text-ink-500">
              Website orders land here automatically. Want to see the dashboard in action first? Load sample orders — they never touch
              real stock and can be removed in one click.
            </p>
          </div>
          <form action={loadSampleDataAction}>
            <SubmitButton className={adminButton({ variant: "gold" })} pendingLabel="Loading…">
              Explore with sample data
            </SubmitButton>
          </form>
        </div>
      ) : hasDemo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold-300/70 bg-gold-100 px-4 py-3 text-[0.8rem] text-gold-700">
          <p>
            <strong className="font-semibold">You&apos;re looking at sample data.</strong>
            {hasReal ? " Real orders are mixed in." : " Real orders will appear alongside."}
          </p>
          <form action={clearSampleDataAction}>
            <SubmitButton className={adminButton({ variant: "secondary", size: "sm" })} pendingLabel="Removing…">
              Remove sample data
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/orders?status=pending", Icon: ClockIcon, count: pending.length, label: "to confirm", hint: "pending orders", tone: pending.length ? "bg-gold-100 text-gold-700" : "bg-sand-100 text-ink-500" },
          { href: "/admin/orders?status=confirmed", Icon: ReceiptIcon, count: toShip.length, label: "to dispatch", hint: "paid, not yet sent", tone: toShip.length ? "bg-sky-50 text-sky-800" : "bg-sand-100 text-ink-500" },
          { href: "/admin/inventory", Icon: outCount ? AlertIcon : BoxIcon, count: outCount, label: "out of stock", hint: `${lowCount} more running low`, tone: outCount ? "bg-berry-500/8 text-berry-600" : "bg-sand-100 text-ink-500" },
        ].map(({ href, Icon, count, label, hint, tone }) => (
          <Link key={href} href={href} className="flex items-center gap-4 rounded-xl border border-sand-200 bg-white p-4 transition hover:border-sand-400">
            <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl", tone)}>
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-[1.05rem] font-semibold text-ink-900">
                <span className="tabular-nums">{count}</span> {label}
              </span>
              <span className="block text-[0.74rem] text-ink-500">{hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-sans text-[0.8rem] font-semibold tracking-normal text-ink-500">Last 7 days, compared with the 7 before</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatTile label="Revenue" value={formatPrice(c.revenue)} change={delta(c.revenue, p.revenue)} href="/admin/analytics?range=7d" />
          <StatTile label="Orders placed" value={formatNumber(c.placed)} change={delta(c.placed, p.placed)} hint={`${c.paid} paid`} />
          <StatTile label="Average order" value={formatPrice(c.aov)} change={delta(c.aov, p.aov)} />
          <StatTile label="New customers" value={formatNumber(c.newCustomers)} change={delta(c.newCustomers, p.newCustomers)} href="/admin/customers?sort=new" />
        </div>
      </div>

      <Card
        title="Revenue, last 30 days"
        description={`${formatPrice(month.current.revenue)} from ${month.current.paid} paid orders`}
        action={
          <Link href="/admin/analytics" className="text-[0.78rem] font-semibold text-coal-700 hover:underline">
            Full analytics →
          </Link>
        }
      >
        <TrendChart
          kind="area"
          label="Revenue per day, last 30 days"
          points={month.series.map((s) => ({ key: s.key, label: s.label, value: s.revenue, detail: `${s.paid} paid` }))}
          valueFormat="naira"
          height={230}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Card
          title="Recent orders"
          flush
          action={
            <Link href="/admin/orders" className="text-[0.78rem] font-semibold text-coal-700 hover:underline">
              All orders →
            </Link>
          }
        >
          {orders.length ? (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[34rem]">
                <thead className="border-b border-sand-200 bg-sand-50/60">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Customer</th>
                    <th className={th}>Status</th>
                    <th className={cx(th, "text-right")}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/80">
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.ref} className="relative hover:bg-sand-50">
                      <td className={td}>
                        <Link href={`/admin/orders/${order.ref}`} className="font-semibold text-coal-800 after:absolute after:inset-0 hover:underline">
                          {order.ref}
                        </Link>
                        <p className="text-[0.72rem] text-ink-500">{timeAgo(order.createdAt)}</p>
                      </td>
                      <td className={td}>
                        <span className="text-ink-900">{order.customer.name}</span>
                        {order.demo ? <Pill className="ml-1.5 py-0">Sample</Pill> : null}
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
          ) : (
            <p className="px-5 py-10 text-center text-[0.8rem] text-ink-500">Orders will show up here.</p>
          )}
        </Card>

        <div className="min-w-0 space-y-6">
          <Card
            title="Needs restocking"
            action={
              <Link href="/admin/inventory" className="text-[0.78rem] font-semibold text-coal-700 hover:underline">
                Inventory →
              </Link>
            }
          >
            {restock.length ? (
              <ul className="space-y-3">
                {restock.map((item) => (
                  <li key={item.key} className="flex items-center gap-3">
                    <Thumb src={item.image} alt="" size={36} />
                    <Link href={`/admin/products/${item.productId}`} className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-[0.8rem] font-medium text-ink-800 hover:text-coal-700">{item.name}</span>
                      {item.variantLabel ? <span className="block text-[0.7rem] text-ink-500">{item.variantLabel}</span> : null}
                    </Link>
                    {item.state === "out" ? <Pill tone="bad">Out</Pill> : <Pill tone="warn">{item.stock} left</Pill>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-[0.8rem] text-ink-500">Everything is well stocked.</p>
            )}
          </Card>
          <Card title="Top sellers this month">
            <RankedBars
              rows={month.topProducts.slice(0, 5).map((row) => ({ key: row.key, label: row.label, value: row.value, detail: `${row.count} sold` }))}
              format={formatPrice}
              showShare={false}
              empty="No paid orders in the last 30 days."
            />
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
