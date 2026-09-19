import productsJson from "@/data/products.json";
import categoriesJson from "@/data/categories.json";
import metaJson from "@/data/meta.json";
import type {
  AgeGroup,
  CardProduct,
  Collection,
  Department,
  Product,
  ShopProduct,
} from "@/lib/types";

export const products = productsJson as Product[];
export const departments = categoriesJson.departments as Department[];
export const ageGroups = categoriesJson.ageGroups as AgeGroup[];
export const collections = categoriesJson.collections as Collection[];
export const catalogMeta = metaJson as {
  productCount: number;
  inStockCount: number;
  categoryCount: number;
};

const bySlug = new Map(products.map((product) => [product.slug, product]));

export const getProduct = (slug: string) => bySlug.get(slug);

export const allCategorySlugs = departments.flatMap((dept) => [
  dept.slug,
  ...dept.children.map((child) => child.slug),
]);

export const findCategory = (slug: string) => {
  for (const dept of departments) {
    if (dept.slug === slug) return { node: dept, department: dept, isDepartment: true as const };
    const child = dept.children.find((c) => c.slug === slug);
    if (child) return { node: child, department: dept, isDepartment: false as const };
  }
  return null;
};

export const findAgeGroup = (slug: string) => ageGroups.find((age) => age.slug === slug);
export const findCollection = (slug: string) => collections.find((c) => c.slug === slug);

export const inCategory = (product: Product, slug: string) =>
  product.categories.some((c) => c === slug || c.startsWith(`${slug}/`));

export const productsInCategory = (slug: string) => products.filter((p) => inCategory(p, slug));
export const productsInAge = (value: string) => products.filter((p) => p.ages.includes(value));
export const productsInCollection = (slug: string) =>
  products.filter((p) => p.collections.includes(slug));

/** Price bounds across the whole catalogue, used to seed the shop's price filter. */
export const priceBounds = products.reduce(
  (acc, product) => ({
    min: Math.min(acc.min, product.price),
    max: Math.max(acc.max, product.priceMax ?? product.price),
  }),
  { min: Infinity, max: 0 },
);

/**
 * Related products: same sub-category first, then shared tags, then same age
 * bracket — enough signal to keep the rail relevant without a search index.
 */
export const relatedProducts = (product: Product, limit = 8) => {
  const scored = products
    .filter((candidate) => candidate.slug !== product.slug)
    .map((candidate) => {
      let score = 0;
      for (const category of product.categories) {
        if (candidate.categories.includes(category)) score += category.includes("/") ? 4 : 1;
      }
      for (const tag of product.tags) {
        if (candidate.tags.includes(tag)) score += 2;
      }
      for (const age of product.ages) {
        if (candidate.ages.includes(age)) score += 0.5;
      }
      if (candidate.inStock) score += 0.25;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.candidate);
};

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type SearchDoc = { product: Product; haystack: string; name: string };

const searchDocs: SearchDoc[] = products.map((product) => ({
  product,
  name: normalise(product.name),
  haystack: normalise(
    [product.name, product.summary, product.descriptionText, product.tags.join(" "), product.categories.join(" ")].join(" "),
  ),
}));

export const searchProducts = (query: string, limit = 60) => {
  const terms = normalise(query).split(" ").filter(Boolean);
  if (!terms.length) return [];

  return searchDocs
    .map((doc) => {
      let score = 0;
      for (const term of terms) {
        if (doc.name.startsWith(term)) score += 12;
        else if (doc.name.includes(term)) score += 8;
        else if (doc.haystack.includes(term)) score += 3;
        else return null;
      }
      if (doc.product.inStock) score += 1;
      return { product: doc.product, score };
    })
    .filter((entry): entry is { product: Product; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
};

/** Curated home-page rails, each falling back to catalogue order when a Woo collection is thin. */
const pick = (pool: Product[], limit: number) => pool.filter((p) => p.images.length > 0).slice(0, limit);

export const bestSellers = (limit = 8) => {
  const tagged = productsInCollection("best-seller").filter((p) => p.inStock);
  return pick(tagged.length >= limit ? tagged : [...tagged, ...products.filter((p) => p.inStock)], limit);
};

export const newArrivals = (limit = 8) => {
  const tagged = productsInCollection("new-arrivals").filter((p) => p.inStock);
  const rest = [...products].filter((p) => p.inStock).sort((a, b) => Number(b.id) - Number(a.id));
  return pick([...tagged, ...rest], limit);
};

export const onSaleProducts = (limit = 8, minDiscount = 15) =>
  pick(
    products.filter(
      (p) =>
        p.inStock &&
        p.compareAtPrice !== null &&
        (p.compareAtPrice - p.price) / p.compareAtPrice >= minDiscount / 100,
    ),
    limit,
  );

const dedupe = (list: Product[]) => {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
};

export const uniqueProducts = dedupe;

/** Trim a product down to what a card needs, keeping client payloads small. */
export const toCard = (product: Product): CardProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  summary: product.summary,
  price: product.price,
  priceMax: product.priceMax,
  compareAtPrice: product.compareAtPrice,
  inStock: product.inStock,
  stock: product.stock,
  image: product.images[0] ?? null,
  collections: product.collections,
  hasOptions: product.variants.length > 0,
});

export const toCards = (list: Product[]) => list.map(toCard);

export const toShopItem = (product: Product): ShopProduct => ({
  ...toCard(product),
  categories: product.categories,
  ages: product.ages,
  tags: product.tags,
  language: product.language,
  position: product.position,
});
