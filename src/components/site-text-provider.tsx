"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteText } from "@/lib/content/schema";
import type { DeliverySettings } from "@/lib/shipping";

/** What browser-side components need from the dashboard: the header, footer, bag and checkout words, and the delivery settings. */
export type ClientText = Pick<SiteText, "layout" | "shopping" | "store"> & { delivery: DeliverySettings };

const SiteTextContext = createContext<ClientText | null>(null);

export function SiteTextProvider({ value, children }: { value: ClientText; children: ReactNode }) {
  return <SiteTextContext value={value}>{children}</SiteTextContext>;
}

export function useSiteText(): ClientText {
  const value = useContext(SiteTextContext);
  if (!value) throw new Error("useSiteText must be used inside the store's SiteTextProvider.");
  return value;
}
