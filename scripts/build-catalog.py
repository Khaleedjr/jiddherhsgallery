#!/usr/bin/env python3
"""
Convert the WooCommerce product export for Jidderh's Gallery into the clean
JSON catalogue the Next.js site reads at build time.

Usage:  python3 scripts/build-catalog.py <woocommerce-export.csv>
Output: src/data/products.json, src/data/categories.json, src/data/meta.json
"""
import csv
import html
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict

csv.field_size_limit(10 ** 9)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "data")

# Woo taxonomy roots that are bookkeeping rather than something a shopper browses.
SKIP_ROOTS = {"ALL PRODUCTS", "SHOP BY ITEM GROUPING", "JIDDERH'S GALLERY PRODUCTS"}
# Woo taxonomy roots surfaced as merchandising collections instead of categories.
COLLECTION_ROOTS = {"BEST SELLER", "NEW ARRIVALS", "RAMADAN COLLECTION"}
AGE_ROOT = "SHOP BY AGE"

# Presentation names for the department roots, in navigation order.
DEPARTMENTS = OrderedDict([
    ("BOOKS", "Books"),
    ("TOYS", "Toys & Learning"),
    ("IBADAT ACCESSORIES", "Ibadah Essentials"),
    ("MODEST WEARS", "Modest Wear"),
    ("ISLAMIC PARCEL", "Gift Parcels"),
])

# Tidy display names for sub-categories whose Woo labels are terse or inconsistent.
SUB_RENAME = {
    "Holy Qur'an": "The Holy Qur'an",
    "0 - 3yrs": "Ages 0-3",
    "3 - 6yrs": "Ages 3-6",
    "6 - 12yrs": "Ages 6-12",
    "12-18 yrs": "Ages 12-18",
    "Adults": "For Adults",
    "Activity books": "Activity Books",
    "Creative Toys": "Creative Toys",
    "Games & Puzzles": "Games & Puzzles",
    "Educational Posters": "Educational Posters",
    "Flash Cards": "Flash Cards",
    "Stationaries": "Stationery",
    "Prayer mats": "Prayer Mats",
    "Tasbeeh/Counter": "Tasbeeh & Counters",
    "Qur'an Speaker": "Qur'an Speakers",
    "Ibadat Tracker": "Ibadah Trackers",
    "Adhkar flexes and Stickers": "Adhkar Flexes & Stickers",
    "Qur'an Stand": "Qur'an Stands",
    "Adhan tools": "Adhan Tools",
    "Prayer Hijab": "Prayer Hijabs",
    "Our Production": "Our Own Production",
}

AGE_ORDER = ["0-3 years", "3-6 years", "6-12 years", "12-18 years", "18+ years"]
AGE_LABEL = {
    "0-3 years": "0 - 3 years",
    "3-6 years": "3 - 6 years",
    "6-12 years": "6 - 12 years",
    "12-18 years": "12 - 18 years",
    "18+ years": "18+ years",
}
AGE_BLURB = {
    "0-3 years": "Cloth books, soft toys and first words",
    "3-6 years": "Stories, activity books and play sets",
    "6-12 years": "Seerah, sahaba tales and puzzles",
    "12-18 years": "Fiqh, tafsir and study companions",
    "18+ years": "Qur'an, scholarship and ibadah essentials",
}

ALLOWED_TAGS = {"p", "ul", "ol", "li", "strong", "em", "br", "h3", "h4", "blockquote"}
TAG_RE = re.compile(r"<\s*(/?)\s*([a-zA-Z0-9]+)[^>]*?(/?)\s*>")


def slugify(value):
    value = value.replace("'", "").replace("’", "")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower())
    return re.sub(r"-{2,}", "-", value).strip("-")


def money(value):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return round(float(value))
    except ValueError:
        return None


def stock_level(value):
    """Units on hand, or None when the store isn't tracking stock for this item."""
    value = (value or "").strip()
    if not value:
        return None
    try:
        return max(0, int(float(value)))
    except ValueError:
        return None


