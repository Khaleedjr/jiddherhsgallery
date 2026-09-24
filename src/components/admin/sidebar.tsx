"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BoxIcon,
  ChartIcon,
  ExternalIcon,
  GridIcon,
  LayersIcon,
  LogoutIcon,
  ReceiptIcon,
  UsersIcon,
} from "@/components/admin/icons";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import { logout } from "@/lib/admin/actions/auth";

const NAV = [
  { href: "/admin", label: "Overview", Icon: GridIcon, exact: true },
  { href: "/admin/orders", label: "Orders", Icon: ReceiptIcon, badge: "pending" as const },
  { href: "/admin/products", label: "Products", Icon: BoxIcon },
  { href: "/admin/inventory", label: "Inventory", Icon: LayersIcon },
  { href: "/admin/customers", label: "Customers", Icon: UsersIcon },
  { href: "/admin/analytics", label: "Analytics", Icon: ChartIcon },
];

type Counts = { pending: number };

function NavLinks({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Dashboard">
      {NAV.map(({ href, label, Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        const count = badge ? counts[badge] : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.84rem] font-medium transition",
              active ? "bg-white/10 text-sand-50" : "text-sand-300/80 hover:bg-white/5 hover:text-sand-50",
            )}
          >
            <Icon className={cx("size-[1.1rem] shrink-0", active ? "text-gold-300" : "text-sand-300/60 group-hover:text-sand-200")} />
            <span className="flex-1">{label}</span>
            {count > 0 ? (
              <span
                className="min-w-5 rounded-full bg-gold-400 px-1.5 py-px text-center text-[0.66rem] font-bold text-forest-950 tabular-nums"
                aria-label={`${count} pending orders`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2">
      <Image src="/logo.png" alt="" width={36} height={36} className="size-9" />
      <span className="leading-tight">
        <span className="block font-display text-[1.15rem] font-semibold text-sand-50">Jidderh&apos;s</span>
        <span className="block text-[0.64rem] font-semibold tracking-[0.18em] text-gold-300/90 uppercase">Dashboard</span>
      </span>
    </Link>
  );
}

function Footer() {
  return (
    <div className="space-y-0.5 border-t border-white/8 pt-3">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-[0.82rem] font-medium text-sand-300/80 transition hover:bg-white/5 hover:text-sand-50"
      >
        <ExternalIcon className="size-[1.05rem] text-sand-300/60" />
        View store
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.82rem] font-medium text-sand-300/80 transition hover:bg-white/5 hover:text-sand-50"
        >
          <LogoutIcon className="size-[1.05rem] text-sand-300/60" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar({ counts }: { counts: Counts }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-forest-950 px-3 py-5 lg:flex">
        <div className="pattern-girih-light pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="relative flex h-full flex-col">
          <Brand />
          <div className="mt-8 flex-1">
            <NavLinks counts={counts} />
          </div>
          <Footer />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-forest-950 px-4 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-lg text-sand-100 hover:bg-white/10"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <MenuIcon className="size-5" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button type="button" className="absolute inset-0 bg-forest-950/60" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-forest-950 px-3 py-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-sand-200 hover:bg-white/10"
                aria-label="Close menu"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div className="mt-7 flex-1">
              <NavLinks counts={counts} onNavigate={() => setOpen(false)} />
            </div>
            <Footer />
          </div>
        </div>
      ) : null}
    </>
  );
}
