import { createHash } from "node:crypto";
import { getDriver } from "@/lib/store/driver";

/**
 * Visitor stats, kept privately in the store's own database. No cookies and
 * nothing that identifies a person: a visitor is a one-way hash of their
 * network address and browser that changes every day, and all that is kept
 * of a visit is the page, the day, the country and city, the kind of device,
 * and where the visitor came from.
 */

const RECENT_KEPT = 300;
/** Days are counted in Nigerian time. */
const TIME_ZONE = "Africa/Lagos";

export const statsDay = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);

/* Crawlers and monitoring tools. Visits are reported by the page's own script, so link previewers
   (WhatsApp, Facebook) that never run it are left out already; this catches the ones that do. */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http/i;
export const isBot = (userAgent: string) => !userAgent || BOT.test(userAgent);

export type Device = "phone" | "tablet" | "computer";
export function deviceOf(userAgent: string): Device {
  if (/ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return "phone";
  return "computer";
}

/** Where a visit came from, in words the store owner recognises. */
export function sourceOf(referrer: string, ownHost: string, utmSource?: string | null): string | null {
  const utm = utmSource?.trim().toLowerCase();
  if (utm) return SOURCE_NAMES[utm] ?? utm.slice(0, 40);
  if (!referrer) return "Direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Direct";
  }
  if (!host || host === ownHost.replace(/^www\./, "")) return null; // moving around the site, not arriving
  for (const [pattern, name] of SOURCE_PATTERNS) if (pattern.test(host)) return name;
  return host.slice(0, 60);
}

const SOURCE_PATTERNS: Array<[RegExp, string]> = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)yahoo\./, "Yahoo"],
  [/duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.me|fb\.com)$/, "Facebook"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X (Twitter)"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)snapchat\.com$/, "Snapchat"],
  [/(^|\.)linkedin\.com$|lnkd\.in$/, "LinkedIn"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)telegram\.(org|me)$|^t\.me$/, "Telegram"],
  [/jiddersgallery\.com\.ng$/, "Old website"],
  [/(^|\.)paystack\.(com|co)$/, "Paystack"],
];
const SOURCE_NAMES: Record<string, string> = {
  google: "Google",
  instagram: "Instagram",
  ig: "Instagram",
  facebook: "Facebook",
  fb: "Facebook",
  whatsapp: "WhatsApp",
  wa: "WhatsApp",
  twitter: "X (Twitter)",
  x: "X (Twitter)",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/** A visitor for one day: their address and browser, hashed with a secret and the date so it can't be traced back or followed across days. */
function visitorId(ip: string, userAgent: string, day: string) {
  const secret = process.env.STATS_SECRET || process.env.ADMIN_PASSWORD || "jidderhs-gallery";
  return createHash("sha256").update(`${secret}|${day}|${ip}|${userAgent}`).digest("base64url").slice(0, 16);
}

/** Field names inside a day's counters can't contain the separator used below, and stay short. */
const clip = (value: string, max = 120) => value.replace(/[\n\r\t|]/g, " ").trim().slice(0, max);

export type RecentHit = {
  /** When, as an ISO time. */
  t: string;
  /** Page path. */
  p: string;
  /** Short, daily visitor id, to group a visitor's pages. */
  v: string;
  /** Country code and city. */
  c?: string;
  ct?: string;
  d: Device;
  /** Where they came from, on the first page of a visit. */
  r?: string;
  /** What they searched for, on the search page. */
  q?: string;
};

export type VisitInput = {
  path: string;
  search: string;
  referrer: string;
  /** True for the first page of a visit (a new tab or a fresh load). */
  landing: boolean;
  userAgent: string;
  ip: string;
  country: string | null;
  city: string | null;
  host: string;
};

export async function recordVisit(input: VisitInput) {
  const now = new Date();
  const day = statsDay(now);
  const params = new URLSearchParams(input.search);
  const path = clip(input.path, 160) || "/";
  const device = deviceOf(input.userAgent);
  const country = input.country && /^[A-Z]{2}$/.test(input.country) ? input.country : "XX";
  const city = input.city ? clip(input.city, 60) : "";
  const visitor = visitorId(input.ip, input.userAgent, day);
  const source = input.landing ? sourceOf(input.referrer, input.host, params.get("utm_source")) : null;
  const query = path === "/search" ? clip(params.get("q")?.toLowerCase() ?? "", 60) : "";

  const counts: Record<string, number> = { v: 1, [`p:${path}`]: 1 };
  if (input.landing) {
    counts.s = 1;
    counts[`c:${country}`] = 1;
    counts[`d:${device}`] = 1;
    if (city) counts[`t:${city}|${country}`] = 1;
    if (source) counts[`r:${source}`] = 1;
  }
  if (query) counts[`q:${query}`] = 1;

  const recent: RecentHit = { t: now.toISOString(), p: path, v: visitor.slice(0, 8), d: device };
  if (country !== "XX") recent.c = country;
  if (city) recent.ct = city;
  if (source) recent.r = source;
  if (query) recent.q = query;

  await getDriver().recordHit({ day, counts, visitor, recent: JSON.stringify(recent), keepRecent: RECENT_KEPT });
}

/* ---------------------------------------------------------------- reading */

export const STATS_RANGES = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
] as const;
export type StatsRangeKey = (typeof STATS_RANGES)[number]["key"];
export const isStatsRange = (value: unknown): value is StatsRangeKey => STATS_RANGES.some((range) => range.key === value);

