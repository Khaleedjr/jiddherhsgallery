import { cache } from "react";
import categoriesJson from "@/data/categories.json";
import { listProducts } from "@/lib/store/products";
import type {
  AgeGroup,
  CardProduct,
  Collection,
  Department,
  Product,
  ShopProduct,
} from "@/lib/types";

/**
 * The shape of the catalogue — department names, slugs and artwork. It changes
 * rarely, so navigation reads it directly. Product counts here are from the
 * original import; live counts come from getCatalog().
 */
export const taxonomy = {
  departments: categoriesJson.departments as Department[],
  ageGroups: categoriesJson.ageGroups as AgeGroup[],
  collections: categoriesJson.collections as Collection[],
};

export const inCategory = (product: Product, slug: string) =>
  product.categories.some((c) => c === slug || c.startsWith(`${slug}/`));

/**
 * Everything the storefront knows about the catalogue, built from the store's
 * published products. Cached per request; admin edits revalidate the pages.
 */
export const getCatalog = cache(async () =>
  buildCatalog((await listProducts()).filter((product) => product.status === "published")),
);

export type Catalog = ReturnType<typeof buildCatalog>;

function buildCatalog(products: Product[]) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const count = (test: (p: Product) => boolean) => products.reduce((n, p) => n + (test(p) ? 1 : 0), 0);

  const departments: Department[] = taxonomy.departments.map((dept) => ({
    ...dept,
    count: count((p) => inCategory(p, dept.slug)),
    children: dept.children.map((child) => ({ ...child, count: count((p) => inCategory(p, child.slug)) })),
  }));
  const ageGroups: AgeGroup[] = taxonomy.ageGroups.map((age) => ({
    ...age,
    count: count((p) => p.ages.includes(age.value)),
  }));
  const collections: Collection[] = taxonomy.collections.map((collection) => ({
    ...collection,
    count: count((p) => p.collections.includes(collection.slug)),
  }));

  const allCategorySlugs = departments.flatMap((dept) => [dept.slug, ...dept.children.map((child) => child.slug)]);

  const catalogMeta = {
    productCount: products.length,
    inStockCount: count((p) => p.inStock),
    categoryCount: allCategorySlugs.length,
  };

  const getProduct = (slug: string) => bySlug.get(slug);

  const findCategory = (slug: string) => {
    for (const dept of departments) {
      if (dept.slug === slug) return { node: dept, department: dept, isDepartment: true as const };
      const child = dept.children.find((c) => c.slug === slug);
      if (child) return { node: child, department: dept, isDepartment: false as const };
    }
    return null;
  };

  const findAgeGroup = (slug: string) => ageGroups.find((age) => age.slug === slug);
  const findCollection = (slug: string) => collections.find((c) => c.slug === slug);

  const productsInCategory = (slug: string) => products.filter((p) => inCategory(p, slug));
  const productsInAge = (value: string) => products.filter((p) => p.ages.includes(value));
  const productsInCollection = (slug: string) => products.filter((p) => p.collections.includes(slug));

  /** Price bounds across the whole catalogue, used to seed the shop's price filter. */
  const priceBounds = products.reduce(
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
  const relatedProducts = (product: Product, limit = 8) =>
    products
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
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.candidate);

  const searchDocs = products.map((product) => ({
    product,
    name: normalise(product.name),
    haystack: normalise(
      [product.name, product.summary, product.descriptionText, product.tags.join(" "), product.categories.join(" ")].join(" "),
    ),
  }));

  const searchProducts = (query: string, limit = 60) => {
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

  const bestSellers = (limit = 8) => {
    const tagged = productsInCollection("best-seller").filter((p) => p.inStock);
    return pick(tagged.length >= limit ? tagged : [...tagged, ...products.filter((p) => p.inStock)], limit);
  };

  const newArrivals = (limit = 8) => {
    const tagged = productsInCollection("new-arrivals").filter((p) => p.inStock);
    const rest = [...products].filter((p) => p.inStock).sort((a, b) => Number(b.id) - Number(a.id));
    return pick(uniqueProducts([...tagged, ...rest]), limit);
  };

  const onSaleProducts = (limit = 8, minDiscount = 15) =>
    pick(
      products.filter(
        (p) =>
          p.inStock &&
          p.compareAtPrice !== null &&
          (p.compareAtPrice - p.price) / p.compareAtPrice >= minDiscount / 100,
      ),
      limit,
    );

  return {
    products,
    departments,
    ageGroups,
    collections,
    catalogMeta,
    allCategorySlugs,
    priceBounds,
    getProduct,
    findCategory,
    findAgeGroup,
    findCollection,
    productsInCategory,
    productsInAge,
    productsInCollection,
    relatedProducts,
    searchProducts,
    bestSellers,
    newArrivals,
    onSaleProducts,
  };
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const uniqueProducts = (list: Product[]) => {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
};

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
