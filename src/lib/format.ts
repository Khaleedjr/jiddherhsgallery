const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => naira.format(value);

export const formatPriceRange = (min: number, max: number | null) =>
  max && max > min ? `${formatPrice(min)} – ${formatPrice(max)}` : formatPrice(min);

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

/** Her stock runs thin, so surface it once it drops to single figures. */
export const LOW_STOCK_THRESHOLD = 5;

export const isLowStock = (stock: number | null, inStock: boolean) =>
  inStock && stock !== null && stock > 0 && stock <= LOW_STOCK_THRESHOLD;

export const lowStockLabel = (stock: number) => (stock === 1 ? "Last one" : `Only ${stock} left`);
