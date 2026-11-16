"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteText } from "@/lib/content/schema";

/** The part of the site text that browser-side components need: the header, footer, bag and checkout words. */
export type ClientText = Pick<SiteText, "layout" | "shopping" | "store">;

const SiteTextContext = createContext<ClientText | null>(null);

export function SiteTextProvider({ value, children }: { value: ClientText; children: ReactNode }) {
  return <SiteTextContext value={value}>{children}</SiteTextContext>;
}

export function useSiteText(): ClientText {
  const value = useContext(SiteTextContext);
  if (!value) throw new Error("useSiteText must be used inside the store's SiteTextProvider.");
  return value;
}
