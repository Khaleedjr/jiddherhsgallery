import productsJson from "@/data/products.json";
import type { Product, Variant } from "@/lib/types";
import { slugify } from "@/lib/admin/slugify";
import { getDriver } from "@/lib/store/driver";
import type { StoredProduct } from "@/lib/store/types";

const COLLECTION = "products";
/**
 * Version of src/data/products.json the store has taken in. Bump it after
 * re-importing the catalogue (scripts/sync-from-live.py) so stores that were
 * seeded earlier take in the new version on their next request.
 *   1: the first WooCommerce export (304 products).
 *   2: synced from the live store, 15 Nov 2026 (351 products; photos linked at
 *      WordPress's 1024px copies, 768px for PNGs).
 */
const SEED_VERSION = 2;

let seeding: Promise<void> | null = null;

/**
 * Brings the store up to the current catalogue file. A new store takes it
 * whole. A store seeded from an older file is refreshed product by product,
 * and anything touched in the dashboard always wins:
 *   - products not in the store yet are added, published;
 *   - products never edited in the dashboard (no updatedAt; every dashboard
 *     save, stock adjustments included, sets one) take the new data, keeping
 *     their status;
 *   - products edited in the dashboard are left exactly as they are;
 *   - imported products that are no longer in the file (taken down on the old
 *     store) and were never edited here move to Drafts: hidden, not deleted.
 * A product deleted in the dashboard leaves no trace, so a later catalogue
 * version that still lists it would bring it back.
 */
export function ensureSeeded() {
  seeding ??= (async () => {
    const db = getDriver();
    const version = (await db.getValue<number>("seeded")) ?? 0;
    if (version >= SEED_VERSION) return;

    const source = productsJson as Product[];
    const stored = version > 0 ? await db.all<StoredProduct>(COLLECTION) : {};
    const entries: Record<string, StoredProduct> = {};
    const inSource = new Set<string>();

    for (const product of source) {
      inSource.add(product.id);
      const current = stored[product.id];
      if (!current) {
        entries[product.id] = { ...product, status: "published", createdAt: null, updatedAt: null };
      } else if (!current.updatedAt) {
        entries[product.id] = { ...product, status: current.status ?? "published", createdAt: current.createdAt ?? null, updatedAt: null };
      }
    }
    for (const [id, current] of Object.entries(stored)) {
      if (!inSource.has(id) && !current.updatedAt && !current.createdAt && current.status !== "draft") {
        entries[id] = { ...current, status: "draft" };
      }
    }
    if (Object.keys(entries).length) await db.put(COLLECTION, entries);

    /* New products from the dashboard must never reuse an imported product's id. */
    const maxId = Math.max(0, ...source.map((p) => Number(p.id)).filter(Number.isFinite));
    const seq = await db.getValue<number>("seq:product");
    if (seq === null || Number(seq) < maxId) await db.setValue("seq:product", maxId);
    await db.setValue("seeded", SEED_VERSION);
  })().catch((error) => {
    seeding = null;
    throw error;
  });
  return seeding;
}

const normalise = (product: StoredProduct): StoredProduct => ({
  ...product,
  status: product.status ?? "published",
  createdAt: product.createdAt ?? null,
  updatedAt: product.updatedAt ?? null,
});

export async function listProducts(): Promise<StoredProduct[]> {
  await ensureSeeded();
  const all = await getDriver().all<StoredProduct>(COLLECTION);
  return Object.values(all)
    .map(normalise)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

export async function getStoredProduct(id: string) {
  await ensureSeeded();
  const product = await getDriver().get<StoredProduct>(COLLECTION, id);
  return product ? normalise(product) : null;
}

export const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/**
 * Keep the storefront's derived fields honest after an edit: the "from" price,
 * price range and compare-at follow the cheapest variant (as the importer does),
 * and parent stock is the sum of whatever variant stock is being tracked.
 */
export function deriveProduct(product: StoredProduct): StoredProduct {
  const variants: Variant[] = product.variants.map((variant) => ({
    ...variant,
    inStock: variant.stock !== null ? variant.stock > 0 : variant.inStock,
  }));
  const next: StoredProduct = { ...product, variants, descriptionText: stripHtml(product.descriptionHtml) };

  if (variants.length) {
    const priced = variants.filter((v): v is Variant & { price: number } => v.price !== null);
    if (priced.length) {
      const cheapest = priced.reduce((low, v) => (v.price < low.price ? v : low));
      const max = Math.max(...priced.map((v) => v.price));
      next.price = cheapest.price;
      next.priceMax = max > cheapest.price ? max : null;
      next.compareAtPrice =
        cheapest.regularPrice !== null && cheapest.regularPrice > cheapest.price ? cheapest.regularPrice : null;
    }
    const tracked = variants.filter((v) => v.stock !== null);
    next.stock = tracked.length ? tracked.reduce((sum, v) => sum + (v.stock ?? 0), 0) : null;
    next.inStock = variants.some((v) => v.inStock);
  } else {
    next.priceMax = null;
    if (next.compareAtPrice !== null && next.compareAtPrice <= next.price) next.compareAtPrice = null;
    if (next.stock !== null) next.inStock = next.stock > 0;
  }
  next.onSale = next.compareAtPrice !== null;
  return next;
}

export async function saveProduct(product: StoredProduct) {
  const next = deriveProduct({ ...product, updatedAt: new Date().toISOString() });
  await getDriver().put(COLLECTION, { [next.id]: next });
  return next;
}

export async function saveProducts(products: StoredProduct[]) {
  const now = new Date().toISOString();
  const entries: Record<string, StoredProduct> = {};
  for (const product of products) entries[product.id] = deriveProduct({ ...product, updatedAt: now });
  await getDriver().put(COLLECTION, entries);
}

export async function nextProductId() {
  await ensureSeeded();
  return String(await getDriver().incr("product"));
}

export async function deleteProducts(ids: string[]) {
  await getDriver().remove(COLLECTION, ids);
}


/** A slug no other product is using, suffixing -2, -3… when needed. */
export async function uniqueSlug(base: string, ignoreId?: string) {
  const taken = new Set((await listProducts()).filter((p) => p.id !== ignoreId).map((p) => p.slug));
  const root = slugify(base) || "product";
  let slug = root;
  for (let n = 2; taken.has(slug); n += 1) slug = `${root}-${n}`;
  return slug;
}
