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
