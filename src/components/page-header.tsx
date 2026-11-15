import { Breadcrumbs, Container, Eyebrow, cx } from "@/components/ui";
import type { ReactNode } from "react";

/**
 * The band at the top of every inner page, in design 4's colours: gold with
 * the faint star lattice (the homepage hero's wall), or black for the
 * quieter story and contact pages.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  trail,
  children,
  tone = "gold",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  trail?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
  tone?: "gold" | "ink";
}) {
  const dark = tone === "ink";

  return (
    <section className={cx("relative overflow-hidden", dark ? "bg-coal-900 text-sand-50" : "bg-gold-500 text-ink-900")}>
      <div className={cx("absolute inset-0", dark ? "pattern-girih-light opacity-20" : "lattice opacity-[0.07]")} aria-hidden />
      <Container className="relative py-10 sm:py-16">
        {trail ? <Breadcrumbs trail={trail} tone={dark ? "light" : "dark"} /> : null}
        <div className={cx(trail && "mt-5 sm:mt-6")}>
          {eyebrow ? <Eyebrow tone={dark ? "light" : "dark"}>{eyebrow}</Eyebrow> : null}
          <h1 className={cx("mt-3 text-[2.4rem] leading-[1.02] sm:text-6xl", dark && "text-gold-500")}>{title}</h1>
          {description ? (
            <p className={cx("mt-4 max-w-2xl text-base leading-relaxed sm:text-lg", dark ? "text-coal-200" : "text-ink-900/85")}>
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </Container>
    </section>
  );
}
