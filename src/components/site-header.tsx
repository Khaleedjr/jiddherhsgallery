"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "@/components/cart-provider";
import {
  ArrowRightIcon,
  BagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  StarKhatimIcon,
  WhatsappIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { cx } from "@/components/ui";
import { useSiteText } from "@/components/site-text-provider";
import { whatsappHref } from "@/lib/content/format";
import { site } from "@/lib/site";
import type { AgeGroup, Department } from "@/lib/types";

type Nav = {
  departments: Department[];
  ageGroups: AgeGroup[];
};

/** Short names keep the capitals on one line beside the logo. */
const shortName = (name: string) => (name === "Ibadah Essentials" ? "Ibadah" : name);

const caps = "text-[0.72rem] font-semibold tracking-[0.18em] uppercase";

/**
 * Design 4's header: a gold band with the logo set in the middle as a
 * medallion and a rule broken by an eight-point star underneath. On laptops a
 * search field sits left of the logo, the switch and bag right of it, and the
 * departments run along the rule either side of the star. On phones the menu,
 * search and bag are buttons. It stays at the top while you scroll.
 */
export function SiteHeader({ departments, ageGroups }: Nav) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, openCart } = useCart();
  const t = useSiteText().layout;
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hoverOpen = (key: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  const hoverClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const linkClass = (active: boolean) =>
    cx(caps, "flex items-center gap-1 border-b-[1.5px] py-2 whitespace-nowrap transition-colors", active ? "border-coal-900" : "border-transparent hover:border-coal-900");

  /* Three departments to the left of the logo; the fourth, ages and "Shop all" to the right. */
  const left = departments.slice(0, 3);
  const right = departments.slice(3);

  const department = (dept: Department, align: "left" | "right") => (
    <div key={dept.slug} className="relative" onMouseEnter={() => hoverOpen(dept.slug)} onMouseLeave={hoverClose}>
      <Link
        href={`/collections/${dept.slug}`}
        onFocus={() => hoverOpen(dept.slug)}
        className={linkClass(isActive(`/collections/${dept.slug}`))}
        aria-expanded={dept.children.length > 0 ? openMenu === dept.slug : undefined}
      >
        {shortName(dept.name)}
        {dept.children.length > 0 ? <ChevronDownIcon className={cx("size-3 transition", openMenu === dept.slug && "rotate-180")} /> : null}
      </Link>
      {dept.children.length > 0 && openMenu === dept.slug ? (
        <Dropdown align={align}>
          <Link
            href={`/collections/${dept.slug}`}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[0.85rem] font-semibold text-ink-900 transition hover:bg-sand-200"
          >
            All {dept.name.toLowerCase()}
            <span className="text-[0.72rem] font-normal text-ink-500 tabular-nums">{dept.count}</span>
          </Link>
          <div className="my-1.5 h-px bg-ink-900/10" />
          {dept.children.map((child) => (
            <Link
              key={child.slug}
              href={`/collections/${child.slug}`}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-[0.85rem] text-ink-700 transition hover:bg-sand-200 hover:text-ink-900"
            >
              {child.name}
              <span className="text-[0.72rem] text-ink-500 tabular-nums">{child.count}</span>
            </Link>
          ))}
        </Dropdown>
      ) : null}
    </div>
  );

  return (
    <>
      <header className={cx("tone-gold sticky top-0 z-40 bg-gold-500 text-ink-900 transition-shadow duration-300", scrolled && "shadow-[0_12px_28px_-20px_rgba(20,17,10,0.75)]")}>
        <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-20 sm:px-6 lg:h-[4.75rem] lg:gap-6 lg:px-8">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-2.5 grid size-11 place-items-center rounded-full transition hover:bg-coal-900/10 lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="size-5" />
            </button>
            <ThemeToggle className="lg:hidden" />
            <HeaderSearch className="max-lg:hidden" />
          </div>

          {/* On gold the logo's own disc disappears; a black ring turns it into a medallion. */}
          <Link
            href="/"
            aria-label={`${site.name} home`}
            className="rounded-full ring-1 ring-coal-900 ring-offset-2 ring-offset-gold-500"
          >
            <Image src="/logo.png" alt="" width={60} height={60} loading="eager" className="size-11 rounded-full sm:size-14 lg:size-[3.75rem]" />
          </Link>

          <div className="flex items-center justify-end">
            <ThemeToggle className="max-lg:hidden" />

            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="grid size-11 place-items-center rounded-full transition hover:bg-coal-900/10 lg:hidden"
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              <SearchIcon className="size-5" />
            </button>

            <button
              type="button"
              onClick={openCart}
              className="relative -mr-2.5 grid size-11 place-items-center rounded-full transition hover:bg-coal-900/10"
              aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
            >
              <BagIcon className="size-5" />
              {count > 0 ? (
                <span className="tone-ink absolute top-0.5 right-0.5 grid min-w-[1.2rem] place-items-center rounded-full bg-coal-900 px-1 text-[0.65rem] font-bold text-gold-500 tabular-nums ring-2 ring-gold-500">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* A rule broken by an eight-point star. On laptops the departments run along it, either side of the star. */}
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 pb-2 sm:px-6 lg:gap-6 lg:px-8 lg:pb-1.5">
          <span className="h-px min-w-6 flex-1 bg-linear-to-r from-transparent to-coal-900" aria-hidden />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="Departments">
            {left.map((dept) => department(dept, "left"))}
          </nav>
          <StarKhatimIcon className="size-3.5 shrink-0" aria-hidden />
          <nav className="hidden items-center gap-5 lg:flex xl:gap-8" aria-label="More">
            {right.map((dept) => department(dept, "right"))}

            <div className="relative" onMouseEnter={() => hoverOpen("age")} onMouseLeave={hoverClose}>
              <button type="button" onFocus={() => hoverOpen("age")} className={linkClass(isActive("/age"))} aria-expanded={openMenu === "age"}>
                {t.byAge}
                <ChevronDownIcon className={cx("size-3 transition", openMenu === "age" && "rotate-180")} />
              </button>
              {openMenu === "age" ? (
                <Dropdown align="right" wide>
                  {ageGroups.map((age) => (
                    <Link key={age.slug} href={`/age/${age.slug}`} className="block rounded-xl px-3 py-2.5 transition hover:bg-sand-200">
                      <span className="flex items-center justify-between text-[0.85rem] font-semibold text-ink-900">
                        {age.name}
                        <span className="text-[0.72rem] font-normal text-ink-500 tabular-nums">{age.count}</span>
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] text-ink-500">{age.blurb}</span>
                    </Link>
                  ))}
                </Dropdown>
              ) : null}
            </div>

            <Link href="/shop" className={linkClass(isActive("/shop"))}>
              {t.shopAll}
            </Link>
          </nav>
          <span className="h-px min-w-6 flex-1 bg-linear-to-l from-transparent to-coal-900" aria-hidden />
        </div>

        {searchOpen ? (
          <div className="tone-paper animate-fade border-t border-coal-900/15 bg-sand-50">
            <form onSubmit={submitSearch} className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
              <SearchIcon className="size-5 shrink-0 text-ink-500" />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPanelPlaceholder}
                aria-label="Search the store"
                className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-coal-900 px-5 text-sm font-semibold text-gold-500 transition hover:bg-black active:scale-[0.97]"
              >
                {t.searchButton}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-full text-ink-600 transition hover:bg-sand-200"
                aria-label="Close search"
              >
                <CloseIcon className="size-4" />
              </button>
            </form>
          </div>
        ) : null}
      </header>

      {mobileOpen ? (
        <MobileNav
          departments={departments}
          ageGroups={ageGroups}
          openSection={mobileSection}
          onToggleSection={(slug) => setMobileSection((current) => (current === slug ? null : slug))}
          onClose={() => setMobileOpen(false)}
        />
      ) : null}
    </>
  );
}

