"use client";

import { themeBootScript } from "@/lib/theme";

/**
 * Applies the visitor's saved light/dark choice before the first paint. It runs
 * while the browser parses the HTML; on the client React renders it as inert
 * text/plain (Next's recommended pattern), so it never runs twice or warns.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeBootScript }}
    />
  );
}
