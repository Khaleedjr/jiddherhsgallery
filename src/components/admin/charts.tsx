"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "@/components/admin/ui";
import { formatNairaCompact, formatNumber } from "@/lib/admin/format";
import { formatPrice } from "@/lib/format";

/** Formatters are chosen by name so server pages can configure the chart without passing functions. */
const FORMATS = {
  naira: { value: formatPrice, axis: formatNairaCompact },
  orders: { value: (v: number) => `${formatNumber(v)} ${v === 1 ? "order" : "orders"}`, axis: formatNumber },
  count: { value: formatNumber, axis: formatNumber },
} as const;
export type ChartFormat = keyof typeof FORMATS;

export type TrendPoint = {
  key: string;
  label: string;
  value: number;
  /** A second line in the tooltip, e.g. "12 orders". */
  detail?: string;
};

/* The logo's colours: black marks that turn gold under the pointer. */
const SERIES = "#14110a"; // coal-900
const SERIES_HOVER = "#cd9a32"; // gold-500
const GRID = "#ece3cf"; // coal-100
const AXIS_TEXT = "#6f6450"; // ink-500

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A clean axis top: 1, 2, 2.5 or 5 times a power of ten. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * power >= value) return step * power;
  return 10 * power;
}

/**
 * One measure over time. "area" for money (a continuous build-up), "bar" for
 * counts. Hover or arrow keys show the exact figure; the table below carries
 * every value without either.
 */
export function TrendChart({
  points,
  kind,
  valueFormat,
  height = 240,
  label,
}: {
  points: TrendPoint[];
  kind: "area" | "bar";
  valueFormat: ChartFormat;
  height?: number;
  /** Accessible name for the chart. */
  label: string;
}) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const { value: format, axis: axisFormat } = FORMATS[valueFormat];
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();

  const margin = { top: 14, right: 12, bottom: 28, left: 52 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const y = (v: number) => margin.top + innerH - (v / max) * innerH;

  const n = points.length;
  const band = n ? innerW / n : 0;
  const x = (i: number) =>
    kind === "bar" ? margin.left + band * i + band / 2 : margin.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));

  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 64))));
  // Every nth label, plus the latest one — dropping any that would crowd it.
  const showLabel = (i: number) => i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= Math.ceil(labelEvery * 0.6));
  // Area charts run edge to edge, so their end labels hang inward instead of clipping.
  const labelAnchor = (i: number) => (kind === "area" && n > 1 ? (i === 0 ? "start" : i === n - 1 ? "end" : "middle") : "middle");

  const indexAt = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    if (kind === "bar") return Math.min(n - 1, Math.max(0, Math.floor((px - margin.left) / band)));
    if (n <= 1) return 0;
    return Math.min(n - 1, Math.max(0, Math.round(((px - margin.left) / innerW) * (n - 1))));
  };

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!n) return;
    setActive(indexAt(event.clientX, event.currentTarget));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActive((current) => {
        const start = current ?? (event.key === "ArrowRight" ? -1 : n);
        return Math.min(n - 1, Math.max(0, start + (event.key === "ArrowRight" ? 1 : -1)));
      });
    } else if (event.key === "Escape") setActive(null);
  };

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const area = n ? `${line}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : "";
  const barW = Math.min(24, Math.max(2, band - 2));
  const hovered = active !== null ? points[active] : null;
  const tipX = active !== null ? x(active) : 0;

  return (
    <div>
      <div
        ref={wrap}
        className="relative outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-coal-500/40"
        tabIndex={0}
        role="group"
        aria-label={`${label}. Use the left and right arrow keys to read each value.`}
        aria-describedby={tableId}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        {width > 0 ? (
          <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="block touch-pan-y" aria-hidden>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={margin.left} x2={width - margin.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={margin.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular-nums">
                  {axisFormat(t)}
                </text>
              </g>
            ))}

            {kind === "area" ? (
              <>
                <path d={area} fill={SERIES} fillOpacity={0.1} />
                <path d={line} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </>
            ) : (
              points.map((p, i) => {
                const h = y(0) - y(p.value);
                if (h <= 0) return null;
                const r = Math.min(4, barW / 2, h);
                const left = x(i) - barW / 2;
                const top = y(p.value);
                // Rounded at the data end, square at the baseline.
                const d = `M${left},${y(0)}V${top + r}Q${left},${top} ${left + r},${top}H${left + barW - r}Q${left + barW},${top} ${left + barW},${top + r}V${y(0)}Z`;
                return <path key={p.key} d={d} fill={active === i ? SERIES_HOVER : SERIES} />;
              })
            )}

            {points.map((p, i) =>
              showLabel(i) ? (
                <text key={p.key} x={x(i)} y={height - 8} textAnchor={labelAnchor(i)} fontSize={11} fill={AXIS_TEXT}>
                  {p.label}
                </text>
              ) : null,
            )}

            {hovered && active !== null ? (
              <g>
                {kind === "area" ? (
                  <>
                    <line x1={tipX} x2={tipX} y1={margin.top} y2={y(0)} stroke="#978b74" strokeWidth={1} shapeRendering="crispEdges" />
                    <circle cx={tipX} cy={y(hovered.value)} r={5} fill={SERIES} stroke="#fff" strokeWidth={2} />
                  </>
                ) : null}
              </g>
            ) : null}
          </svg>
        ) : (
          <div style={{ height }} />
        )}

        {hovered && active !== null && width > 0 ? (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-sand-200 bg-white px-3 py-2 text-[0.76rem] shadow-lift"
            style={{
              left: Math.min(Math.max(tipX, 70), width - 70),
              top: 4,
              transform: "translateX(-50%)",
            }}
            role="status"
          >
            <p className="text-[0.9rem] font-semibold whitespace-nowrap text-ink-900 tabular-nums">{format(hovered.value)}</p>
            <p className="whitespace-nowrap text-ink-500">
              {hovered.label}
              {hovered.detail ? ` · ${hovered.detail}` : ""}
            </p>
          </div>
        ) : null}
      </div>

      <details id={tableId} className="mt-2 text-[0.76rem]">
        <summary className="cursor-pointer font-semibold text-ink-500 hover:text-ink-800">View as table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-sand-200">
          <table className="w-full">
            <tbody className="divide-y divide-sand-200/70">
              {points.map((p) => (
                <tr key={p.key}>
                  <td className="px-3 py-1.5 text-ink-600">{p.label}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-ink-900 tabular-nums">{format(p.value)}</td>
                  {p.detail ? <td className="px-3 py-1.5 text-right text-ink-500">{p.detail}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/** A small trend line for stat tiles; decorative, the tile's number is the content. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(1, ...values);
  const n = values.length;
  if (n < 2) return null;
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (n - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cx("h-8 w-full", className)} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={SERIES} strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
