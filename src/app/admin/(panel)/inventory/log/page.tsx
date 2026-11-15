import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/controls";
import { DownloadIcon, SearchIcon } from "@/components/admin/icons";
import { CloseIcon } from "@/components/icons";
import { AdminPage, Card, Empty, Pagination, Pill, cx, inputClass, pageParam, td, th, withQuery } from "@/components/admin/ui";
import { REASON_LABEL, formatDateTime } from "@/lib/admin/format";
import { listMovements } from "@/lib/store/inventory";
import { getStoredProduct } from "@/lib/store/products";
import { STOCK_REASONS, type StockReason } from "@/lib/store/types";

export const metadata: Metadata = { title: "Stock log" };

const PER_PAGE = 50;

const REASON_TONE: Record<StockReason, "good" | "bad" | "info" | "neutral" | "warn"> = {
  restock: "good",
  return: "info",
  sale: "neutral",
  correction: "warn",
  damaged: "bad",
  initial: "neutral",
};

type Query = { q?: string; reason?: string; product?: string; dir?: string; page?: string };

export default async function StockLogPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const reason = STOCK_REASONS.includes(query.reason as StockReason) ? (query.reason as StockReason) : null;
  const dir = query.dir === "in" || query.dir === "out" ? query.dir : null;
  const q = (query.q ?? "").trim().toLowerCase();
  const product = query.product ? await getStoredProduct(query.product) : null;

  const movements = (await listMovements())
    .filter((m) => !reason || m.reason === reason)
    .filter((m) => !product || m.productId === product.id)
    .filter((m) => !dir || (dir === "in" ? m.change > 0 : m.change < 0))
    .filter(
      (m) =>
        !q ||
        m.productName.toLowerCase().includes(q) ||
        (m.variantLabel ?? "").toLowerCase().includes(q) ||
        (m.orderRef ?? "").toLowerCase().includes(q) ||
        (m.note ?? "").toLowerCase().includes(q),
    );

  const pages = Math.max(1, Math.ceil(movements.length / PER_PAGE));
  const page = Math.min(pageParam(query.page), pages);
  const current = { q: query.q, reason: reason ?? undefined, product: product?.id, dir: dir ?? undefined };

  return (
    <AdminPage
      title="Stock log"
      description="Every unit in and out — restocks, sales, returns and counts."
      back={{ href: "/admin/inventory", label: "Inventory" }}
      actions={
        <a href="/admin/export/stock-log" className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-4 text-[0.82rem] font-semibold text-ink-800 transition hover:border-sand-400">
          <DownloadIcon className="size-4" />
          Export CSV
        </a>
      }
    >
      <Card flush>
        <form className="grid gap-2 border-b border-sand-200 p-3 sm:grid-cols-[1fr_12rem_10rem]" action="/admin/inventory/log">
          {product ? <input type="hidden" name="product" value={product.id} /> : null}
          <label className="relative">
            <span className="sr-only">Search the log</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input name="q" defaultValue={query.q ?? ""} placeholder="Search product, order ref or note…" className={cx(inputClass, "pl-9")} />
          </label>
          <AutoSubmitSelect name="reason" defaultValue={reason ?? ""} aria-label="Reason">
            <option value="">All reasons</option>
            {STOCK_REASONS.map((r) => (
              <option key={r} value={r}>
                {REASON_LABEL[r]}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="dir" defaultValue={dir ?? ""} aria-label="Direction">
            <option value="">In and out</option>
            <option value="in">Units in</option>
            <option value="out">Units out</option>
          </AutoSubmitSelect>
        </form>
        {product ? (
          <div className="flex items-center gap-2 border-b border-sand-200 bg-coal-50/60 px-4 py-2 text-[0.78rem] text-ink-700">
            Showing <strong className="font-semibold">{product.name}</strong>
            <Link href={withQuery("/admin/inventory/log", current, { product: null, page: null })} className="ml-1 inline-flex items-center gap-0.5 font-semibold text-coal-700 hover:underline">
              <CloseIcon className="size-3.5" /> Clear
            </Link>
          </div>
        ) : null}

        {movements.length ? (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[52rem]">
                <thead className="border-b border-sand-200 bg-sand-50/60">
                  <tr>
                    <th className={th}>When</th>
                    <th className={th}>Item</th>
                    <th className={th}>Reason</th>
                    <th className={cx(th, "text-right")}>Change</th>
                    <th className={cx(th, "text-right")}>Before → after</th>
                    <th className={th}>Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/80">
                  {movements.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((m) => (
                    <tr key={m.id} className="hover:bg-sand-50">
                      <td className={cx(td, "text-[0.76rem] whitespace-nowrap text-ink-500")}>{formatDateTime(m.at)}</td>
                      <td className={td}>
                        <Link href={`/admin/products/${m.productId}`} className="line-clamp-1 max-w-[20rem] font-semibold text-ink-900 hover:text-coal-700">
                          {m.productName}
                        </Link>
                        {m.variantLabel ? <p className="text-[0.72rem] text-ink-500">{m.variantLabel}</p> : null}
                      </td>
                      <td className={td}>
                        <Pill tone={REASON_TONE[m.reason]}>{REASON_LABEL[m.reason]}</Pill>
                      </td>
                      <td className={cx(td, "text-right text-[0.9rem] font-semibold tabular-nums", m.change > 0 ? "text-coal-700" : "text-berry-600")}>
                        {m.change > 0 ? `+${m.change}` : m.change}
                      </td>
                      <td className={cx(td, "text-right whitespace-nowrap text-ink-500 tabular-nums")}>
                        {m.before ?? "—"} → <strong className="text-ink-900">{m.after ?? "—"}</strong>
                      </td>
                      <td className={cx(td, "text-[0.76rem] text-ink-600")}>
                        {m.orderRef ? (
                          <Link href={`/admin/orders/${m.orderRef}`} className="mr-1.5 font-semibold text-coal-700 hover:underline">
                            {m.orderRef}
                          </Link>
                        ) : null}
                        {m.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pages={pages}
              total={movements.length}
              perPage={PER_PAGE}
              href={(target) => withQuery("/admin/inventory/log", current, { page: target > 1 ? target : null })}
            />
          </>
        ) : (
          <Empty
            title="No stock movements yet"
            description="Restocks, stock counts and confirmed orders will appear here as they happen."
          />
        )}
      </Card>
    </AdminPage>
  );
}
