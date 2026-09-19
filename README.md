# Jidderh's Gallery

A complete rebuild of [jiddersgallery.com.ng](https://jiddersgallery.com.ng) as a modern Islamic
storefront — Next.js App Router, TypeScript and Tailwind CSS v4, statically generated from the
store's WooCommerce catalogue.

## What is in the box

| Area | Detail |
| --- | --- |
| Catalogue | 304 published products, 4 departments, 24 sub-categories, 5 age brackets |
| Pages | Home, shop, category, age, product, cart, checkout, search, about, contact, FAQ, 3 policy pages |
| Rendering | Every catalogue page is pre-rendered at build time (341 static routes) |
| Checkout | Bag → order form → pre-filled WhatsApp message (no card details touch this site) |
| SEO | Per-page metadata, Open Graph, `Product`/`Store`/`FAQPage` JSON-LD, sitemap, robots |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Before going live

Everything store-specific lives in **`src/lib/site.ts`**. The WooCommerce export contained no
contact details, so these are placeholders and must be replaced:

- `whatsapp` — international format, digits only (e.g. `2348012345678`). This drives the WhatsApp
  checkout, the floating chat button and every "order on WhatsApp" link.
- `phoneDisplay`, `email`, `address`
- `socials.instagram`, `socials.facebook`, `socials.tiktok`
- `freeDeliveryThreshold` — currently ₦50,000, shown in the bag and on product pages.

The testimonials on the home page (`src/app/page.tsx`) are placeholder copy and should be swapped
for real customer quotes before launch.

## Updating the catalogue

Product data is generated from a WooCommerce CSV export, not fetched at runtime.

```bash
# 1. Export products from WooCommerce (Products → Export → all columns)
# 2. Save it over data/catalog.csv
npm run catalog    # regenerates src/data/*.json
npm run build
```

`scripts/build-catalog.py` does the work:

- keeps published simple/variable products, folds variations into their parent
- derives price ranges and a truthful compare-at price from the cheapest variant
- maps Woo's category strings onto the site's departments, age brackets and collections
- strips the export's literal `\n` markers and reduces product HTML to a safe tag subset

Category display names and the department order live in the constants at the top of that script.

## Product images

Photography is still served from the existing WordPress media library at
`jiddersgallery.com.ng/wp-content/uploads/...`, allow-listed in `next.config.ts` and optimised by
Next's image pipeline. If that host is ever retired, move the files into `public/` (or a CDN) and
update the `Images` column in the export.

## Project layout

```
data/catalog.csv          WooCommerce export (source of truth)
scripts/build-catalog.py  ETL → src/data/*.json
src/app/                  routes (App Router)
src/components/           UI — header, cart, product card, shop browser, …
src/lib/site.ts           store details: phone, email, address, socials
src/lib/catalog.ts        catalogue queries: categories, search, related products
src/data/*.json           generated — do not edit by hand
```

## Deploying

Built for Vercel: push the branch, import the repo, no environment variables required.
Any Node host works too (`npm run build && npm run start`).
