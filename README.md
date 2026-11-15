# Jidderh's Gallery

A complete rebuild of [jiddersgallery.com.ng](https://jiddersgallery.com.ng): a modern Islamic
storefront plus a store dashboard for products, stock, orders, customers and analytics. Built with
Next.js (App Router), TypeScript and Tailwind CSS v4.

## What is in the box

| Area | Detail |
| --- | --- |
| Storefront | Home, shop, category, age, product, cart, checkout, search, about, contact, FAQ, policies |
| Checkout | Bag → details and shipping option (the old store's zones and prices) → pay on Paystack → order confirmed (e.g. `JG-1043`), stock taken, receipt emailed |
| Dashboard | `/admin` — overview, orders, products, inventory & stock log, customers, analytics, CSV exports |
| Rendering | Storefront pages are static and rebuilt automatically after any dashboard change |
| SEO | Per-page metadata, Open Graph, `Product`/`Store`/`FAQPage` JSON-LD, sitemap, robots |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000 — dashboard at /admin
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

In development the dashboard password is `jidderh-admin` (shown on the sign-in page). Production
never has a default: the dashboard stays locked until `ADMIN_PASSWORD` is set.

## Environment variables

| Variable | Needed | What it does |
| --- | --- | --- |
| `ADMIN_PASSWORD` | **Yes, in production** | The dashboard password. Changing it signs everyone out. |
| `PAYSTACK_SECRET_KEY` | **Yes, to take orders** | Paystack secret key: `sk_test_…` while testing, `sk_live_…` to take real money. Without it checkout is switched off and the dashboard shows a red bar. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | **Yes, on Vercel** | Upstash Redis, where orders, product edits, stock and uploaded photos are kept. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work. |
| `ADMIN_SESSION_SECRET` | Optional | Signs sign-in cookies. Defaults to a key derived from the password. |
| `JG_DATA_DIR` | Optional | Folder for the file store on a server with a real disk. Defaults to `./.data`. |

### Why Vercel needs Redis

Vercel's servers forget everything written to disk between requests. Without Redis the site
still works, but orders and dashboard edits would vanish, so the dashboard shows a red warning
bar until storage is connected. To connect it: Vercel project → **Storage** → **Upstash for Redis**
(free tier is plenty) → connect to the project. That adds both `KV_REST_API_*` variables. Redeploy.

On any other Node host with a disk (`npm run build && npm run start`), the JSON file store in
`./.data` is persistent and Redis is not needed.

## Payments (Paystack)

Checkout charges the bag plus the chosen shipping option through Paystack, the same provider
the old WooCommerce store used. The customer pays on Paystack's own page (card, bank transfer or
USSD); the site never sees card details.

1. In the Paystack dashboard, open **Settings → API Keys & Webhooks** and copy the **secret key**
   into `PAYSTACK_SECRET_KEY` (in Vercel: Project → Settings → Environment Variables). Use the test
   key first: Paystack's test cards let you try a whole order without real money.
2. On the same Paystack page set the **Webhook URL** to `https://<your domain>/api/paystack/webhook`.
   The webhook confirms an order even if the customer closes the tab before returning to the store.
3. Redeploy so the new variable is picked up.

How an order moves: placing it records it as **Awaiting payment** (its own tab under Orders, kept
out of the to-do counts, analytics and customers). When Paystack confirms the payment, from the
customer's return page or the webhook, whichever comes first, the order becomes **Confirmed**, its
items come out of stock, and the payment reference and method are shown on the order. A payment for
the wrong amount is noted on the order and not accepted. Unpaid attempts can be cancelled or deleted.

Shipping zones and prices live in `src/lib/shipping.ts`, copied from the old store's checkout:
₦1,000 within Kaduna, named parks in Kano, Abuja and Lagos, a waybill fee per state from ₦1,500 to
₦6,000, free delivery from ₦100,000, and free pickup in Kaduna. Abia, Akwa Ibom, Anambra, Ebonyi and
Ekiti had no zone on the old store, so they can only choose pickup until one is added there.

## The dashboard

- **Overview** — what needs doing (orders to confirm or dispatch, items out of stock), the last
  7 days against the 7 before, 30-day revenue, recent orders, restock list, top sellers.
- **Orders** — every website order lands here as *Pending* the moment the customer is sent to
  WhatsApp. Filter by status, channel, delivery or date; search by ref, name, phone or product.
  Each order has a timeline, private notes, editable delivery fee/discount/payment method and a
  one-tap WhatsApp message to the customer. **Record an order** adds WhatsApp, Instagram and
  walk-in sales so they count too.
- **Products** — WooCommerce-style list with search, filters, sorting and bulk publish / draft /
  delete. The editor covers name, web address, summary, a visual description editor (with an HTML
  view), photos (uploaded and resized in the browser), price and "was" price, options such as
  colour and size with their own price and stock, categories, age groups, collections, tags and
  draft/published status.
- **Inventory** — stock per item and per option, stock value, out-of-stock and running-low
  views, and an **Adjust** dialog (restock, return, count, damaged) where every change needs a
  reason. The **Stock log** records every unit in and out.
- **Customers** — built from orders and grouped by phone number however it was typed
  (`0803…`, `+234 803…`). Lifetime spend, order history and favourite products.
- **Analytics** — revenue, paid orders, average order, items sold, customers and confirmed rate
  against the previous period; revenue and orders over time; order status; best sellers; sales by
  department; delivery states; busiest weekdays; channels; new vs returning customers.
- **Exports** — CSV for products, stock, stock log, orders and customers (opens cleanly in Excel).

### How stock moves

- A website order starts **Pending** and does not touch stock.
- Moving an order to **Confirmed**, **Dispatched** or **Delivered** takes its items out of stock.
- **Cancelling** (or deleting) an order that had taken stock puts it back.
- Every movement is written to the stock log with its reason and order reference.
- Products whose stock isn't counted are left alone by orders.

Revenue counts confirmed, dispatched and delivered orders (including delivery fees). Times are Lagos
time.

### Sample data

While there are no real orders, the overview offers **Explore with sample data**: 160 realistic
orders over six months so the analytics can be seen working. Sample orders are labelled, never
move real stock, and **Remove sample data** clears them in one click.

## Store details

Everything store-specific (WhatsApp number, phone, email, Kaduna pickup hours, delivery fees, the
₦100,000 free-delivery threshold, Instagram) lives in **`src/lib/site.ts`**, taken from the old site.

## Catalogue source

The store is seeded from `src/data/products.json`. After that **the dashboard is the source of
truth**, and re-importing never overwrites anything edited there.

To bring the catalogue up to date with the live WooCommerce store:

```bash
npm run catalog:live   # reads jiddersgallery.com.ng's public Store API → src/data/*.json
```

It reads every published product, option, price, stock count, photo and category from the live
store, writes them to `data/catalog-live.csv` in WooCommerce's export format, and runs
`scripts/build-catalog.py` on that file, so the same category, age and price rules apply. Existing
products keep their web address; new ones get a fresh one. Then bump `SEED_VERSION` in
`src/lib/store/products.ts`: on its next request each store adds new products, refreshes those
never edited in the dashboard, leaves edited ones alone, and moves imported products that are gone
from the live store to Drafts. (`npm run catalog` still builds from a manual CSV export.)

## Product images

Imported photos are still served from the WordPress media library at
`jiddersgallery.com.ng/wp-content/uploads/...` (allow-listed in `next.config.ts`). The live sync
links the largest copy WordPress keeps up to 1600px wide rather than the multi-megabyte original,
so the image optimiser never times out fetching it. Photos uploaded in the dashboard are stored in
the site's own storage and served from `/media/…`. If the WordPress host is ever retired,
re-upload those photos through the product editor.

## Project layout

```
src/app/(store)/          storefront routes
src/app/admin/            dashboard routes (guarded by src/proxy.ts and requireAdmin())
src/app/api/orders        records website orders, re-pricing every line from the store
src/components/admin/     dashboard UI — tables, editor, charts, forms
src/lib/store/            storage: drivers (Redis / files), products, orders, inventory, analytics
src/lib/admin/            sessions, server actions, formatting, CSV/HTML safety
src/lib/site.ts           store details
scripts/build-catalog.py  WooCommerce CSV → src/data/*.json
scripts/sync-from-live.py live store → data/catalog-live.csv → build-catalog.py
```

## Deploying

1. Import the repo into Vercel.
2. Add `ADMIN_PASSWORD`, and connect Upstash Redis (see above).
3. Deploy, then sign in at `/admin`.
