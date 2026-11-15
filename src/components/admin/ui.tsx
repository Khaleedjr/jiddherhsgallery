import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CircleCheckIcon,
  ClockIcon,
  ImageIcon,
  PackageCheckIcon,
  TruckIcon,
  XCircleIcon,
} from "@/components/admin/icons";
import { cx } from "@/components/ui";
import { STATUS_META, formatPercent } from "@/lib/admin/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/format";
import type { OrderStatus } from "@/lib/store/types";

export { cx };

/* ----------------------------------------------------------------- frame */

export function AdminPage({
  title,
  description,
  actions,
  back,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[88rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {back ? (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-500 transition hover:text-coal-800"
        >
          <ArrowLeftIcon className="size-3.5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[1.9rem] leading-tight sm:text-[2.15rem]">{title}</h1>
          {description ? <p className="mt-1 text-[0.85rem] text-ink-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Let tables run edge to edge. */
  flush?: boolean;
}) {
  return (
    <section className={cx("min-w-0 rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]", className)}>
      {title || action ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-sand-200/80 px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="font-sans text-[0.95rem] font-semibold tracking-normal text-ink-900">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[0.78rem] text-ink-500">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cx(flush ? "" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- stats */

export function StatTile({
  label,
  value,
  change,
  hint,
  href,
  invert = false,
}: {
  label: string;
  value: ReactNode;
  /** Fractional change versus the previous period; null when there is nothing to compare. */
  change?: number | null;
  hint?: ReactNode;
  href?: string;
  /** For measures where down is good (e.g. cancellations). */
  invert?: boolean;
}) {
  const body = (
    <>
      <p className="text-[0.75rem] font-medium text-ink-500">{label}</p>
      <p className="mt-1.5 font-sans text-[1.3rem] leading-none font-semibold tracking-tight text-ink-900 tabular-nums sm:text-[1.6rem]">{value}</p>
      <div className="mt-2.5 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-[0.74rem]">
        {change !== undefined ? <Delta change={change} invert={invert} /> : null}
        {hint ? <span className="text-ink-500">{hint}</span> : null}
      </div>
    </>
  );
  const className = "block min-w-0 rounded-xl border border-sand-200 bg-white p-4 shadow-[0_1px_2px_rgb(22_19_15/0.04)] sm:p-5";
  return href ? (
    <Link href={href} className={cx(className, "transition hover:border-sand-400")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Delta({ change, invert = false }: { change: number | null; invert?: boolean }) {
  if (change === null) return <span className="text-ink-400">No earlier data</span>;
  if (Math.abs(change) < 0.005) return <span className="font-semibold text-ink-500">No change</span>;
  const up = change > 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span className={cx("inline-flex items-center gap-0.5 font-semibold", good ? "text-coal-600" : "text-berry-600")}>
      <Icon className="size-3" strokeWidth={2.4} />
      {formatPercent(Math.abs(change), Math.abs(change) < 0.1 ? 1 : 0)}
      <span className="sr-only">{up ? "up" : "down"} on the previous period</span>
    </span>
  );
}

/* --------------------------------------------------------------- badges */

const STATUS_STYLE: Record<OrderStatus, { className: string; Icon: typeof ClockIcon }> = {
  pending: { className: "bg-gold-100 text-gold-700 ring-gold-300/70", Icon: ClockIcon },
  confirmed: { className: "bg-sky-50 text-sky-800 ring-sky-200", Icon: CircleCheckIcon },
  dispatched: { className: "bg-violet-50 text-violet-800 ring-violet-200", Icon: TruckIcon },
  delivered: { className: "bg-coal-50 text-coal-700 ring-coal-200", Icon: PackageCheckIcon },
  cancelled: { className: "bg-sand-100 text-ink-500 ring-sand-300", Icon: XCircleIcon },
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { className: tone, Icon } = STATUS_STYLE[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {STATUS_META[status].label}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info" | "gold";
  className?: string;
}) {
  const tones = {
    neutral: "bg-sand-100 text-ink-600 ring-sand-300",
    good: "bg-coal-50 text-coal-700 ring-coal-200",
    warn: "bg-gold-100 text-gold-700 ring-gold-300/70",
    bad: "bg-berry-500/8 text-berry-600 ring-berry-500/25",
    info: "bg-sky-50 text-sky-800 ring-sky-200",
    gold: "bg-gold-400 text-coal-950 ring-gold-500/40",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StockPill({ stock, inStock }: { stock: number | null; inStock: boolean }) {
  if (!inStock) return <Pill tone="bad">Out of stock</Pill>;
  if (stock === null) return <Pill tone="neutral">In stock</Pill>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Pill tone="warn">Low · {stock}</Pill>;
  return <Pill tone="good">In stock · {stock}</Pill>;
}

/* ---------------------------------------------------------------- media */

export function Thumb({ src, alt, size = 40, className }: { src: string | null | undefined; alt: string; size?: number; className?: string }) {
  return (
    <span
      className={cx("relative block shrink-0 overflow-hidden rounded-md border border-sand-200 bg-sand-100", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size * 2}px`} className="object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-sand-400">
          <ImageIcon className="size-1/2" />
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- forms */

export const inputClass =
  "block w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-[0.85rem] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-coal-500 focus:ring-2 focus:ring-coal-500/15 disabled:bg-sand-100 disabled:text-ink-500";

export const selectClass = cx(inputClass, "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a7064' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E\")] bg-[length:1rem] bg-[right_0.6rem_center] bg-no-repeat pr-8");

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cx("block min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.76rem] font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[0.72rem] font-medium text-berry-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[0.72rem] text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

const adminButtonVariants = {
  primary: "bg-coal-900 text-gold-500 hover:bg-black active:bg-black shadow-[0_1px_2px_rgb(20_17_10/0.3)]",
  secondary: "border border-sand-300 bg-white text-ink-800 hover:border-sand-400 hover:bg-sand-50",
  ghost: "text-ink-600 hover:bg-sand-100 hover:text-ink-900",
  danger: "bg-berry-500 text-white hover:bg-berry-600",
  "danger-outline": "border border-berry-500/30 bg-white text-berry-600 hover:bg-berry-500/5",
  gold: "bg-gold-400 text-coal-950 hover:bg-gold-300",
} as const;

export const adminButton = ({
  variant = "primary",
  size = "md",
}: { variant?: keyof typeof adminButtonVariants; size?: "sm" | "md" } = {}) =>
  cx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-[0.76rem]" : "h-9.5 px-4 text-[0.82rem]",
    adminButtonVariants[variant],
  );

export function AdminLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof adminButtonVariants; size?: "sm" | "md" }) {
  return <Link className={cx(adminButton({ variant, size }), className)} {...props} />;
}

/* ---------------------------------------------------------------- table */

export const th = "px-4 py-2.5 text-left text-[0.68rem] font-semibold tracking-[0.06em] whitespace-nowrap text-ink-500 uppercase";
export const td = "px-4 py-3 align-middle text-[0.82rem] text-ink-700";

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("relative overflow-x-auto", className)}>
      <table className="w-full min-w-full border-collapse">{children}</table>
    </div>
  );
}

export function Empty({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[0.95rem] font-semibold text-ink-800">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-sm text-[0.8rem] text-ink-500">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  perPage,
  href,
}: {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  href: (page: number) => string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const link = (target: number, label: string, disabled: boolean) =>
    disabled ? (
      <span className={cx(adminButton({ variant: "secondary", size: "sm" }), "pointer-events-none opacity-40")}>{label}</span>
    ) : (
      <Link href={href(target)} className={adminButton({ variant: "secondary", size: "sm" })} scroll={false}>
        {label}
      </Link>
    );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 px-4 py-3 text-[0.78rem] text-ink-500">
      <span>
        Showing <strong className="font-semibold text-ink-800">{from}–{to}</strong> of{" "}
        <strong className="font-semibold text-ink-800">{total}</strong>
      </span>
      <div className="flex items-center gap-2">
        {link(page - 1, "Previous", page <= 1)}
        <span className="tabular-nums">
          Page {page} of {pages}
        </span>
        {link(page + 1, "Next", page >= pages)}
      </div>
    </div>
  );
}

/** Build a URL from the current query, overriding some keys and dropping empty ones. */
export function withQuery(path: string, current: Record<string, string | undefined>, patch: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export const pageParam = (value: string | undefined) => Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
