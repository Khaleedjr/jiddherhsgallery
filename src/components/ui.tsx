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

/** Small capitals over a heading. "light" is for black bands, where it turns gold. */
export function Eyebrow({ children, className, tone = "dark" }: { children: ReactNode; className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.2em] uppercase",
        tone === "light" ? "text-gold-400" : "text-ink-900",
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
        {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
        <h2
          className={cx(
            "mt-3 text-[2rem] leading-[1.05] sm:text-5xl",
            tone === "light" && "text-gold-500",
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

/* Design 4 buttons: full pills. Black with gold lettering is the main action;
   a black outline is the second. WhatsApp keeps the black, not the app's green,
   so every page stays in the logo's three colours. */
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const buttonVariants = {
  primary: "bg-coal-900 text-gold-500 hover:bg-black",
  gold: "bg-gold-500 text-coal-900 hover:bg-gold-400",
  outline: "border-[1.5px] border-coal-900 text-coal-900 hover:bg-coal-900 hover:text-gold-500",
  ghost: "text-coal-900 hover:bg-sand-200",
  light: "bg-sand-50 text-coal-900 hover:bg-white",
  whatsapp: "bg-coal-900 text-gold-500 hover:bg-black",
} as const;

const buttonSizes = {
  sm: "h-10 px-5",
  md: "h-12 px-6",
  lg: "h-13 px-8 text-[0.95rem]",
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
  /* Only the logo's three colours: no red sale flash, no green "new". */
  const tones = {
    neutral: "bg-sand-200 text-ink-700",
    sale: "bg-coal-900 text-gold-500",
    "sold-out": "bg-sand-50/95 text-ink-700",
    new: "bg-sand-50 text-coal-900",
    gold: "bg-gold-500 text-coal-900",
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

export function Breadcrumbs({
  trail,
  tone = "dark",
}: {
  trail: Array<{ label: string; href?: string }>;
  /** "light" for breadcrumbs sitting on a dark header. */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <nav
      aria-label="Breadcrumb"
      className={cx("text-[0.8rem]", light ? "text-coal-300" : "text-ink-900/75")}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {crumb.href ? (
              <Link
                href={crumb.href}
                className={cx("underline-offset-4 transition hover:underline", light ? "hover:text-gold-500" : "hover:text-ink-900")}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={cx("font-semibold", light ? "text-sand-50" : "text-ink-900")}>{crumb.label}</span>
            )}
            {index < trail.length - 1 ? (
              <span aria-hidden className={light ? "text-coal-400" : "text-ink-900/40"}>
                /
              </span>
            ) : null}
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
    <div className="rounded-[1.5rem] bg-sand-200 px-6 py-16 text-center">
      <StarKhatimIcon className="mx-auto size-7 text-gold-600" />
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
