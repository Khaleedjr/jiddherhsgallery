import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect, SubmitButton } from "@/components/admin/controls";
import { DownloadIcon, SearchIcon } from "@/components/admin/icons";
import { PlusIcon } from "@/components/icons";
import {
  AdminLink,
  AdminPage,
  Card,
  Empty,
  OrderStatusBadge,
  Pagination,
  Pill,
  adminButton,
  cx,
  inputClass,
  pageParam,
  td,
  th,
  withQuery,
} from "@/components/admin/ui";
import { clearSampleDataAction, loadSampleDataAction } from "@/lib/admin/actions/orders";
import { CHANNEL_LABEL, STATUS_META, formatDateTime, timeAgo } from "@/lib/admin/format";
import { formatPrice } from "@/lib/format";
import { listOrders } from "@/lib/store/orders";
import { ORDER_CHANNELS, ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/store/types";

export const metadata: Metadata = { title: "Orders" };

const PER_PAGE = 25;
type Query = { status?: string; q?: string; channel?: string; fulfilment?: string; from?: string; to?: string; sort?: string; page?: string; deleted?: string };

/** Dates in the filter are Lagos calendar days (UTC+1 all year). */
const watDayStart = (day: string) => new Date(`${day}T00:00:00+01:00`).getTime();

const SORTS: Record<string, (a: Order, b: Order) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  "total-desc": (a, b) => b.total - a.total,
  "total-asc": (a, b) => a.total - b.total,
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const status = ORDER_STATUSES.includes(query.status as OrderStatus) ? (query.status as OrderStatus) : null;
  const channel = ORDER_CHANNELS.includes(query.channel as never) ? query.channel! : "";
  const fulfilment = query.fulfilment === "pickup" || query.fulfilment === "delivery" ? query.fulfilment : "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(query.from ?? "") ? query.from! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(query.to ?? "") ? query.to! : "";
  const sort = query.sort && SORTS[query.sort] ? query.sort : "newest";
  const q = (query.q ?? "").trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");

  const orders = await listOrders();
  const hasDemo = orders.some((o) => o.demo);
  const hasReal = orders.some((o) => !o.demo);

  const scoped = orders
    .filter((o) => !channel || o.channel === channel)
    .filter((o) => !fulfilment || o.fulfilment === fulfilment)
    .filter((o) => !from || new Date(o.createdAt).getTime() >= watDayStart(from))
    .filter((o) => !to || new Date(o.createdAt).getTime() < watDayStart(to) + 86_400_000)
    .filter(
      (o) =>
        !q ||
        o.ref.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        (o.customer.email ?? "").toLowerCase().includes(q) ||
        (qDigits.length >= 4 && o.customer.phone.replace(/\D/g, "").includes(qDigits)) ||
        o.items.some((i) => i.name.toLowerCase().includes(q)),
    );
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, scoped.filter((o) => o.status === s).length]));
  const filtered = scoped.filter((o) => !status || o.status === status).sort(SORTS[sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pageParam(query.page), pages);
  const current = {
    status: status ?? undefined,
    q: query.q,
    channel: channel || undefined,
    fulfilment: fulfilment || undefined,
    from: from || undefined,
    to: to || undefined,
    sort: sort === "newest" ? undefined : sort,
  };
  const filtersOn = Boolean(q || channel || fulfilment || from || to);

  const tabs: Array<{ key: OrderStatus | null; label: string; count: number }> = [
    { key: null, label: "All", count: scoped.length },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] })),
  ];

  return (
    <AdminPage
      title="Orders"
      description={`${orders.length} orders · ${counts.pending ?? 0} waiting for confirmation`}
      actions={
        <>
          <a href={withQuery("/admin/export/orders", current, {})} className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-4 text-[0.82rem] font-semibold text-ink-800 transition hover:border-sand-400">
            <DownloadIcon className="size-4" />
            Export CSV
          </a>
          <AdminLink href="/admin/orders/new">
            <PlusIcon className="size-4" />
            Record an order
          </AdminLink>
        </>
      }
    >
      {query.deleted ? (
        <p role="status" className="rounded-lg border border-coal-200 bg-coal-50 px-4 py-2.5 text-[0.8rem] font-medium text-coal-700">
          Order deleted. Any stock it had taken was put back.
        </p>
      ) : null}
      {hasDemo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold-300/70 bg-gold-100 px-4 py-3 text-[0.8rem] text-gold-700">
          <p>
            <strong className="font-semibold">Sample orders are showing.</strong> They&apos;re marked “Sample”, never touch real stock, and
            can be removed in one click.
          </p>
          <form action={clearSampleDataAction}>
            <SubmitButton className={adminButton({ variant: "secondary", size: "sm" })} pendingLabel="Removing…">
              Remove sample data
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <Card flush>
        <div className="flex gap-1 overflow-x-auto border-b border-sand-200 px-3 pt-2" role="tablist" aria-label="Filter by status">
          {tabs.map((tab) => {
            const active = tab.key === status;
            return (
              <Link
                key={tab.label}
                href={withQuery("/admin/orders", current, { status: tab.key, page: null })}
                role="tab"
                aria-selected={active}
                className={cx(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.8rem] font-semibold whitespace-nowrap transition",
                  active ? "border-coal-700 text-coal-800" : "border-transparent text-ink-500 hover:text-ink-800",
                )}
              >
                {tab.label}
                <span
                  className={cx(
                    "rounded-full px-1.5 text-[0.68rem] tabular-nums",
                    tab.key === "pending" && tab.count ? "bg-gold-400 text-coal-950" : active ? "bg-coal-100 text-coal-800" : "bg-sand-200 text-ink-600",
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form className="grid gap-2 border-b border-sand-200 p-3 md:grid-cols-2 xl:grid-cols-[1fr_9rem_9rem_9.5rem_9.5rem_10rem]" action="/admin/orders">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label className="relative md:col-span-2 xl:col-span-1">
            <span className="sr-only">Search orders</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input name="q" defaultValue={query.q ?? ""} placeholder="Order ref, name, phone, email or product…" className={cx(inputClass, "pl-9")} />
          </label>
          <AutoSubmitSelect name="channel" defaultValue={channel} aria-label="Channel">
            <option value="">All channels</option>
            {ORDER_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABEL[c]}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="fulfilment" defaultValue={fulfilment} aria-label="Fulfilment">
            <option value="">Delivery & pickup</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </AutoSubmitSelect>
          <label className="flex items-center gap-1.5">
            <span className="text-[0.72rem] font-semibold text-ink-500">From</span>
            <input type="date" name="from" defaultValue={from} className={cx(inputClass, "py-1.5")} />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-[0.72rem] font-semibold text-ink-500">To</span>
            <input type="date" name="to" defaultValue={to} className={cx(inputClass, "py-1.5")} />
          </label>
          <AutoSubmitSelect name="sort" defaultValue={sort} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total-desc">Largest total</option>
            <option value="total-asc">Smallest total</option>
          </AutoSubmitSelect>
          <div className="flex items-center gap-2 md:col-span-2 xl:col-span-6">
            <button type="submit" className={adminButton({ variant: "secondary", size: "sm" })}>
              Apply filters
            </button>
            {filtersOn ? (
              <Link href={withQuery("/admin/orders", { status: status ?? undefined }, {})} className="text-[0.76rem] font-semibold text-coal-700 hover:underline">
                Clear filters
              </Link>
            ) : null}
          </div>
        </form>

        {filtered.length ? (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[56rem]">
                <thead className="border-b border-sand-200 bg-sand-50/60">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Customer</th>
                    <th className={th}>Items</th>
                    <th className={th}>Status</th>
                    <th className={th}>Delivery</th>
                    <th className={cx(th, "text-right")}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/80">
                  {filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((order) => {
                    const units = order.items.reduce((n, i) => n + i.quantity, 0);
                    return (
                      <tr key={order.ref} className="group relative transition hover:bg-sand-50">
                        <td className={td}>
                          <Link href={`/admin/orders/${order.ref}`} className="font-semibold text-coal-800 after:absolute after:inset-0 hover:underline">
                            {order.ref}
                          </Link>
                          <p className="mt-0.5 text-[0.72rem] whitespace-nowrap text-ink-500" title={formatDateTime(order.createdAt)}>
                            {timeAgo(order.createdAt)} · {CHANNEL_LABEL[order.channel]}
                          </p>
                        </td>
                        <td className={td}>
                          <p className="font-medium text-ink-900">
                            {order.customer.name}
                            {order.demo ? <Pill className="ml-1.5 py-0">Sample</Pill> : null}
                          </p>
                          <p className="text-[0.72rem] text-ink-500">{order.customer.phone}</p>
                        </td>
                        <td className={cx(td, "max-w-[16rem]")}>
                          <p className="truncate text-ink-800">{order.items[0]?.name}</p>
                          <p className="text-[0.72rem] text-ink-500">
                            {units} {units === 1 ? "item" : "items"}
                            {order.items.length > 1 ? ` · +${order.items.length - 1} more` : ""}
                          </p>
                        </td>
                        <td className={td}>
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className={cx(td, "text-[0.78rem] text-ink-600")}>
                          {order.fulfilment === "pickup" ? "Pickup · Kaduna" : [order.shipping.city, order.shipping.state].filter(Boolean).join(", ") || "Delivery"}
                        </td>
                        <td className={cx(td, "text-right font-semibold whitespace-nowrap text-ink-900 tabular-nums")}>{formatPrice(order.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              perPage={PER_PAGE}
              href={(target) => withQuery("/admin/orders", current, { page: target > 1 ? target : null })}
            />
          </>
        ) : orders.length ? (
          <Empty title="No orders match" description="Try clearing the filters." />
        ) : (
          <Empty
            title="No orders yet"
            description="Website orders appear here the moment a customer checks out. You can also record WhatsApp, Instagram and walk-in orders."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <AdminLink href="/admin/orders/new">Record an order</AdminLink>
                {!hasReal ? (
                  <form action={loadSampleDataAction}>
                    <SubmitButton className={adminButton({ variant: "secondary" })} pendingLabel="Loading…">
                      Explore with sample data
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            }
          />
        )}
      </Card>
    </AdminPage>
  );
}