EMBED_RE = re.compile(
    r"<!--.*?-->|<script\b.*?</script>|<style\b.*?</style>|<video\b.*?</video>|\[video\b[^\]]*\](?:\s*\[/video\])?",
    re.S | re.I,
)


def strip_embeds(raw):
    """Product videos (a [video] shortcode in exports, a rendered <video> from the
    live store), comments and scripts: none of them belong in a description, and
    stripping only their tags would leave a bare .mp4 link in the text."""
    return EMBED_RE.sub(" ", raw or "").replace("&nbsp;", " ").replace(" ", " ")


def clean_html(raw):
    """Strip the Woo export's literal \\n markers and reduce HTML to a safe subset."""
    if not raw:
        return ""
    text = strip_embeds(raw).replace("\\n", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    def keep(match):
        closing, tag, selfclose = match.group(1), match.group(2).lower(), match.group(3)
        if tag not in ALLOWED_TAGS:
            return ""
        if tag == "br":
            return "<br />"
        return "<%s%s>" % (closing, tag)

    text = TAG_RE.sub(keep, text)

    # Anything left outside a block tag becomes its own paragraph.
    if "<p" not in text and "<ul" not in text and "<ol" not in text:
        blocks = [b.strip() for b in re.split(r"\n{1,}", text) if b.strip()]
        text = "".join("<p>%s</p>" % b.replace("\n", "<br />") for b in blocks)
    else:
        text = re.sub(r"\n+", "", text)

    text = re.sub(r"<p>\s*</p>", "", text)
    text = re.sub(r"<li>\s*</li>", "", text)
    return text.strip()


def plain_text(raw, limit=300):
    text = re.sub(r"<[^>]+>", " ", strip_embeds(raw).replace("\\n", " "))
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit].strip()


