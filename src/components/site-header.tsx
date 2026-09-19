"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import {
  BagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  StarKhatimIcon,
  WhatsappIcon,
} from "@/components/icons";
import { cx } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";
import type { AgeGroup, Department } from "@/lib/types";

type Nav = {
  departments: Department[];
  ageGroups: AgeGroup[];
};

export function SiteHeader({ departments, ageGroups }: Nav) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, openCart } = useCart();
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

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-40 border-b bg-sand-50/95 backdrop-blur transition-shadow duration-300",
          scrolled ? "border-sand-300 shadow-[0_6px_24px_-18px_rgba(22,19,15,0.5)]" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:h-20 sm:gap-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-2 rounded-full p-2 text-forest-900 transition hover:bg-forest-50 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${site.name} home`}>
            <Image
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              priority
              className="size-9 rounded-full sm:size-11"
            />
            <span className="leading-none">
              <span className="block font-display text-[1.15rem] leading-none font-semibold text-forest-900 sm:text-[1.3rem]">
                Jidderh&apos;s
              </span>
              <span className="mt-0.5 block text-[0.58rem] font-semibold tracking-[0.3em] text-gold-600 uppercase">
                Gallery
              </span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
            {departments.map((dept) => (
              <div
                key={dept.slug}
                className="relative"
                onMouseEnter={() => hoverOpen(dept.slug)}
                onMouseLeave={hoverClose}
              >
                <Link
                  href={`/collections/${dept.slug}`}
                  onFocus={() => hoverOpen(dept.slug)}
                  className={cx(
                    "flex items-center gap-1 rounded-full px-3 py-2 text-[0.82rem] font-semibold transition",
                    isActive(`/collections/${dept.slug}`)
                      ? "bg-forest-50 text-forest-900"
                      : "text-ink-700 hover:bg-forest-50 hover:text-forest-900",
                  )}
                  aria-expanded={openMenu === dept.slug}
                >
                  {dept.name}
                  {dept.children.length > 0 ? (
                    <ChevronDownIcon
                      className={cx("size-3.5 transition", openMenu === dept.slug && "rotate-180")}
                    />
                  ) : null}
                </Link>

                {dept.children.length > 0 && openMenu === dept.slug ? (
                  <div className="animate-fade absolute top-full left-0 pt-2">
                    <div className="w-72 overflow-hidden rounded-lg border border-sand-200 bg-white p-2 shadow-[var(--shadow-lift)]">
                      <Link
                        href={`/collections/${dept.slug}`}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-[0.82rem] font-semibold text-forest-800 transition hover:bg-forest-50"
                      >
                        All {dept.name}
                        <span className="text-[0.7rem] font-normal text-ink-400">{dept.count}</span>
                      </Link>
                      <div className="my-1.5 h-px bg-sand-200" />
                      {dept.children.map((child) => (
                        <Link
                          key={child.slug}
                          href={`/collections/${child.slug}`}
                          className="flex items-center justify-between rounded-md px-3 py-2 text-[0.82rem] text-ink-700 transition hover:bg-sand-100 hover:text-forest-900"
                        >
                          {child.name}
                          <span className="text-[0.7rem] text-ink-400">{child.count}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="relative" onMouseEnter={() => hoverOpen("age")} onMouseLeave={hoverClose}>
              <button
                type="button"
                onFocus={() => hoverOpen("age")}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-[0.82rem] font-semibold text-ink-700 transition hover:bg-forest-50 hover:text-forest-900"
                aria-expanded={openMenu === "age"}
              >
                Shop by Age
                <ChevronDownIcon className={cx("size-3.5 transition", openMenu === "age" && "rotate-180")} />
              </button>
              {openMenu === "age" ? (
                <div className="animate-fade absolute top-full left-0 pt-2">
                  <div className="w-80 overflow-hidden rounded-lg border border-sand-200 bg-white p-2 shadow-[var(--shadow-lift)]">
                    {ageGroups.map((age) => (
                      <Link
                        key={age.slug}
                        href={`/age/${age.slug}`}
                        className="block rounded-md px-3 py-2.5 transition hover:bg-sand-100"
                      >
                        <span className="flex items-center justify-between text-[0.82rem] font-semibold text-forest-900">
                          {age.name}
                          <span className="text-[0.7rem] font-normal text-ink-400">{age.count}</span>
                        </span>
                        <span className="mt-0.5 block text-[0.72rem] text-ink-500">{age.blurb}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/shop"
              className={cx(
                "rounded-full px-3 py-2 text-[0.82rem] font-semibold transition",
                isActive("/shop") ? "bg-forest-50 text-forest-900" : "text-ink-700 hover:bg-forest-50 hover:text-forest-900",
              )}
            >
              All Products
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="rounded-full p-2.5 text-forest-900 transition hover:bg-forest-50"
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              <SearchIcon className="size-5" />
            </button>

            <a
              href={whatsappLink(`As-salamu alaykum ${site.name}, I have a question.`)}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full p-2.5 text-forest-900 transition hover:bg-forest-50 sm:block"
              aria-label="Chat on WhatsApp"
            >
              <WhatsappIcon className="size-5" />
            </a>

            <button
              type="button"
              onClick={openCart}
              className="relative rounded-full p-2.5 text-forest-900 transition hover:bg-forest-50"
              aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
            >
              <BagIcon className="size-5" />
              {count > 0 ? (
                <span className="absolute top-0.5 right-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-gold-500 px-1 text-[0.65rem] font-bold text-forest-950">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="animate-fade border-t border-sand-200 bg-white">
            <form onSubmit={submitSearch} className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <SearchIcon className="size-5 shrink-0 text-ink-400" />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for Qur'an, seerah books, prayer mats, toys…"
                className="h-10 flex-1 bg-transparent text-[0.95rem] text-ink-900 outline-none placeholder:text-ink-400"
              />
              <button
                type="submit"
                className="h-9 shrink-0 rounded-full bg-forest-800 px-5 text-xs font-semibold text-sand-50 transition hover:bg-forest-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="shrink-0 rounded-full p-2 text-ink-500 transition hover:bg-sand-100"
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
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        aria-label="Close menu"
      />
      <div className="animate-slide-in absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col bg-sand-50 shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sand-200 px-5">
          <span className="font-display text-lg font-semibold text-forest-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-600 transition hover:bg-sand-200"
            aria-label="Close menu"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {departments.map((dept) => (
            <div key={dept.slug} className="border-b border-sand-200/80 last:border-0">
              <div className="flex items-center">
                <Link
                  href={`/collections/${dept.slug}`}
                  className="flex-1 px-2 py-3.5 text-[0.95rem] font-semibold text-forest-900"
                >
                  {dept.name}
                </Link>
                {dept.children.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onToggleSection(dept.slug)}
                    className="rounded-full p-2 text-ink-500"
                    aria-label={`Show ${dept.name} categories`}
                    aria-expanded={openSection === dept.slug}
                  >
                    <ChevronDownIcon
                      className={cx("size-4 transition", openSection === dept.slug && "rotate-180")}
                    />
                  </button>
                ) : null}
              </div>
              {openSection === dept.slug ? (
                <ul className="animate-fade pb-3">
                  {dept.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={`/collections/${child.slug}`}
                        className="flex items-center justify-between rounded-md px-4 py-2.5 text-[0.85rem] text-ink-700"
                      >
                        {child.name}
                        <span className="text-[0.7rem] text-ink-400">{child.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}

          <div className="mt-4 rounded-lg bg-sand-100 p-3">
            <p className="px-2 pb-1 text-[0.68rem] font-semibold tracking-[0.18em] text-gold-600 uppercase">
              Shop by age
            </p>
            {ageGroups.map((age) => (
              <Link
                key={age.slug}
                href={`/age/${age.slug}`}
                className="flex items-center justify-between rounded-md px-2 py-2.5 text-[0.85rem] text-ink-700"
              >
                {age.name}
                <ChevronRightIcon className="size-3.5 text-ink-400" />
              </Link>
            ))}
          </div>

          <div className="mt-4 space-y-1 px-2">
            {[
              { href: "/shop", label: "All Products" },
              { href: "/about", label: "Our Story" },
              { href: "/contact", label: "Contact & Delivery" },
              { href: "/faq", label: "FAQ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2.5 text-[0.9rem] font-medium text-ink-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-sand-200 p-4">
          <a
            href={whatsappLink(`As-salamu alaykum ${site.name}, I have a question.`)}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-[#05321a]"
          >
            <WhatsappIcon className="size-4" />
            Chat with us
          </a>
        </div>
      </div>
    </div>
  );
}
