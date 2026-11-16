export type Variant = {
  id: string;
  label: string;
  optionName: string;
  optionValue: string;
  option2Name: string | null;
  option2Value: string | null;
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  image: string | null;
  inStock: boolean;
  stock: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  summary: string;
  descriptionHtml: string;
  descriptionText: string;
  price: number;
  priceMax: number | null;
  compareAtPrice: number | null;
  onSale: boolean;
  inStock: boolean;
  stock: number | null;
  images: string[];
  categories: string[];
  ages: string[];
  collections: string[];
  language: string | null;
  tags: string[];
  variants: Variant[];
  position: number;
  /** The "Featured together" box: picked automatically (the default), chosen in the dashboard, or not shown. */
  pairing?: ProductPairing;
};

export const PAIRING_MODES = ["auto", "manual", "off"] as const;
export type ProductPairing = { mode: (typeof PAIRING_MODES)[number]; ids: string[] };
/** How many products can be hand-picked for one product's "Featured together" box. */
export const MAX_PAIRED = 4;

export type CategoryNode = {
  slug: string;
  name: string;
  count: number;
  image: string | null;
  /** A third level, e.g. Special Categories > Collection 1. */
  children?: CategoryNode[];
};

export type Department = CategoryNode & {
  children: CategoryNode[];
};

export type AgeGroup = {
  slug: string;
  name: string;
  blurb: string;
  value: string;
  count: number;
};

export type Collection = {
  slug: string;
  name: string;
  count: number;
  image?: string | null;
};

/** The trimmed product shape sent to client components that only render cards. */
export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price: number;
  priceMax: number | null;
  compareAtPrice: number | null;
  inStock: boolean;
  stock: number | null;
  image: string | null;
  collections: string[];
  hasOptions: boolean;
};

/** A card plus the facets the shop browser filters and sorts on. */
export type ShopProduct = CardProduct & {
  categories: string[];
  ages: string[];
  tags: string[];
  language: string | null;
  position: number;
};
