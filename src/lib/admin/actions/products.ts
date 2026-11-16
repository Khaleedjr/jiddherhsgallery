"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isAllowedImage, type ProductInput, type SaveResult } from "@/lib/admin/product-input";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { sanitizeHtml } from "@/lib/admin/sanitize";
import { taxonomy } from "@/lib/catalog";
import { getDriver } from "@/lib/store/driver";
import {
  deleteProducts,
  getStoredProduct,
  listProducts,
  nextProductId,
  saveProduct,
  saveProducts,
  uniqueSlug,
} from "@/lib/store/products";
import type { StockMovement, StoredProduct } from "@/lib/store/types";
import { MAX_PAIRED, PAIRING_MODES, type ProductPairing, type Variant } from "@/lib/types";

const validCategories = new Set(
  taxonomy.departments.flatMap((dept) => [dept.slug, ...dept.children.map((child) => child.slug)]),
);
const validAges = new Set(taxonomy.ageGroups.map((age) => age.value));
const validCollections = new Set(taxonomy.collections.map((c) => c.slug));

const money = (value: number | null) => (value === null || !Number.isFinite(value) ? null : Math.max(0, Math.round(value)));
const count = (value: number | null) => (value === null || !Number.isFinite(value) ? null : Math.max(0, Math.floor(value)));

/** A sub-category always implies its parents, so books/for-adults/english also files under books/for-adults and books. */
const withParents = (slugs: string[]) => {
  const out = new Set<string>();
  for (const slug of slugs) {
    if (!validCategories.has(slug)) continue;
    const parts = slug.split("/");
    for (let i = 1; i <= parts.length; i += 1) {
      const parent = parts.slice(0, i).join("/");
      if (validCategories.has(parent)) out.add(parent);
    }
  }
  return [...out].sort();
};

