import type { Metadata } from "next";
import Link from "next/link";
import { RankedBars } from "@/components/admin/bars";
import { TrendChart } from "@/components/admin/charts";
import { AdminPage, Card, StatTile, cx } from "@/components/admin/ui";
import { formatNumber, formatPercent, timeAgo } from "@/lib/admin/format";
import { getCatalog, type Catalog } from "@/lib/catalog";
import { STATS_RANGES, getVisitorStats, isStatsRange, statsDay, type RecentHit } from "@/lib/stats";
import { listOrders } from "@/lib/store/orders";

export const metadata: Metadata = { title: "Visitors" };

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) => {
  if (!/^[A-Z]{2}$/.test(code) || code === "XX") return "Unknown";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const DEVICE_LABEL: Record<string, string> = { phone: "Phone", tablet: "Tablet", computer: "Computer" };

const FIXED_PAGES: Record<string, string> = {
  "/": "Home page",
  "/shop": "Shop all products",
  "/search": "Search",
  "/cart": "Bag",
  "/checkout": "Checkout",
  "/checkout/complete": "Order confirmation",
  "/about": "Our story",
  "/contact": "Contact & delivery",
  "/faq": "FAQ",
  "/pickup-delivery": "Pickup & delivery",
  "/delivery-returns": "Pickup & delivery",
  "/returns": "Exchange & returns",
  "/privacy": "Privacy policy",
  "/terms": "Terms of service",
};

/** A page's name as the store owner knows it: the product, collection or age group, not its address. */
function pageName(path: string, catalog: Catalog) {
  if (FIXED_PAGES[path]) return FIXED_PAGES[path];
  const [, kind, ...rest] = path.split("/");
  const slug = rest.join("/");
  if (kind === "products") return catalog.getProduct(slug)?.name ?? path;
  if (kind === "collections") return catalog.findCategory(slug)?.node.name ?? catalog.findCollection(slug)?.name ?? path;
  if (kind === "age") return catalog.findAgeGroup(slug)?.name ?? path;
  return path;
}

type Visitor = { id: string; first: RecentHit; last: RecentHit; pages: string[]; count: number };

/** The recent page views, gathered into one row per visitor (newest first). */
function groupVisitors(hits: RecentHit[], limit: number): Visitor[] {
  const byId = new Map<string, Visitor>();
  for (const hit of hits) {
    const key = `${hit.v}|${hit.t.slice(0, 10)}`;
    const existing = byId.get(key);
    if (!existing) {
      if (byId.size >= limit) continue;
      byId.set(key, { id: key, first: hit, last: hit, pages: [hit.p], count: 1 });
    } else {
      existing.first = hit; // hits arrive newest first, so the last one seen is where the visit began
      existing.pages.unshift(hit.p);
      existing.count += 1;
    }
  }
  return [...byId.values()];
}

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const rangeKey = isStatsRange(rangeParam) ? rangeParam : "7d";
  const [stats, catalog, orders] = await Promise.all([getVisitorStats(rangeKey), getCatalog(), listOrders()]);

  const days = new Set(stats.days);
  const paidOrders = orders.filter((order) => order.paidAt && days.has(statsDay(new Date(order.paidAt)))).length;
  const pagesPerVisit = stats.visits ? stats.views / stats.visits : 0;
  const visitors = groupVisitors(stats.recent, 25);
  const empty = stats.views === 0;
  const href = (key: string) => (key === "7d" ? "/admin/visitors" : `/admin/visitors?range=${key}`);

  return (
    <AdminPage
      title="Visitors"
      description="Who visits the store, where they come from and what they look at. Counted privately: no cookies, nothing that identifies a person."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Date range" className="flex flex-wrap gap-1 rounded-xl border border-sand-200 bg-white p-1">
          {STATS_RANGES.map((range) => (
            <Link
              key={range.key}
              href={href(range.key)}
              aria-current={range.key === rangeKey ? "true" : undefined}
              scroll={false}
              className={cx(
                "rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold whitespace-nowrap transition",
                range.key === rangeKey ? "bg-coal-800 text-sand-50" : "text-ink-600 hover:bg-sand-100 hover:text-ink-900",
              )}
            >
              {range.label}
            </Link>
          ))}
        </nav>
        <Link href={href(rangeKey)} className="text-[0.76rem] font-semibold text-ink-500 transition hover:text-ink-900">
          Refresh
        </Link>
      </div>

      {empty ? (
        <p className="rounded-xl border border-gold-300 bg-gold-100/60 px-4 py-3 text-[0.82rem] leading-relaxed text-ink-700">
          No visits counted {rangeKey === "today" ? "today" : "in this period"} yet. Counting started when this version of the site went live, so the
          numbers fill in as people browse the store. Your own visits while signed in to the dashboard are left out.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatTile label="Views" value={formatNumber(stats.views)} hint="pages opened" />
        <StatTile label="Visitors" value={formatNumber(stats.visitors)} hint="different people, roughly" />
        <StatTile label="Visits" value={formatNumber(stats.visits)} hint="times someone arrived" />
        <StatTile label="Pages per visit" value={stats.visits ? pagesPerVisit.toFixed(1) : "—"} />
        <StatTile label="Paid orders" value={formatNumber(paidOrders)} href="/admin/orders" />
        <StatTile label="Buying visitors" value={stats.visitors ? formatPercent(paidOrders / stats.visitors, 1) : "—"} hint="paid orders per visitor" />
      </div>

      {stats.days.length > 1 ? (
        <Card title="Views per day" description="Hover a day for its visitors">
          <TrendChart
            kind="bar"
            label="Views per day"
            points={stats.series.map((point) => ({
              key: point.day,
              label: new Date(`${point.day}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }),
              value: point.views,
              detail: `${formatNumber(point.visitors)} ${point.visitors === 1 ? "visitor" : "visitors"}`,
            }))}
            valueFormat="count"
            height={240}
          />
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Most viewed pages" description="Products, departments and pages, by views">
          <RankedBars
            rows={stats.pages.map(({ key, value }) => ({
              key,
              label: (
                <Link href={key} target="_blank" className="hover:underline">
                  {pageName(key, catalog)}
                </Link>
              ),
              value,
            }))}
            format={formatNumber}
          />
        </Card>
        <Card title="Where visitors come from" description="The site or app a visit started from">
          <RankedBars rows={stats.sources.map(({ key, value }) => ({ key, label: key, value }))} format={formatNumber} />
          {stats.sources.length ? (
            <p className="mt-4 text-[0.72rem] leading-relaxed text-ink-500">
              “Direct” means the address was typed, saved or opened from an app that doesn&apos;t say where it came from (WhatsApp usually doesn&apos;t).
            </p>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Countries">
          <RankedBars rows={stats.countries.map(({ key, value }) => ({ key, label: countryName(key), value }))} format={formatNumber} />
        </Card>
        <Card title="Cities">
          <RankedBars
            rows={stats.cities.map(({ key, value }) => {
              const [city, country] = key.split("|");
              return { key, label: country && country !== "NG" ? `${city}, ${countryName(country)}` : city, value };
            })}
            format={formatNumber}
          />
        </Card>
        <Card title="Devices">
          <RankedBars rows={stats.devices.map(({ key, value }) => ({ key, label: DEVICE_LABEL[key] ?? key, value }))} format={formatNumber} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card title="What people searched for" description="Searches on the store; a gap here may be a product worth stocking">
          <RankedBars
            rows={stats.searches.map(({ key, value }) => ({
              key,
              label: (
                <Link href={`/search?q=${encodeURIComponent(key)}`} target="_blank" className="hover:underline">
                  {key}
                </Link>
              ),
              value,
            }))}
            format={formatNumber}
            showShare={false}
            empty="No searches in this period."
          />
        </Card>

        <Card title="Latest visitors" description="Each row is one visitor and the pages they opened, newest first">
          {visitors.length ? (
            <ol className="divide-y divide-sand-200">
              {visitors.map((visitor) => {
                const { first, last } = visitor;
                const place = [last.ct, last.c ? countryName(last.c) : null].filter(Boolean).join(", ") || "Unknown place";
                return (
                  <li key={visitor.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="text-[0.82rem] font-semibold text-ink-900">
                        {place}
                        <span className="font-normal text-ink-500">
                          {" "}
                          · {DEVICE_LABEL[last.d] ?? last.d}
                          {first.r ? ` · from ${first.r}` : ""}
                        </span>
                      </p>
                      <time dateTime={last.t} className="text-[0.72rem] text-ink-500 tabular-nums">
                        {timeAgo(last.t)}
                      </time>
                    </div>
                    <p className="mt-1 text-[0.76rem] leading-relaxed text-ink-600">
                      {visitor.count} {visitor.count === 1 ? "page" : "pages"}:{" "}
                      {visitor.pages
                        .slice(0, 6)
                        .map((path) => pageName(path, catalog))
                        .join(" → ")}
                      {visitor.pages.length > 6 ? ` → … ${visitor.pages.length - 6} more` : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="py-6 text-center text-[0.8rem] text-ink-500">No visitors yet.</p>
          )}
        </Card>
      </div>

      <p className="text-[0.72rem] leading-relaxed text-ink-500">
        Visitors are counted per day: someone who comes back tomorrow counts again, so the total over several days is an estimate. Nobody can be
        named from these figures; the place comes from their internet connection and is often the nearest big city. Your old WordPress site&apos;s
        Jetpack stats are separate and stay there.
      </p>
    </AdminPage>
  );
}
