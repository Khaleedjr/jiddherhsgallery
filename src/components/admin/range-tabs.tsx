import Link from "next/link";
import { cx } from "@/components/admin/ui";
import { RANGES, type RangeKey } from "@/lib/store/analytics";

/** Date-range presets: one row, above everything they scope. */
export function RangeTabs({ active, path }: { active: RangeKey; path: string }) {
  return (
    <nav aria-label="Date range" className="flex gap-1 overflow-x-auto rounded-xl border border-sand-200 bg-white p-1">
      {RANGES.map((range) => (
        <Link
          key={range.key}
          href={range.key === "30d" ? path : `${path}?range=${range.key}`}
          aria-current={range.key === active ? "true" : undefined}
          scroll={false}
          className={cx(
            "rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold whitespace-nowrap transition",
            range.key === active ? "bg-forest-800 text-sand-50" : "text-ink-600 hover:bg-sand-100 hover:text-ink-900",
          )}
        >
          {range.label}
        </Link>
      ))}
    </nav>
  );
}
