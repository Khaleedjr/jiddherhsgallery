import { LOW_STOCK_THRESHOLD } from "@/lib/format";
import type { StockMovement, StoredProduct } from "@/lib/store/types";

/** One row per thing you can count on a shelf: a simple product, or each option of a product with options. */
export type StockItem = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  image: string | null;
  price: number;
  stock: number | null;
  inStock: boolean;
  status: "published" | "draft";
  categories: string[];
  lastMovedAt: string | null;
};

export type StockState = "out" | "low" | "ok" | "untracked";

export const stockState = (item: Pick<StockItem, "stock" | "inStock">): StockState => {
  if (!item.inStock) return "out";
  if (item.stock === null) return "untracked";
  if (item.stock <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
};

export function toStockItems(products: StoredProduct[], movements: StockMovement[]): StockItem[] {
  const lastMoved = new Map<string, string>();
  for (const m of movements) {
    const key = `${m.productId}:${m.variantId ?? ""}`;
    if (!lastMoved.has(key)) lastMoved.set(key, m.at);
  }
  return products.flatMap((p): StockItem[] =>
    p.variants.length
      ? p.variants.map((v) => ({
          key: `${p.id}:${v.id}`,
          productId: p.id,
          variantId: v.id,
          name: p.name,
          variantLabel: v.label,
          sku: p.sku,
          image: v.image ?? p.images[0] ?? null,
          price: v.price ?? p.price,
          stock: v.stock,
          inStock: v.inStock,
          status: p.status,
          categories: p.categories,
          lastMovedAt: lastMoved.get(`${p.id}:${v.id}`) ?? null,
        }))
      : [
          {
            key: `${p.id}:`,
            productId: p.id,
            variantId: null,
            name: p.name,
            variantLabel: null,
            sku: p.sku,
            image: p.images[0] ?? null,
            price: p.price,
            stock: p.stock,
            inStock: p.inStock,
            status: p.status,
            categories: p.categories,
            lastMovedAt: lastMoved.get(`${p.id}:`) ?? null,
          },
        ],
  );
}