def split_list(value):
    return [part.strip() for part in (value or "").split(",") if part.strip()]


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data", "catalog.csv")
    with open(src, encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    variations_by_parent = defaultdict(list)
    for row in rows:
        if not row["Type"].startswith("variation"):
            continue
        parent = (row["Parent"] or "").replace("id:", "").strip()
        if parent:
            variations_by_parent[parent].append(row)

    products = []
    seen_slugs = {}

    # A product keeps the web address it already has: renames, new arrivals and
    # duplicate names must never move an existing product's URL. New products
    # get a fresh slug that avoids every address already taken.
    previous_slugs = {}
    previous_hero_owner = {}
    previous_path = os.path.join(OUT_DIR, "products.json")
    if os.path.exists(previous_path):
        with open(previous_path, encoding="utf-8") as handle:
            previous = json.load(handle)
        previous_slugs = {p["id"]: p["slug"] for p in previous}
        previous_hero_owner = {p["images"][0]: p["id"] for p in previous if p["images"]}
    taken = set(previous_slugs.values())

    # Department and category photos stay with the product they were taken from,
    # so a re-import (which can reorder products) doesn't swap the pictures on
    # the homepage and shop. Only a node whose product is gone gets a new one.
    previous_node_owner = {}
    categories_path = os.path.join(OUT_DIR, "categories.json")
    if os.path.exists(categories_path):
        with open(categories_path, encoding="utf-8") as handle:
            previous_categories = json.load(handle)
        for dept in previous_categories.get("departments", []):
            for node in [dept] + dept.get("children", []):
                owner = previous_hero_owner.get(node.get("image"))
                if owner:
                    previous_node_owner[node["slug"]] = owner
    # name -> node, built as products are read so counts stay in sync with what ships.
    dept_tree = OrderedDict()
    age_counts = defaultdict(int)
    collection_counts = defaultdict(int)

    for row in rows:
        if row["Published"] != "1":
            continue
        if row["Type"].startswith("variation"):
            continue

        name = (row["Name"] or "").strip()
        if not name:
            continue

        if row["ID"] in previous_slugs:
            slug = previous_slugs[row["ID"]]
        else:
            base = slugify(name)
            slug, n = base, 1
            while slug in taken or slug in seen_slugs:
                n += 1
                slug = "%s-%d" % (base, n)
        seen_slugs[slug] = 1
        taken.add(slug)

        # WooCommerce often lists the main photo again in the gallery; show it once.
        images = list(OrderedDict.fromkeys(u.strip() for u in split_list(row["Images"])))
        variations = variations_by_parent.get(row["ID"], [])

        variants = []
        for var in variations:
            attr_name = (var["Attribute 1 name"] or "").strip()
            attr_value = (var["Attribute 1 value(s)"] or "").strip()
            attr2_name = (var["Attribute 2 name"] or "").strip()
            attr2_value = (var["Attribute 2 value(s)"] or "").strip()
            label = " / ".join(v for v in [attr_value, attr2_value] if v)
            if not label:
                label = (var["Name"] or "").split(" - ")[-1].strip()
            regular = money(var["Regular price"])
            sale = money(var["Sale price"])
            var_images = [u.strip() for u in split_list(var["Images"])]
            variants.append({
                "id": var["ID"],
                "label": label or "Option",
                "optionName": attr_name or "Option",
                "optionValue": attr_value or label,
                "option2Name": attr2_name or None,
                "option2Value": attr2_value or None,
                "price": sale or regular,
                "regularPrice": regular,
                "salePrice": sale if sale and regular and sale < regular else None,
                "image": var_images[0] if var_images else None,
                "inStock": var["In stock?"] != "0",
                "stock": stock_level(var["Stock"]),
            })

        regular = money(row["Regular price"])
        sale = money(row["Sale price"])
        if variants:
            priced = [v for v in variants if v["price"]]
            prices = [v["price"] for v in priced]
            price_min = min(prices) if prices else regular
            price_max = max(prices) if prices else regular
            # Compare-at tracks the cheapest variant, so any "was" price and the
            # discount it implies line up with the "from" price we advertise.
            cheapest = min(priced, key=lambda v: v["price"]) if priced else None
            compare_at = cheapest["regularPrice"] if cheapest else None
        else:
            price_min = price_max = sale or regular
            compare_at = regular

        on_sale = bool(compare_at and price_min and compare_at > price_min)

        # Variant images that the parent gallery does not already carry.
        for variant in variants:
            if variant["image"] and variant["image"] not in images:
                images.append(variant["image"])

        categories, ages, collections = [], [], []
        for raw_cat in split_list(row["Categories"]):
            parts = [p.strip() for p in raw_cat.split(">")]
            root = parts[0].upper()
            if root in SKIP_ROOTS:
                continue
            if root in COLLECTION_ROOTS:
                collections.append(slugify(parts[0]))
                collection_counts[slugify(parts[0])] += 1
                continue
            if root == AGE_ROOT:
                if len(parts) > 1:
                    ages.append(parts[1])
                    age_counts[parts[1]] += 1
                continue
            if root not in DEPARTMENTS:
                continue

            dept = dept_tree.setdefault(root, {
                "slug": slugify(DEPARTMENTS[root]),
                "name": DEPARTMENTS[root],
                "rawName": root,
                "count": 0,
                "image": None,
                "children": OrderedDict(),
            })
            categories.append(dept["slug"])
            if len(parts) > 1:
                # Woo nests up to three levels; flatten level 3 into its parent.
                sub_raw = parts[1]
                sub_name = SUB_RENAME.get(sub_raw, sub_raw)
                sub_slug = "%s/%s" % (dept["slug"], slugify(sub_name))
                child = dept["children"].setdefault(sub_slug, {
                    "slug": sub_slug,
                    "name": sub_name,
                    "count": 0,
                    "image": None,
                })
                categories.append(sub_slug)
                if len(parts) > 2:
                    leaf_raw = parts[2]
                    leaf_name = SUB_RENAME.get(leaf_raw, leaf_raw)
                    categories.append("%s/%s" % (sub_slug, slugify(leaf_name)))

        categories = list(OrderedDict.fromkeys(categories))
        ages = sorted(set(ages), key=lambda age: AGE_ORDER.index(age) if age in AGE_ORDER else 99)
        collections = list(OrderedDict.fromkeys(collections))

        language = None
        if "books/for-adults/arabic" in categories:
            language = "Arabic"
        elif "books/for-adults/english" in categories:
            language = "English"

        products.append({
            "id": row["ID"],
            "slug": slug,
            "name": name,
            "sku": (row["SKU"] or "").strip() or None,
            "summary": plain_text(row["Short description"], 180),
            "descriptionHtml": clean_html(row["Description"]),
            "descriptionText": plain_text(row["Description"], 400),
            "price": price_min,
            "priceMax": price_max if price_max != price_min else None,
            "compareAtPrice": compare_at if on_sale else None,
            "onSale": on_sale,
            "inStock": row["In stock?"] != "0",
            "stock": (
                sum(v["stock"] for v in variants if v["stock"] is not None)
                if variants and any(v["stock"] is not None for v in variants)
                else stock_level(row["Stock"])
            ),
            "images": images,
            "categories": categories,
            "ages": ages,
            "collections": collections,
            "language": language,
            "tags": split_list(row["Tags"]),
            "variants": variants,
            "position": int(row["Position"] or 0),
        })

    # Category counts + a representative image, computed from the shipped products.
    by_slug = {}
    for root, dept in dept_tree.items():
        by_slug[dept["slug"]] = dept
        for child in dept["children"].values():
            by_slug[child["slug"]] = child

    for product in products:
        hero = product["images"][0] if product["images"] else None
        for slug in product["categories"]:
            node = by_slug.get(slug)
            if node is None:
                continue
            node["count"] += 1
            if hero and previous_node_owner.get(slug) == product["id"]:
                node["image"] = hero
                node["keep"] = True
            elif node["image"] is None and hero and not node.get("keep"):
                node["image"] = hero

    departments = []
    for root in DEPARTMENTS:
        dept = dept_tree.get(root)
        if not dept or not dept["count"]:
            continue
        children = [{k: v for k, v in c.items() if k != "keep"} for c in dept["children"].values() if c["count"]]
        children.sort(key=lambda c: -c["count"])
        departments.append({
            "slug": dept["slug"],
            "name": dept["name"],
            "count": dept["count"],
            "image": dept["image"],
            "children": children,
        })

    age_groups = [{
        "slug": slugify(age),
        "name": AGE_LABEL.get(age, age),
        "blurb": AGE_BLURB.get(age, ""),
        "value": age,
        "count": age_counts[age],
    } for age in AGE_ORDER if age_counts.get(age)]

    collections = [{
        "slug": slugify(name),
        "name": name.title(),
        "count": collection_counts[slugify(name)],
    } for name in ["BEST SELLER", "NEW ARRIVALS", "RAMADAN COLLECTION"] if collection_counts.get(slugify(name))]

    products.sort(key=lambda p: (not p["inStock"], p["position"], p["name"]))

    os.makedirs(OUT_DIR, exist_ok=True)
    write(os.path.join(OUT_DIR, "products.json"), products)
    write(os.path.join(OUT_DIR, "categories.json"), {
        "departments": departments,
        "ageGroups": age_groups,
        "collections": collections,
    })
    write(os.path.join(OUT_DIR, "meta.json"), {
        "productCount": len(products),
        "inStockCount": sum(1 for p in products if p["inStock"]),
        "categoryCount": len(by_slug),
        "source": os.path.basename(src),
    })

    print("products: %d (%d in stock)" % (len(products), sum(1 for p in products if p["inStock"])))
    print("departments: %s" % ", ".join("%s (%d)" % (d["name"], d["count"]) for d in departments))
    print("age groups: %s" % ", ".join("%s (%d)" % (a["name"], a["count"]) for a in age_groups))
    print("collections: %s" % ", ".join("%s (%d)" % (c["name"], c["count"]) for c in collections))


def write(path, payload):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
        handle.write("\n")


if __name__ == "__main__":
    main()
