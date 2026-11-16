import { isAdmin } from "@/lib/admin/auth";
import { isBot, recordVisit } from "@/lib/stats";

const noContent = () => new Response(null, { status: 204 });

/**
 * The storefront reports each page view here (see VisitTracker). Always
 * answers 204 so a failure never shows to the visitor; the store owner's own
 * browsing while signed in to the dashboard isn't counted.
 */
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return noContent();

  let body: { path?: unknown; search?: unknown; referrer?: unknown; landing?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return noContent();
  }
  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api") || path.length > 300) return noContent();
  if (await isAdmin()) return noContent();

  const headers = request.headers;
  const city = headers.get("x-vercel-ip-city");
  try {
    await recordVisit({
      path,
      search: typeof body.search === "string" ? body.search.slice(0, 300) : "",
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 500) : "",
      landing: body.landing === true,
      userAgent: userAgent.slice(0, 400),
      ip: (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "",
      country: headers.get("x-vercel-ip-country"),
      city: city ? decodeURIComponent(city) : null,
      host: new URL(request.url).hostname,
    });
  } catch (error) {
    console.error("Couldn't record a visit", error instanceof Error ? error.message : error);
  }
  return noContent();
}