export async function saveProductAction(input: ProductInput): Promise<SaveResult> {
  await requireAdmin();

  const name = input.name.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Give the product a name." };
  if (name.length > 200) return { ok: false, error: "The name is too long (200 characters max)." };

  const images = input.images.map((url) => url.trim()).filter(Boolean);
  const badImage = images.find((url) => !isAllowedImage(url));
  if (badImage) return { ok: false, error: `This image can't be shown on the site: ${badImage}. Upload the photo instead.` };

  const existing = input.id ? await getStoredProduct(input.id) : null;
  if (input.id && !existing) return { ok: false, error: "This product no longer exists." };

  const hasVariants = input.variants.length > 0;
  let variants: Variant[] = [];
  if (hasVariants) {
    const optionName = input.optionName?.trim() || "Option";
    const option2Name = input.option2Name?.trim() || null;
    const labels = new Set<string>();
    for (const [index, v] of input.variants.entries()) {
      const value = v.optionValue.trim();
      const value2 = option2Name ? v.option2Value?.trim() || null : null;
      if (!value) return { ok: false, error: `Option ${index + 1} needs a ${optionName.toLowerCase()} value.` };
      const label = value2 ? `${value} / ${value2}` : value;
      if (labels.has(label)) return { ok: false, error: `Two options are both called “${label}”.` };
      labels.add(label);
      const price = money(v.price);
      if (price === null) return { ok: false, error: `Set a price for “${label}”.` };
      const was = money(v.wasPrice);
      const onSale = was !== null && was > price;
      if (v.image && !isAllowedImage(v.image)) return { ok: false, error: `The photo for “${label}” can't be shown on the site.` };
      variants.push({
        id: v.id ?? (await nextProductId()),
        label,
        optionName,
        optionValue: value,
        option2Name,
        option2Value: value2,
        price,
        regularPrice: onSale ? was : price,
        salePrice: onSale ? price : null,
        image: v.image || null,
        inStock: v.inStock,
        stock: count(v.stock),
      });
    }
  } else {
    variants = [];
    if (money(input.price) === null) return { ok: false, error: "Set a price." };
  }

  const id = existing?.id ?? (await nextProductId());
  const slug = await uniqueSlug(input.slug.trim() || name, id);

  /* "Featured together": only real, other products, each once. */
  let pairing: ProductPairing | undefined;
  const mode = PAIRING_MODES.find((m) => m === input.pairing?.mode) ?? "auto";
  if (mode !== "auto") {
    const known = new Set((await listProducts()).map((p) => p.id));
    const ids = [...new Set(Array.isArray(input.pairing?.ids) ? input.pairing.ids : [])].filter(
      (pid): pid is string => typeof pid === "string" && pid !== id && known.has(pid),
    );
    if (mode === "manual" && !ids.length) return { ok: false, error: "Choose at least one product for “Featured together”, or set it to Automatic." };
    if (ids.length > MAX_PAIRED) return { ok: false, error: `“Featured together” can show at most ${MAX_PAIRED} products.` };
    pairing = { mode, ids: mode === "manual" ? ids : [] };
  }
  const now = new Date().toISOString();
  const price = hasVariants ? 0 : money(input.price)!;
  const was = money(input.wasPrice);

  let position = existing?.position;
  if (position === undefined) {
    const all = await listProducts();
    position = all.length ? Math.min(...all.map((p) => p.position)) - 1 : 0;
  }

  const product: StoredProduct = {
    ...(existing ?? {}),
    id,
    slug,
    name,
    sku: input.sku.trim() || null,
    summary: input.summary.trim(),
    descriptionHtml: sanitizeHtml(input.descriptionHtml),
    descriptionText: "",
    price,
    priceMax: null,
    compareAtPrice: !hasVariants && was !== null && was > price ? was : null,
    onSale: false,
    inStock: hasVariants ? true : input.trackStock ? (count(input.stock) ?? 0) > 0 : input.inStock,
    stock: hasVariants ? null : input.trackStock ? (count(input.stock) ?? 0) : null,
    images,
    categories: withParents(input.categories),
    ages: input.ages.filter((age) => validAges.has(age)),
    collections: input.collections.filter((c) => validCollections.has(c)),
    language: input.language?.trim() || null,
    tags: [...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 30),
    variants,
    position,
    pairing,
    status: input.status === "draft" ? "draft" : "published",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const saved = await saveProduct(product);
  await logEditedStock(existing, saved);
  refreshStorefront();
  return { ok: true, id: saved.id, slug: saved.slug };
}

/** Stock typed straight into the editor still lands in the stock log, as a count. */
async function logEditedStock(before: StoredProduct | null, after: StoredProduct) {
  const db = getDriver();
  const rows: Array<{ variantId: string | null; label: string | null; before: number | null; after: number | null }> = [];
  if (after.variants.length) {
    for (const variant of after.variants) {
      const previous = before?.variants.find((v) => v.id === variant.id);
      rows.push({ variantId: variant.id, label: variant.label, before: previous?.stock ?? null, after: variant.stock });
    }
  } else {
    rows.push({ variantId: null, label: null, before: before && !before.variants.length ? before.stock : null, after: after.stock });
  }
  const entries: Record<string, StockMovement> = {};
  for (const row of rows) {
    if (row.after === null || row.after === row.before) continue;
    const id = String(await db.incr("movement"));
    entries[id] = {
      id,
      at: new Date().toISOString(),
      productId: after.id,
      variantId: row.variantId,
      productName: after.name,
      variantLabel: row.label,
      change: row.after - (row.before ?? 0),
      before: row.before,
      after: row.after,
      reason: before ? "correction" : "initial",
      note: before ? "Edited on the product page" : "New product",
      orderRef: null,
    };
  }
  if (Object.keys(entries).length) await db.put("stock", entries);
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  await deleteProducts([id]);
  refreshStorefront();
  redirect("/admin/products?deleted=1");
}

export async function bulkProductsAction(form: FormData) {
  await requireAdmin();
  const ids = form.getAll("ids").map(String).filter(Boolean);
  const action = String(form.get("bulk") ?? "");
  const back = String(form.get("back") ?? "/admin/products");
  if (!ids.length) redirect(back);

  if (action === "delete") {
    await deleteProducts(ids);
  } else if (action === "publish" || action === "draft") {
    const products = (await listProducts()).filter((p) => ids.includes(p.id));
    await saveProducts(products.map((p) => ({ ...p, status: action === "publish" ? "published" : "draft" })));
  }
  refreshStorefront();
  redirect(back.startsWith("/admin/products") ? back : "/admin/products");
}

export async function duplicateProductAction(id: string) {
  await requireAdmin();
  const source = await getStoredProduct(id);
  if (!source) redirect("/admin/products");
  const newId = await nextProductId();
  const variants: Variant[] = [];
  for (const v of source.variants) variants.push({ ...v, id: await nextProductId(), stock: v.stock === null ? null : 0, inStock: v.stock === null ? v.inStock : false });
  const now = new Date().toISOString();
  await saveProduct({
    ...source,
    id: newId,
    name: `${source.name} (copy)`,
    slug: await uniqueSlug(`${source.slug}-copy`),
    sku: null,
    stock: source.stock === null ? null : 0,
    variants,
    status: "draft",
    position: source.position,
    createdAt: now,
    updatedAt: now,
  });
  redirect(`/admin/products/${newId}?duplicated=1`);
}
