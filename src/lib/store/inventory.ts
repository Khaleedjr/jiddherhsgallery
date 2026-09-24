import { getDriver } from "@/lib/store/driver";
import { getStoredProduct, saveProduct } from "@/lib/store/products";
import type { StockMovement, StockReason } from "@/lib/store/types";

const COLLECTION = "stock";

export type StockAdjustment = {
  productId: string;
  variantId: string | null;
  /** "change" adds `amount` (negative to remove); "set" makes the count exactly `amount`. */
  mode: "change" | "set";
  amount: number;
  reason: StockReason;
  note?: string | null;
  orderRef?: string | null;
  /** Orders leave untracked items alone; a manual count starts tracking them. */
  skipUntracked?: boolean;
  demo?: boolean;
};

export async function adjustStock(adjustment: StockAdjustment): Promise<StockMovement | null> {
  const product = await getStoredProduct(adjustment.productId);
  if (!product) return null;

  const variant = adjustment.variantId
    ? product.variants.find((v) => v.id === adjustment.variantId) ?? null
    : null;
  if (adjustment.variantId && !variant) return null;

  const before = variant ? variant.stock : product.variants.length ? null : product.stock;
  if (!variant && product.variants.length) {
    throw new Error("Choose which option's stock to change — this product has variants.");
  }
  if (before === null && adjustment.skipUntracked) return null;

  const after = Math.max(0, adjustment.mode === "set" ? adjustment.amount : (before ?? 0) + adjustment.amount);
  const change = after - (before ?? 0);
  if (change === 0 && before !== null) return null;

  if (variant) {
    await saveProduct({
      ...product,
      variants: product.variants.map((v) => (v.id === variant.id ? { ...v, stock: after, inStock: after > 0 } : v)),
    });
  } else {
    await saveProduct({ ...product, stock: after, inStock: after > 0 });
  }

  const db = getDriver();
  const movement: StockMovement = {
    id: String(await db.incr("movement")),
    at: new Date().toISOString(),
    productId: product.id,
    variantId: variant?.id ?? null,
    productName: product.name,
    variantLabel: variant?.label ?? null,
    change,
    before,
    after,
    reason: adjustment.reason,
    note: adjustment.note?.trim() || null,
    orderRef: adjustment.orderRef ?? null,
    ...(adjustment.demo ? { demo: true } : {}),
  };
  await db.put(COLLECTION, { [movement.id]: movement });
  return movement;
}

export async function listMovements(): Promise<StockMovement[]> {
  const all = await getDriver().all<StockMovement>(COLLECTION);
  return Object.values(all).sort((a, b) => b.at.localeCompare(a.at) || Number(b.id) - Number(a.id));
}

export async function deleteMovements(ids: string[]) {
  await getDriver().remove(COLLECTION, ids);
}
