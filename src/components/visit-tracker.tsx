"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Reports each page view to /api/stats/hit for the dashboard's Visitors page:
 * the page, and on the first page of a visit, the site the visitor came from.
 * No cookies or storage. Uses sendBeacon so it never holds up the page.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const landing = useRef(true);

  useEffect(() => {
    if (navigator.webdriver) return; // automated browsers
    const body = JSON.stringify({ path: pathname, search, referrer: landing.current ? document.referrer : "", landing: landing.current });
    landing.current = false;
    try {
      const sent = navigator.sendBeacon?.("/api/stats/hit", new Blob([body], { type: "application/json" }));
      if (!sent) void fetch("/api/stats/hit", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    } catch {
      /* stats are never worth an error */
    }
  }, [pathname, search]);

  return null;
}