/** The laptop header's search: a slim pill left of the logo, black like the buttons (white in light mode). */
function HeaderSearch({ className }: { className?: string }) {
  const t = useSiteText().layout;
  return (
    <Form
      action="/search"
      role="search"
      className={cx(
        "tone-ink flex h-11 w-full max-w-[19rem] items-center gap-2 rounded-full bg-coal-900 py-1 pr-1 pl-4 text-sand-50 transition-shadow focus-within:ring-2 focus-within:ring-sand-50/70 xl:max-w-xs",
        className,
      )}
    >
      <SearchIcon className="size-[1.1rem] shrink-0 text-gold-500" />
      <input
        name="q"
        type="search"
        required
        enterKeyHint="search"
        autoComplete="off"
        aria-label="Search the store"
        placeholder={t.searchPlaceholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-sand-50 outline-none placeholder:text-sand-50/55 focus-visible:shadow-none focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-500 text-coal-900 transition hover:bg-gold-400 active:scale-95"
      >
        <ArrowRightIcon className="size-4" />
      </button>
    </Form>
  );
}

function Dropdown({ align, wide = false, children }: { align: "left" | "right"; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cx("animate-fade absolute top-full pt-3", align === "left" ? "-left-3" : "-right-3")}>
      <div
        className={cx(
          "tone-paper overflow-hidden rounded-[1.25rem] bg-sand-50 p-2 shadow-[0_24px_48px_-24px_rgba(20,17,10,0.55)] ring-1 ring-coal-900/10",
          wide ? "w-80" : "w-72",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The phone menu: a black panel from the left, departments first, then ages, then help. */
function MobileNav({
  departments,
  ageGroups,
  openSection,
  onToggleSection,
  onClose,
}: Nav & {
  openSection: string | null;
  onToggleSection: (slug: string) => void;
  onClose: () => void;
}) {
  const { layout: t, store } = useSiteText();
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-coal-950/55 backdrop-blur-[2px]" aria-label="Close menu" />
      <div className="tone-ink animate-slide-in absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col bg-coal-900 text-sand-50 shadow-2xl" role="dialog" aria-label="Menu">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Image src="/logo.png" alt={site.name} width={40} height={40} className="size-10 rounded-full" />
          <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full transition hover:bg-white/10" aria-label="Close menu">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu">
          {departments.map((dept) => (
            <div key={dept.slug} className="border-b border-white/10 last:border-0">
              <div className="flex items-center">
                <Link href={`/collections/${dept.slug}`} className="flex-1 px-2 py-3.5 font-display text-lg font-bold tracking-tight text-gold-500">
                  {dept.name}
                </Link>
                {dept.children.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onToggleSection(dept.slug)}
                    className="grid size-11 place-items-center rounded-full text-coal-300 transition hover:bg-white/10"
                    aria-label={`Show ${dept.name} categories`}
                    aria-expanded={openSection === dept.slug}
                  >
                    <ChevronDownIcon className={cx("size-4 transition", openSection === dept.slug && "rotate-180")} />
                  </button>
                ) : null}
              </div>
              {openSection === dept.slug ? (
                <ul className="animate-fade pb-3">
                  {dept.children.map((child) => (
                    <li key={child.slug}>
                      <Link href={`/collections/${child.slug}`} className="flex items-center justify-between rounded-xl px-4 py-2.5 text-[0.9rem] text-coal-200">
                        {child.name}
                        <span className="text-[0.72rem] text-coal-400 tabular-nums">{child.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}

          <div className="mt-4 rounded-[1.25rem] bg-white/5 p-3">
            <p className={cx(caps, "px-2 pb-1 text-gold-500")}>Shop by age</p>
            {ageGroups.map((age) => (
              <Link key={age.slug} href={`/age/${age.slug}`} className="flex items-center justify-between rounded-xl px-2 py-2.5 text-[0.9rem] text-coal-100">
                {age.name}
                <ChevronRightIcon className="size-3.5 text-coal-400" />
              </Link>
            ))}
          </div>

          <div className="mt-4 space-y-1 px-2">
            {[
              { href: "/shop", label: t.menuAllProducts },
              { href: "/about", label: t.menuStory },
              { href: "/contact", label: t.menuContact },
              { href: "/faq", label: t.menuFaq },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block py-2.5 text-[0.95rem] font-medium text-coal-100">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <a
            href={whatsappHref(store.whatsapp, t.menuWhatsappMessage)}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold-500 text-sm font-semibold text-coal-900 transition active:scale-[0.97]"
          >
            <WhatsappIcon className="size-4" />
            {t.menuWhatsapp}
          </a>
        </div>
      </div>
    </div>
  );
}
