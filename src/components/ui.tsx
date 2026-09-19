import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { StarKhatimIcon } from "@/components/icons";

export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.22em] text-gold-600 uppercase",
        className,
      )}
    >
      <StarKhatimIcon className="size-3" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  const centered = align === "center";
  return (
    <div
      className={cx(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center sm:text-center",
      )}
    >
      <div className={cx("max-w-2xl", centered && "mx-auto text-center")}>
        {eyebrow ? <Eyebrow className={tone === "light" ? "text-gold-300" : undefined}>{eyebrow}</Eyebrow> : null}
        <h2
          className={cx(
            "mt-3 text-3xl leading-tight sm:text-4xl",
            tone === "light" && "text-sand-50",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cx("mt-3 text-[0.95rem] leading-relaxed", tone === "light" ? "text-sand-200" : "text-ink-600")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  primary: "bg-forest-800 text-sand-50 hover:bg-forest-700 active:bg-forest-900 shadow-[0_10px_24px_-14px_rgba(10,43,33,0.9)]",
  gold: "bg-gold-400 text-forest-950 hover:bg-gold-300 active:bg-gold-500",
  outline: "border border-forest-800/25 text-forest-900 hover:border-forest-800/60 hover:bg-forest-50",
  ghost: "text-forest-900 hover:bg-forest-50",
  light: "bg-sand-50 text-forest-900 hover:bg-sand-100",
  whatsapp: "bg-[#25D366] text-[#05321a] hover:bg-[#1fbe5a]",
} as const;

const buttonSizes = {
  sm: "h-9 px-4",
  md: "h-11 px-6",
  lg: "h-12 px-7 text-[0.95rem]",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export const buttonClass = ({ variant = "primary", size = "md" }: ButtonStyleProps = {}) =>
  cx(buttonBase, buttonVariants[variant], buttonSizes[size]);

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return <button className={cx(buttonClass({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={cx(buttonClass({ variant, size }), className)} {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "sale" | "sold-out" | "new" | "gold";
  className?: string;
}) {
  const tones = {
    neutral: "bg-sand-200 text-ink-700",
    sale: "bg-berry-500 text-white",
    "sold-out": "bg-ink-800/85 text-sand-100",
    new: "bg-forest-700 text-sand-50",
    gold: "bg-gold-400 text-forest-950",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.08em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center gap-4", className)} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-300" />
      <StarKhatimIcon className="size-3.5 text-gold-400" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-300" />
    </div>
  );
}

export function Breadcrumbs({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.8rem] text-ink-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {crumb.href ? (
              <Link href={crumb.href} className="transition hover:text-forest-700">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink-700">{crumb.label}</span>
            )}
            {index < trail.length - 1 ? <span aria-hidden className="text-sand-400">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-sand-400 bg-sand-100/60 px-6 py-16 text-center">
      <StarKhatimIcon className="mx-auto size-7 text-gold-300" />
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