export type Ranked = Array<{ key: string; value: number }>;

const ranked = (totals: Map<string, number>, limit: number): Ranked =>
  [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));

/** Everything the Visitors page shows for a range of days ending today. */
export async function getVisitorStats(rangeKey: StatsRangeKey, now = new Date()) {
  const range = STATS_RANGES.find((r) => r.key === rangeKey)!;
  const days = Array.from({ length: range.days }, (_, i) => statsDay(new Date(now.getTime() - (range.days - 1 - i) * 86_400_000)));
  const driver = getDriver();
  const [{ days: perDay, visitors }, recentRaw] = await Promise.all([driver.readStatsDays(days), driver.recentHits(RECENT_KEPT)]);

  const groups = { p: new Map<string, number>(), r: new Map<string, number>(), c: new Map<string, number>(), t: new Map<string, number>(), d: new Map<string, number>(), q: new Map<string, number>() };
  let views = 0;
  let visits = 0;
  for (const { counts } of perDay) {
    views += counts.v ?? 0;
    visits += counts.s ?? 0;
    for (const [field, value] of Object.entries(counts)) {
      const cut = field.indexOf(":");
      if (cut < 0) continue;
      const group = groups[field.slice(0, cut) as keyof typeof groups];
      if (group) group.set(field.slice(cut + 1), (group.get(field.slice(cut + 1)) ?? 0) + value);
    }
  }

  const recent: RecentHit[] = [];
  for (const raw of recentRaw) {
    try {
      const hit = JSON.parse(raw) as RecentHit;
      if (hit && typeof hit.t === "string" && typeof hit.p === "string") recent.push(hit);
    } catch {
      /* skip anything unreadable */
    }
  }

  return {
    range,
    days,
    series: days.map((day, i) => ({ day, views: perDay[i]?.counts.v ?? 0, visitors: perDay[i]?.visitors ?? 0 })),
    views,
    visitors,
    visits,
    pages: ranked(groups.p, 12),
    sources: ranked(groups.r, 10),
    countries: ranked(groups.c, 10),
    cities: ranked(groups.t, 10),
    devices: ranked(groups.d, 3),
    searches: ranked(groups.q, 12),
    recent,
  };
}

export type VisitorStats = Awaited<ReturnType<typeof getVisitorStats>>;
