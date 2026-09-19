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
  images: string[];
  categories: string[];
  ages: string[];
  collections: string[];
  language: string | null;
  tags: string[];
  variants: Variant[];
  position: number;
};

export type CategoryNode = {
  slug: string;
  name: string;
  count: number;
  image: string | null;
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
