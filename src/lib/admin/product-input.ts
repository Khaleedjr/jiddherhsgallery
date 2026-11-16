import type { ProductStatus } from "@/lib/store/types";
import type { ProductPairing } from "@/lib/types";

/** What the product editor sends to the server. Prices are whole naira. */
export type VariantInput = {
  id: string | null;
  optionValue: string;
  option2Value: string | null;
  price: number | null;
  /** The "was" price; only kept when it is higher than the selling price. */
  wasPrice: number | null;
  /** null = this option's stock isn't counted. */
  stock: number | null;
  inStock: boolean;
  image: string | null;
};

export type ProductInput = {
  id: string | null;
  name: string;
  slug: string;
  sku: string;
  summary: string;
  descriptionHtml: string;
  status: ProductStatus;
  price: number | null;
  wasPrice: number | null;
  trackStock: boolean;
  stock: number | null;
  inStock: boolean;
  images: string[];
  categories: string[];
  ages: string[];
  collections: string[];
  tags: string[];
  language: string | null;
  optionName: string | null;
  option2Name: string | null;
  variants: VariantInput[];
  pairing: ProductPairing;
};

export type SaveResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

const IMAGE_HOSTS = ["jiddersgallery.com.ng", "www.jiddersgallery.com.ng"];

/** Photos must be uploads or from the store's own WordPress library — the only hosts the site can display. */
export const isAllowedImage = (url: string) => {
  if (/^\/media\/[A-Za-z0-9_-]+$/.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && IMAGE_HOSTS.includes(parsed.hostname) && parsed.pathname.startsWith("/wp-content/uploads/");
  } catch {
    return false;
  }
};
