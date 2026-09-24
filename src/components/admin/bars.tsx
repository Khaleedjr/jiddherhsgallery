import type { ReactNode } from "react";
import { cx } from "@/components/admin/ui";
import { STATUS_META } from "@/lib/admin/format";
import type { OrderStatus } from "@/lib/store/types";

/**
 * Ranked horizontal bars — one measure, one hue. The value and share are
 * printed on every row, so nothing depends on reading bar lengths.
 */
export function RankedBars({
  rows,
  format,
  empty = "No data for this period.",
  showShare = true,
}: {
  rows: Array<{ key: string; label: ReactNode; value: number; detail?: ReactNode }>;
  format: (value: number) => string;
  empty?: string;
  showShare?: boolean;
}) {
  const total = rows.reduce((n, r) => n + r.value, 0);
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length || total === 0) return <p className="py-6 text-center text-[0.8rem] text-ink-500">{empty}</p>;
  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-[0.8rem]">
            <span className="min-w-0 truncate text-ink-800">{row.label}</span>
            <span className="shrink-0 font-semibold text-ink-900 tabular-nums">
              {format(row.value)}
              {showShare ? <span className="ml-1.5 font-normal text-ink-500">{Math.round((row.value / total) * 100)}%</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-sand-100">
            <div className="h-2 rounded-full bg-forest-600" style={{ width: `${Math.max(1.5, (row.value / max) * 100)}%` }} />
          </div>
          {row.detail ? <p className="mt-1 text-[0.72rem] text-ink-500">{row.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}

const STATUS_FILL: Record<OrderStatus, string> = {
  pending: "bg-gold-400",
  confirmed: "bg-sky-500",
  dispatched: "bg-violet-500",
  delivered: "bg-forest-600",
  cancelled: "bg-ink-400",
};

/** Share of orders in each status: one stacked bar with 2px surface gaps, and a labelled legend. */
export function StatusShare({ rows }: { rows: Array<{ status: OrderStatus; count: number }> }) {
  const total = rows.reduce((n, r) => n + r.count, 0);
  if (!total) return <p className="py-6 text-center text-[0.8rem] text-ink-500">No orders in this period.</p>;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={rows.map((r) => `${STATUS_META[r.status].label} ${r.count}`).join(", ")}>
        {rows
          .filter((r) => r.count)
          .map((r) => (
            <div key={r.status} className={cx("h-full", STATUS_FILL[r.status])} style={{ width: `${(r.count / total) * 100}%` }} />
          ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.8rem]">
        {rows.map((r) => (
          <li key={r.status} className="flex items-center gap-2">
            <span className={cx("size-2.5 shrink-0 rounded-sm", STATUS_FILL[r.status])} aria-hidden />
            <span className="text-ink-700">{STATUS_META[r.status].label}</span>
            <span className="ml-auto font-semibold text-ink-900 tabular-nums">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
