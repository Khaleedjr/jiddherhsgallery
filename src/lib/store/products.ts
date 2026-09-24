import productsJson from "@/data/products.json";
import type { Product, Variant } from "@/lib/types";
import { slugify } from "@/lib/admin/slugify";
import { getDriver } from "@/lib/store/driver";
import type { StoredProduct } from "@/lib/store/types";

const COLLECTION = "products";
const SEED_VERSION = 1;

let seeding: Promise<void> | null = null;

/**
 * First boot copies the imported WooCommerce catalogue into the store. After
 * that the store is the source of truth and products.json is never re-read.
 */
export function ensureSeeded() {
  seeding ??= (async () => {
    const db = getDriver();
    if (await db.getValue<number>("seeded")) return;
    const source = productsJson as Product[];
    const entries: Record<string, StoredProduct> = {};
    for (const product of source) {
      entries[product.id] = { ...product, status: "published", createdAt: null, updatedAt: null };
    }
    await db.put(COLLECTION, entries);
    const maxId = Math.max(0, ...source.map((p) => Number(p.id)).filter(Number.isFinite));
    if ((await db.getValue<number>("seq:product")) === null) await db.setValue("seq:product", maxId);
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
