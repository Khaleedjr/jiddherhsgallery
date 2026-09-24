import type { Metadata } from "next";
import Link from "next/link";
import { RankedBars, StatusShare } from "@/components/admin/bars";
import { TrendChart } from "@/components/admin/charts";
import { RangeTabs } from "@/components/admin/range-tabs";
import { AdminPage, Card, StatTile, cx } from "@/components/admin/ui";
import { formatDate, formatNumber, formatPercent } from "@/lib/admin/format";
import { taxonomy } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { buildAnalytics, delta, isRangeKey } from "@/lib/store/analytics";
import { listOrders } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const rangeKey = isRangeKey(rangeParam) ? rangeParam : "30d";
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);
  const a = buildAnalytics(orders, products, taxonomy.departments, rangeKey);
  const { current: c, previous: p } = a;
  const bucketWord = a.range.bucket === "month" ? "month" : a.range.bucket === "week" ? "week" : "day";
  const hasSample = orders.some((o) => o.demo);

  return (
    <AdminPage
      title="Analytics"
      description={`${formatDate(a.range.start.toISOString())} – ${formatDate(a.range.end.toISOString())} · compared with the ${a.range.key === "all" ? "same length of time before" : "period before"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeTabs active={rangeKey} path="/admin/analytics" />
        {hasSample ? <span className="text-[0.74rem] font-semibold text-gold-700">Includes sample orders</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatTile label="Revenue" value={formatPrice(c.revenue)} change={delta(c.revenue, p.revenue)} hint="confirmed orders" />
        <StatTile label="Paid orders" value={formatNumber(c.paid)} change={delta(c.paid, p.paid)} hint={`${formatNumber(c.placed)} placed`} />
        <StatTile label="Average order" value={formatPrice(c.aov)} change={delta(c.aov, p.aov)} />
        <StatTile label="Items sold" value={formatNumber(c.itemsSold)} change={delta(c.itemsSold, p.itemsSold)} />
        <StatTile label="Customers" value={formatNumber(c.customers)} change={delta(c.customers, p.customers)} hint={`${formatNumber(c.newCustomers)} new`} />
        <StatTile
          label="Confirmed rate"
          value={c.paid + c.cancelled ? formatPercent(c.conversion) : "—"}
          change={p.paid + p.cancelled ? delta(c.conversion, p.conversion) : null}
          hint="of orders decided"
        />
      </div>

      <Card title="Revenue" description={`Confirmed, dispatched and delivered orders, per ${bucketWord}`}>
        <TrendChart
          kind="area"
          label={`Revenue per ${bucketWord}`}
          points={a.series.map((s) => ({ key: s.key, label: s.label, value: s.revenue, detail: `${s.paid} paid ${s.paid === 1 ? "order" : "orders"}` }))}
          valueFormat="naira"
          height={260}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Orders placed" description={`Every order, whatever its status, per ${bucketWord}`}>
          <TrendChart
            kind="bar"
            label={`Orders placed per ${bucketWord}`}
            points={a.series.map((s) => ({ key: s.key, label: s.label, value: s.orders, detail: `${s.paid} paid` }))}
            valueFormat="orders"
            height={220}
          />
        </Card>
        <Card title="Order status" description={`${formatNumber(c.placed)} orders in this period`}>
          <StatusShare rows={a.statuses.map(({ status, count }) => ({ status, count }))} />
          {c.pending ? (
            <Link href="/admin/orders?status=pending" className="mt-5 block rounded-lg bg-gold-100 px-3 py-2 text-[0.78rem] font-semibold text-gold-700 hover:bg-gold-200">
              {c.pending} {c.pending === 1 ? "order is" : "orders are"} waiting for confirmation →
            </Link>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Best-selling products" description="By revenue from paid orders">
          <RankedBars
            rows={a.topProducts.map((row) => ({
              key: row.key,
              label: (
                <Link href={`/admin/products/${row.key}`} className="hover:text-forest-700 hover:underline">
                  {row.label}
                </Link>
              ),
              value: row.value,
              detail: `${formatNumber(row.count)} sold`,
            }))}
            format={formatPrice}
            showShare={false}
          />
        </Card>
        <Card title="Sales by department" description="Share of product revenue">
          <RankedBars
            rows={a.categories.map((row) => ({ key: row.key, label: row.label, value: row.value, detail: `${formatNumber(row.count)} items` }))}
            format={formatPrice}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Where orders go" description="Revenue by delivery state">
          <RankedBars
            rows={a.states.map((row) => ({ key: row.key, label: row.label, value: row.value, detail: `${formatNumber(row.count)} ${row.count === 1 ? "order" : "orders"}` }))}
            format={formatPrice}
          />
        </Card>
        <Card title="Busiest days" description="Paid orders by day of the week">
          <RankedBars
            rows={a.weekdays.map((row) => ({ key: row.key, label: row.label, value: row.count, detail: formatPrice(row.value) }))}
            format={(v) => `${formatNumber(v)}`}
          />
        </Card>
        <div className="space-y-6 lg:col-span-2 xl:col-span-1">
          <Card title="How orders arrive">
            <RankedBars rows={a.channels.map((row) => ({ key: row.key, label: row.label, value: row.count }))} format={(v) => formatNumber(v)} />
          </Card>
          <Card title="Customers">
            <dl className="grid grid-cols-2 gap-3 text-center">
              {[
                { label: "New", value: c.newCustomers, hint: "first order in this period" },
                { label: "Returning", value: c.returningCustomers, hint: "ordered before" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-sand-50 px-2 py-3">
                  <dt className="text-[0.7rem] font-semibold tracking-wide text-ink-500 uppercase">{stat.label}</dt>
                  <dd className="mt-1 text-[1.35rem] font-semibold text-ink-900 tabular-nums">{formatNumber(stat.value)}</dd>
                  <dd className="text-[0.68rem] text-ink-500">{stat.hint}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <RankedBars rows={a.fulfilment.map((row) => ({ key: row.key, label: row.label, value: row.count }))} format={(v) => `${formatNumber(v)} orders`} />
            </div>
          </Card>
        </div>
      </div>

      <p className={cx("text-[0.72rem] text-ink-500")}>
        Revenue counts orders once they&apos;re confirmed (paid), including the delivery fee. Pending orders are unconfirmed WhatsApp
        requests, so they appear in &ldquo;Orders placed&rdquo; but not in revenue. Times are Lagos time.
      </p>
    </AdminPage>
  );
}
