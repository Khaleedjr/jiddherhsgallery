"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/admin/ui";
import { SECTIONS, SECTION_KEYS } from "@/lib/content/schema";

const LINKS = [
  { href: "/admin/content", label: "Overview" },
  ...SECTION_KEYS.map((key) => ({ href: `/admin/content/${key}`, label: SECTIONS[key].title })),
  { href: "/admin/content/fonts", label: "Fonts" },
];

/** The pages of the text editor: wrapped buttons on phones, a list beside the editor on laptops. */
export function ContentNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Website text pages" className="lg:sticky lg:top-6 lg:self-start">
      <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block rounded-lg px-3 py-1.5 text-[0.8rem] font-medium transition lg:py-2",
                  active
                    ? "bg-coal-900 text-gold-400"
                    : "border border-sand-200 bg-white text-ink-700 hover:border-sand-300 hover:text-ink-900 lg:border-transparent lg:bg-transparent lg:hover:bg-sand-100",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
