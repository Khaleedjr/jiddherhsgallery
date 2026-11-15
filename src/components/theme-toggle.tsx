"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Switches between the normal look (black on gold) and light mode (white on
 * gold). The icons and label follow <html data-theme> through CSS, so the
 * button renders the same on the server and needs no state of its own.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    const apply = () => {
      if (next === "light") root.dataset.theme = "light";
      else delete root.dataset.theme;
    };
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!calm && typeof document.startViewTransition === "function") document.startViewTransition(apply);
    else apply();
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or storage blocked: the switch still works for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cx("grid size-11 place-items-center rounded-full transition hover:bg-coal-900/10 active:scale-95", className)}
    >
      <SunIcon className="size-5 light:hidden" />
      <MoonIcon className="hidden size-5 light:block" />
      <span className="sr-only light:hidden">Switch to light mode</span>
      <span className="sr-only hidden light:inline">Switch to dark mode</span>
    </button>
  );
}
