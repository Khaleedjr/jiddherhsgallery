#!/usr/bin/env python3
"""
Refresh the catalogue from the live WooCommerce store, jiddersgallery.com.ng.

Reads the store's public Store API (no keys needed): every published product,
every option (variation) with its own price, stock and photo, and the category
tree. It writes them as rows shaped like WooCommerce's CSV product export to
data/catalog-live.csv, then runs build-catalog.py on that file, so the live
products go through exactly the same category, age, collection and price rules
as a manual export.

Usage:  python3 scripts/sync-from-live.py
Output: data/catalog-live.csv, then src/data/products.json, categories.json, meta.json

After it runs, bump SEED_VERSION in src/lib/store/products.ts so stores that
were already seeded take in the new and changed products (see ensureSeeded).
"""
import csv
import html
import json
import os
import re
import runpy
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://jiddersgallery.com.ng/wp-json/wc/store/v1"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_CSV = os.path.join(ROOT, "data", "catalog-live.csv")
USER_AGENT = "Mozilla/5.0 (catalogue sync)"

FIELDS = [
    "ID", "Type", "SKU", "Name", "Published", "Short description", "Description",
    "Sale price", "Regular price", "Categories", "Tags", "Images", "In stock?", "Stock",
    "Parent", "Position", "Attribute 1 name", "Attribute 1 value(s)",
    "Attribute 2 name", "Attribute 2 value(s)",
]


def fetch(path, attempts=4):
    """GET a Store API path; returns (json, headers). Retries politely on network errors."""
    url = path if path.startswith("http") else BASE + path
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode("utf-8")), response.headers
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == attempts - 1:
                raise
            print("  retrying %s (%s)" % (url, error), file=sys.stderr)
            time.sleep(2 * (attempt + 1))


def fetch_all(path):
    """Every page of a paginated Store API list."""
    items, page = [], 1
    while True:
        sep = "&" if "?" in path else "?"
        batch, headers = fetch("%s%sper_page=100&page=%d" % (path, sep, page))
        items.extend(batch)
        if page >= int(headers.get("X-WP-TotalPages") or 1):
            return items
        page += 1


def text(value):
    """Undo WordPress's typographic substitutions so names match the CSV export
    the catalogue was first built from (straight quotes, plain hyphens)."""
    value = html.unescape(value or "")
    for curly, plain in (
        ("’", "'"), ("‘", "'"), ("“", '"'), ("”", '"'),
        ("′", "'"), ("″", '"'), ("–", "-"), (" ", " "),
    ):
        value = value.replace(curly, plain)
    return re.sub(r"\s+", " ", value).strip()


def naira(minor, unit):
    """Store API prices are strings in the currency's minor unit (kobo)."""
    if minor in (None, ""):
        return ""
    value = int(minor) / (10 ** unit)
    return str(int(value)) if value == int(value) else "%.2f" % value


def stock_count(item):
    """The count WooCommerce shows ("3 in stock"), 0 when out, blank when stock isn't tracked."""
    availability = (item.get("stock_availability") or {}).get("text") or ""
    match = re.search(r"(\d+)\s+in stock", availability)
    if match:
        return match.group(1)
    if item.get("low_stock_remaining") is not None:
        return str(item["low_stock_remaining"])
    if not item.get("is_in_stock"):
        return "0"
    return ""


def photo(image, cap=1100):
    """The largest copy of a photo up to `cap` pixels wide.

    WordPress keeps resized copies of every upload. The originals here run to
    2560px and several MB, and the WordPress host sends about half a megabyte a
    second, while the site's image optimiser gives up on a download after 7
    seconds (fixed in Next.js), so big originals left empty frames. The largest
    place a photo is shown is the product page, about 750px wide on a phone and
    1100px on a sharp laptop screen, so the 1024px copy (a few hundred KB) is
    enough. PNGs (cut-out product shots) don't compress, so they take the
    768px copy. A copy far smaller than that (a cropped square thumbnail) is
    only used when nothing better exists."""
    if image["src"].lower().endswith(".png"):
        cap = min(cap, 800)
    copies = []
    for entry in (image.get("srcset") or "").split(","):
        parts = entry.strip().rsplit(" ", 1)
        if len(parts) == 2 and parts[1].endswith("w") and parts[1][:-1].isdigit():
            copies.append((int(parts[1][:-1]), parts[0]))
    fitting = [copy for copy in copies if copy[0] <= cap]
    larger = [copy for copy in copies if copy[0] > cap]
    if fitting and (max(fitting)[0] >= 600 or not larger):
        return max(fitting)[1]
    if larger:
        return min(larger)[1]
    return image["src"]


