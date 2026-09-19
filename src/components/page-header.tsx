import { Breadcrumbs, Container, Eyebrow, cx } from "@/components/ui";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  trail,
  children,
  tone = "sand",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  trail?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
  tone?: "sand" | "forest";
}) {
  const dark = tone === "forest";

  return (
    <section
      className={cx(
        "relative overflow-hidden border-b",
        dark ? "border-forest-800 bg-forest-900 text-sand-100" : "border-sand-200 bg-sand-100",
      )}
    >
      <div
        className={cx("absolute inset-0", dark ? "pattern-girih-light opacity-25" : "pattern-girih opacity-[0.07]")}
        aria-hidden
      />
      <Container className="relative py-10 sm:py-14">
        {trail ? <Breadcrumbs trail={trail} tone={dark ? "light" : "dark"} /> : null}
        <div className={cx(trail && "mt-5")}>
          {eyebrow ? <Eyebrow className={dark ? "text-gold-300" : undefined}>{eyebrow}</Eyebrow> : null}
          <h1
            className={cx(
              "mt-3 text-[2.1rem] leading-tight sm:text-5xl",
              dark && "text-sand-50",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cx(
                "mt-4 max-w-2xl text-[0.93rem] leading-relaxed",
                dark ? "text-sand-200/90" : "text-ink-600",
              )}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </Container>
    </section>
  );
}
