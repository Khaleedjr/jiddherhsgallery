import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/controls";
import { DownloadIcon, SearchIcon } from "@/components/admin/icons";
import { AdminPage, Card, Empty, Pagination, StatTile, cx, inputClass, pageParam, td, th, withQuery } from "@/components/admin/ui";
import { formatDate, formatNumber, formatPercent, timeAgo } from "@/lib/admin/format";
import { formatPrice } from "@/lib/format";
import { buildCustomers } from "@/lib/store/customers";
import { listOrders } from "@/lib/store/orders";
import type { Customer } from "@/lib/store/types";

export const metadata: Metadata = { title: "Customers" };

const PER_PAGE = 30;
const SORTS: Record<string, { label: string; fn: (a: Customer, b: Customer) => number }> = {
  recent: { label: "Most recent order", fn: (a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt) },
  spent: { label: "Highest spend", fn: (a, b) => b.spent - a.spent },
  orders: { label: "Most orders", fn: (a, b) => b.orders - a.orders || b.spent - a.spent },
  new: { label: "Newest customers", fn: (a, b) => b.firstOrderAt.localeCompare(a.firstOrderAt) },
  name: { label: "Name A–Z", fn: (a, b) => a.name.localeCompare(b.name) },
};

type Query = { q?: string; sort?: string; type?: string; page?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const sort = query.sort && SORTS[query.sort] ? query.sort : "recent";
  const type = query.type === "repeat" || query.type === "once" ? query.type : "";
  const q = (query.q ?? "").trim().toLowerCase();
  const digits = q.replace(/\D/g, "");

  const customers = buildCustomers(await listOrders());
  const buyers = customers.filter((c) => c.spent > 0);
  const repeat = customers.filter((c) => c.orders > 1);
  const monthAgo = Date.now() - 30 * 86_400_000;
  const newThisMonth = customers.filter((c) => new Date(c.firstOrderAt).getTime() >= monthAgo).length;
  const avgLtv = buyers.length ? Math.round(buyers.reduce((n, c) => n + c.spent, 0) / buyers.length) : 0;

  const filtered = customers
    .filter((c) => !type || (type === "repeat" ? c.orders > 1 : c.orders === 1))
    .filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.state ?? "").toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (digits.length >= 4 && c.key.includes(digits.replace(/^0/, ""))),
    )
    .sort(SORTS[sort].fn);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pageParam(query.page), pages);
  const current = { q: query.q, sort: sort === "recent" ? undefined : sort, type: type || undefined };

  return (
    <AdminPage
      title="Customers"
      description="Everyone who has ordered, grouped by phone number."
      actions={
        <a href="/admin/export/customers" className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-4 text-[0.82rem] font-semibold text-ink-800 transition hover:border-sand-400">
          <DownloadIcon className="size-4" />
          Export CSV
        </a>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Customers" value={formatNumber(customers.length)} hint={`${formatNumber(buyers.length)} have paid`} />
        <StatTile
          label="Come back again"
          value={customers.length ? formatPercent(repeat.length / customers.length) : "—"}
          hint={`${formatNumber(repeat.length)} ordered more than once`}
          href="/admin/customers?type=repeat"
        />
        <StatTile label="Average lifetime spend" value={formatPrice(avgLtv)} hint="per paying customer" />
        <StatTile label="New in the last 30 days" value={formatNumber(newThisMonth)} hint="first order this month" href="/admin/customers?sort=new" />
      </div>

      <Card flush>
        <form className="grid gap-2 border-b border-sand-200 p-3 sm:grid-cols-[1fr_11rem_12rem]" action="/admin/customers">
          <label className="relative">
            <span className="sr-only">Search customers</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input name="q" defaultValue={query.q ?? ""} placeholder="Name, phone, email, state or city…" className={cx(inputClass, "pl-9")} />
          </label>
          <AutoSubmitSelect name="type" defaultValue={type} aria-label="Customer type">
            <option value="">Everyone</option>
            <option value="repeat">Repeat customers</option>
            <option value="once">One order so far</option>
          </AutoSubmitSelect>
          <AutoSubmitSelect name="sort" defaultValue={sort} aria-label="Sort">
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </form>

        {filtered.length ? (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[48rem]">
                <thead className="border-b border-sand-200 bg-sand-50/60">
                  <tr>
                    <th className={th}>Customer</th>
                    <th className={th}>Location</th>
                    <th className={cx(th, "text-right")}>Orders</th>
                    <th className={cx(th, "text-right")}>Spent</th>
                    <th className={th}>Customer since</th>
                    <th className={th}>Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/80">
                  {filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((c) => (
                    <tr key={c.key} className="relative transition hover:bg-sand-50">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-100 text-[0.74rem] font-bold text-forest-800">
                            {c.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <Link href={`/admin/customers/${c.key}`} className="font-semibold text-ink-900 after:absolute after:inset-0 hover:text-forest-700">
                              {c.name}
                            </Link>
                            <p className="text-[0.72rem] text-ink-500">{c.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className={cx(td, "text-[0.78rem] text-ink-600")}>{[c.city, c.state].filter(Boolean).join(", ") || "Pickup"}</td>
                      <td className={cx(td, "text-right tabular-nums")}>{c.orders}</td>
                      <td className={cx(td, "text-right font-semibold text-ink-900 tabular-nums")}>{formatPrice(c.spent)}</td>
                      <td className={cx(td, "text-[0.76rem] whitespace-nowrap text-ink-500")}>{formatDate(c.firstOrderAt)}</td>
                      <td className={cx(td, "text-[0.76rem] whitespace-nowrap text-ink-500")}>{timeAgo(c.lastOrderAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              perPage={PER_PAGE}
              href={(target) => withQuery("/admin/customers", current, { page: target > 1 ? target : null })}
            />
          </>
        ) : (
          <Empty
            title={customers.length ? "No customers match" : "No customers yet"}
            description={customers.length ? "Try another search." : "Customers appear here after their first order."}
          />
        )}
      </Card>
    </AdminPage>
  );
}