def price_fields(item):
    prices = item.get("prices") or {}
    unit = int(prices.get("currency_minor_unit") or 0)
    regular = naira(prices.get("regular_price"), unit)
    sale = naira(prices.get("sale_price"), unit)
    if not regular:
        regular = naira(prices.get("price"), unit)
    on_sale = bool(item.get("on_sale")) and sale and regular and float(sale) < float(regular)
    return {"Regular price": regular, "Sale price": sale if on_sale else ""}


def main():
    print("Reading the live store...")
    # The store's own "default sorting" order, kept as each product's position.
    products = fetch_all("/products?orderby=menu_order&order=asc")
    categories = fetch_all("/products/categories")
    print("  %d products, %d categories" % (len(products), len(categories)))

    by_id = {c["id"]: c for c in categories}

    def path(category_id):
        names, seen = [], set()
        node = by_id.get(category_id)
        while node and node["id"] not in seen:
            seen.add(node["id"])
            names.append(text(node["name"]).replace(",", " "))
            node = by_id.get(node.get("parent") or 0)
        return " > ".join(reversed(names))

    variation_ids = [v["id"] for p in products if p["type"] == "variable" for v in p.get("variations") or []]
    print("  fetching %d options..." % len(variation_ids))
    with ThreadPoolExecutor(max_workers=4) as pool:
        details = dict(zip(variation_ids, pool.map(lambda vid: fetch("/products/%d" % vid)[0], variation_ids)))

    rows = []
    for position, product in enumerate(products):
        rows.append({
            "ID": str(product["id"]),
            "Type": product["type"],
            "SKU": product.get("sku") or "",
            "Name": text(product["name"]),
            "Published": "1",
            "Short description": product.get("short_description") or "",
            "Description": product.get("description") or "",
            **price_fields(product),
            "Categories": ", ".join(path(c["id"]) for c in product.get("categories") or []),
            "Tags": ", ".join(text(t["name"]).replace(",", " ") for t in product.get("tags") or []),
            "Images": ", ".join(photo(image) for image in product.get("images") or []),
            "In stock?": "1" if product.get("is_in_stock") else "0",
            "Stock": stock_count(product),
            "Parent": "",
            "Position": str(position),
        })
        for variation in product.get("variations") or []:
            detail = details[variation["id"]]
            attributes = variation.get("attributes") or []
            parent_images = {image["src"] for image in product.get("images") or []}
            # A variation without its own photo reports the parent's; only keep a photo of its own.
            own = [photo(image) for image in detail.get("images") or [] if image["src"] not in parent_images]
            values = [text(a["value"]) for a in attributes]
            rows.append({
                "ID": str(variation["id"]),
                "Type": "variation",
                "SKU": detail.get("sku") or "",
                "Name": "%s - %s" % (text(product["name"]), ", ".join(values)),
                "Published": "1",
                **price_fields(detail),
                "In stock?": "1" if detail.get("is_in_stock") else "0",
                "Stock": stock_count(detail),
                "Images": own[0] if own else "",
                "Parent": "id:%d" % product["id"],
                "Position": "0",
                "Attribute 1 name": text(attributes[0]["name"]) if attributes else "",
                "Attribute 1 value(s)": values[0] if values else "",
                "Attribute 2 name": text(attributes[1]["name"]) if len(attributes) > 1 else "",
                "Attribute 2 value(s)": values[1] if len(values) > 1 else "",
            })

    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore", restval="")
        writer.writeheader()
        writer.writerows(rows)
    print("Wrote %s (%d rows)" % (os.path.relpath(OUT_CSV, ROOT), len(rows)))

    print("Building the catalogue...")
    sys.argv = ["build-catalog.py", OUT_CSV]
    runpy.run_path(os.path.join(ROOT, "scripts", "build-catalog.py"), run_name="__main__")


if __name__ == "__main__":
    main()
