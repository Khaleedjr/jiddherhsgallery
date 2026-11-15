import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/controls";
import { DownloadIcon, SearchIcon } from "@/components/admin/icons";
import { StockAdjustButton } from "@/components/admin/stock-adjust";
import {
  AdminLink,
  AdminPage,
  Card,
  Empty,
  Pagination,
  Pill,
  StatTile,
  StockPill,
  Thumb,
  cx,
  inputClass,
  pageParam,
  td,
  th,
  withQuery,
} from "@/components/admin/ui";
import { formatNumber, timeAgo } from "@/lib/admin/format";
import { stockState, toStockItems, type StockState } from "@/lib/admin/stock-items";
import { taxonomy } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { listMovements } from "@/lib/store/inventory";
import { listProducts } from "@/lib/store/products";

export const metadata: Metadata = { title: "Inventory" };

const PER_PAGE = 30;
const VIEWS = [
  { key: "out", label: "Out of stock" },
  { key: "low", label: "Running low" },
  { key: "all", label: "All items" },
  { key: "untracked", label: "Not counted" },
] as const;
const DEFAULT_VIEW = "out";

type Query = { view?: string; q?: string; cat?: string; page?: string };

const inView = (state: StockState, view: string) => (view === "all" ? true : state === view);

const URGENCY: Record<StockState, number> = { out: 0, low: 1, ok: 2, untracked: 3 };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const view = VIEWS.some((v) => v.key === query.view) ? query.view! : DEFAULT_VIEW;
  const q = (query.q ?? "").trim().toLowerCase();
  const cat = taxonomy.departments.some((d) => d.slug === query.cat) ? query.cat! : "";

  const [products, movements] = await Promise.all([listProducts(), listMovements()]);
  const items = toStockItems(products, movements);
  const withState = items.map((item) => ({ ...item, state: stockState(item) }));

  const tracked = withState.filter((i) => i.stock !== null);
  const units = tracked.reduce((n, i) => n + (i.stock ?? 0), 0);
  const value = tracked.reduce((n, i) => n + (i.stock ?? 0) * i.price, 0);
  const counts = Object.fromEntries(VIEWS.map((v) => [v.key, withState.filter((i) => inView(i.state, v.key)).length]));

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = movements.filter((m) => new Date(m.at).getTime() >= since);
  const unitsIn = recent.filter((m) => m.change > 0).reduce((n, m) => n + m.change, 0);
  const unitsOut = recent.filter((m) => m.change < 0).reduce((n, m) => n - m.change, 0);

  const filtered = withState
    .filter((i) => inView(i.state, view))
    .filter((i) => !cat || i.categories.some((c) => c === cat || c.startsWith(`${cat}/`)))
    .filter((i) => !q || i.name.toLowerCase().includes(q) || (i.variantLabel ?? "").toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q))
    .sort((a, b) => URGENCY[a.state] - URGENCY[b.state] || (a.stock ?? 0) - (b.stock ?? 0) || a.name.localeCompare(b.name));

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pageParam(query.page), pages);
  const current = { view: view === DEFAULT_VIEW ? undefined : view, q: query.q, cat: cat || undefined };

  return (
    <AdminPage
      title="Inventory"
      description="What's on the shelf, what's running out, and every movement in and out."
      actions={
        <>
          <a href="/admin/export/stock" className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-4 text-[0.82rem] font-semibold text-ink-800 transition hover:border-sand-400">
            <DownloadIcon className="size-4" />
            Export
          </a>
          <AdminLink href="/admin/inventory/log">Stock log</AdminLink>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Units on hand" value={formatNumber(units)} hint={`across ${tracked.length} counted items`} />
        <StatTile label="Stock value (retail)" value={formatPrice(value)} hint="at current selling prices" />
        <StatTile label="Out of stock" value={formatNumber(counts.out)} hint="not available to buy" href="/admin/inventory" />
        <StatTile label="Running low" value={formatNumber(counts.low)} hint="5 or fewer left" href="/admin/inventory?view=low" />
      </div>
      <p className="text-[0.78rem] text-ink-500">
        Last 30 days: <strong className="text-coal-700">+{formatNumber(unitsIn)}</strong> units in ·{" "}
        <strong className="text-berry-600">{unitsOut ? `−${formatNumber(unitsOut)}` : "0"}</strong> units out ·{" "}
        <Link href="/admin/inventory/log" className="font-semibold text-coal-700 hover:underline">
          {recent.length} movements
        </Link>
      </p>

      <Card flush>
        <div className="flex gap-1 overflow-x-auto border-b border-sand-200 px-3 pt-2" role="tablist" aria-label="Filter stock">
          {VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <Link
                key={v.key}
                href={withQuery("/admin/inventory", current, { view: v.key === DEFAULT_VIEW ? null : v.key, page: null })}
                role="tab"
                aria-selected={active}
                className={cx(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.8rem] font-semibold whitespace-nowrap transition",
                  active ? "border-coal-700 text-coal-800" : "border-transparent text-ink-500 hover:text-ink-800",
                )}
              >
                {v.label}
                <span className={cx("rounded-full px-1.5 text-[0.68rem] tabular-nums", active ? "bg-coal-100 text-coal-800" : "bg-sand-200 text-ink-600")}>
                  {counts[v.key]}
                </span>
              </Link>
            );
          })}
        </div>

        <form className="grid gap-2 border-b border-sand-200 p-3 sm:grid-cols-[1fr_14rem]" action="/admin/inventory">
          {current.view ? <input type="hidden" name="view" value={current.view} /> : null}
          <label className="relative">
            <span className="sr-only">Search stock</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input name="q" defaultValue={query.q ?? ""} placeholder="Search by name, option or SKU…" className={cx(inputClass, "pl-9")} />
          </label>
          <AutoSubmitSelect name="cat" defaultValue={cat} aria-label="Department">
            <option value="">All departments</option>
            {taxonomy.departments.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </form>

        {filtered.length ? (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[50rem]">
                <thead className="border-b border-sand-200 bg-sand-50/60">
                  <tr>
                    <th className={th}>Item</th>
                    <th className={th}>Status</th>
                    <th className={cx(th, "text-right")}>On hand</th>
                    <th className={cx(th, "text-right")}>Value</th>
                    <th className={th}>Last movement</th>
                    <th className={cx(th, "text-right")}>
                      <span className="sr-only">Adjust</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/80">
                  {filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((item) => (
                    <tr key={item.key} className="transition hover:bg-sand-50">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Thumb src={item.image} alt="" size={40} />
                          <div className="min-w-0">
                            <Link href={`/admin/products/${item.productId}`} className="line-clamp-1 max-w-[24rem] font-semibold text-ink-900 hover:text-coal-700">
                              {item.name}
                            </Link>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.72rem] text-ink-500">
                              {item.variantLabel ? <span className="font-medium text-ink-700">{item.variantLabel}</span> : null}
                              {item.sku ? <span>SKU {item.sku}</span> : null}
                              {item.status === "draft" ? <Pill className="py-0">Draft</Pill> : null}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <StockPill stock={item.stock} inStock={item.inStock} />
                      </td>
                      <td className={cx(td, "text-right text-[1rem] font-semibold text-ink-900 tabular-nums")}>{item.stock ?? "—"}</td>
                      <td className={cx(td, "text-right whitespace-nowrap tabular-nums")}>
                        {item.stock !== null ? formatPrice(item.stock * item.price) : "—"}
                      </td>
                      <td className={cx(td, "text-[0.76rem] whitespace-nowrap text-ink-500")}>
                        {item.lastMovedAt ? timeAgo(item.lastMovedAt) : "—"}
                      </td>
                      <td className={cx(td, "text-right")}>
                        <StockAdjustButton
                          compact
                          target={{ productId: item.productId, variantId: item.variantId, name: item.name, variantLabel: item.variantLabel, stock: item.stock }}
                        />
                      </td>
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
              href={(target) => withQuery("/admin/inventory", current, { page: target > 1 ? target : null })}
            />
          </>
        ) : (
          <Empty
            title={view === "out" ? "Nothing is out of stock" : "No items here"}
            description={view === "out" ? "Every item can be bought right now." : "Try another filter."}
          />
        )}
      </Card>
    </AdminPage>
  );
}
