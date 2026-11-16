import { getCatalog } from "@/lib/catalog";
import { PAID_STATUSES, listOrders } from "@/lib/store/orders";
import type { Order } from "@/lib/store/types";
import type { Product } from "@/lib/types";

/**
 * "Bought together": for any product, the few things that go with it.
 *
 * Real pairs come first: products that appear in the same paid order, the
 * more orders the stronger. While the shop is young that history is thin,
 * so the rest are chosen from shelves that complement each other (a prayer
 * mat with modest wear, a tasbeeh or a Qur'an; a children's book with an
 * activity book or flash cards for the same age), never a second copy of
 * the same kind of thing. Only items that are in stock and have a photo are
 * offered; ones with colours or sizes come with their available options.
 */

/** Shelves that complete each other, strongest first (second-level category slugs). */
const KIDS_BOOK_PARTNERS = [
  "books/activity-books",
  "toys-learning/flash-cards",
  "toys-learning/games-puzzles",
  "toys-learning/educational-posters",
  "toys-learning/creative-toys",
  "ibadah-essentials/ibadah-trackers",
  "modest-wear/kids",
];

const AFFINITY: Record<string, string[]> = {
  "books/the-holy-quran": ["ibadah-essentials/quran-stands", "ibadah-essentials/prayer-mats", "ibadah-essentials/tasbeeh-counters", "ibadah-essentials/quran-speakers", "modest-wear/women", "modest-wear/men"],
  "books/for-adults": ["books/the-holy-quran", "ibadah-essentials/tasbeeh-counters", "ibadah-essentials/prayer-mats", "ibadah-essentials/quran-stands", "ibadah-essentials/adhkar-flexes-stickers"],
  "books/ages-0-3": ["toys-learning/flash-cards", "toys-learning/creative-toys", "toys-learning/educational-posters", "modest-wear/kids"],
  "books/ages-3-6": KIDS_BOOK_PARTNERS,
  "books/ages-6-12": KIDS_BOOK_PARTNERS,
  "books/ages-12-18": ["books/activity-books", "ibadah-essentials/ibadah-trackers", "books/the-holy-quran", "ibadah-essentials/tasbeeh-counters", "toys-learning/stationery"],
  "books/special-categories": KIDS_BOOK_PARTNERS,
  "books/activity-books": ["toys-learning/stationery", "toys-learning/flash-cards", "toys-learning/educational-posters", "toys-learning/games-puzzles", "books/ages-3-6", "books/ages-6-12"],
  "toys-learning/creative-toys": ["toys-learning/stationery", "books/activity-books", "toys-learning/games-puzzles", "books/ages-3-6"],
  "toys-learning/games-puzzles": ["toys-learning/flash-cards", "toys-learning/creative-toys", "books/activity-books", "books/ages-3-6", "books/ages-6-12"],
  "toys-learning/educational-posters": ["toys-learning/flash-cards", "toys-learning/stationery", "books/activity-books", "ibadah-essentials/adhkar-flexes-stickers"],
  "toys-learning/stationery": ["books/activity-books", "toys-learning/stationery", "toys-learning/flash-cards", "toys-learning/educational-posters"],
  "toys-learning/flash-cards": ["toys-learning/educational-posters", "books/activity-books", "toys-learning/games-puzzles", "toys-learning/stationery", "books/ages-3-6"],
  "ibadah-essentials/prayer-mats": ["modest-wear/women", "modest-wear/men", "ibadah-essentials/tasbeeh-counters", "books/the-holy-quran", "ibadah-essentials/quran-stands", "modest-wear/kids"],
  "ibadah-essentials/tasbeeh-counters": ["ibadah-essentials/prayer-mats", "ibadah-essentials/adhkar-flexes-stickers", "books/the-holy-quran", "modest-wear/women", "modest-wear/men"],
  "ibadah-essentials/quran-stands": ["books/the-holy-quran", "ibadah-essentials/prayer-mats", "ibadah-essentials/tasbeeh-counters"],
  "ibadah-essentials/quran-speakers": ["books/the-holy-quran", "ibadah-essentials/adhkar-flexes-stickers", "ibadah-essentials/ibadah-trackers", "ibadah-essentials/prayer-mats"],
  "ibadah-essentials/adhkar-flexes-stickers": ["ibadah-essentials/ibadah-trackers", "ibadah-essentials/tasbeeh-counters", "toys-learning/educational-posters", "ibadah-essentials/prayer-mats"],
  "ibadah-essentials/ibadah-trackers": ["ibadah-essentials/adhkar-flexes-stickers", "ibadah-essentials/tasbeeh-counters", "books/activity-books", "ibadah-essentials/prayer-mats"],
  "ibadah-essentials/adhan-tools": ["ibadah-essentials/prayer-mats", "ibadah-essentials/quran-speakers", "ibadah-essentials/tasbeeh-counters"],
  "modest-wear/women": ["ibadah-essentials/prayer-mats", "ibadah-essentials/tasbeeh-counters", "books/the-holy-quran", "books/for-adults"],
  "modest-wear/men": ["ibadah-essentials/prayer-mats", "ibadah-essentials/tasbeeh-counters", "books/the-holy-quran", "books/for-adults"],
  "modest-wear/kids": ["ibadah-essentials/prayer-mats", "books/ages-3-6", "books/ages-6-12", "toys-learning/flash-cards", "ibadah-essentials/tasbeeh-counters"],
};

const ADULT_AGE = "18+ years";

/** Shelves that say who a book is for rather than what it is; they count for less than a product's own kind. */
const AUDIENCE = /^books\/(ages-|for-adults|special-categories)/;

/** Second-level categories ("books/ages-3-6"): the shelves affinity works with. */
const shelves = (product: Product) => product.categories.filter((slug) => slug.split("/").length === 2);
/** The shelves that say what a product is: a Qur'an, a prayer mat, flash cards. */
const kindShelves = (product: Product) => shelves(product).filter((slug) => !AUDIENCE.test(slug));

/** The most specific categories a product is filed under: two of these alike means the same kind of thing. */
const deepest = (product: Product) => product.categories.filter((slug) => !product.categories.some((other) => other.startsWith(`${slug}/`)));

/** A stable 0–1 number per pair, so different products get different picks without anything changing between visits. */
function jitter(a: string, b: string) {
  let hash = 2166136261;
  for (const char of `${a}|${b}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 1000) / 1000;
}

export type Pairing = {
  product: Product;
  /** How many paid orders held both products; 0 when picked from complementary shelves. */
  together: number;
};

type Pairs = { together: Map<string, Map<string, number>>; sold: Map<string, number> };

/** Products ordered together, and units sold, from paid orders (sample orders excluded). */
export function countPairs(orders: Order[]): Pairs {
  const together = new Map<string, Map<string, number>>();
  const sold = new Map<string, number>();
  for (const order of orders) {
    if (order.demo || !PAID_STATUSES.includes(order.status)) continue;
    const ids = [...new Set(order.items.map((item) => item.productId).filter(Boolean))];
    for (const item of order.items) sold.set(item.productId, (sold.get(item.productId) ?? 0) + item.quantity);
    for (const a of ids) {
      for (const b of ids) {
        if (a === b) continue;
        const row = together.get(a) ?? new Map<string, number>();
        row.set(b, (row.get(b) ?? 0) + 1);
        together.set(a, row);
      }
    }
  }
  return { together, sold };
}

/** Can be offered: in stock (in at least one option), pictured and priced. */
export const isOfferable = (product: Product) =>
  product.images.length > 0 &&
  (product.variants.length ? product.variants.some((variant) => variant.inStock && (variant.price ?? product.price) > 0) : product.inStock && product.price > 0);

/**
 * A product's companions. The dashboard can override the automatic choice
 * per product: hand-picked products (in that order, skipping any that are
 * sold out or unpublished for now), or no box at all. `automatic` ignores
 * that, for the editor's preview of what Automatic would pick.
 */
export function pairingsFor(product: Product, products: Product[], pairs: Pairs, limit = 2, { automatic = false } = {}): Pairing[] {
  const setting = automatic ? undefined : product.pairing;
  if (setting?.mode === "off") return [];
  if (setting?.mode === "manual") {
    const byId = new Map(products.map((p) => [p.id, p]));
    const boughtWith = pairs.together.get(product.id);
    return setting.ids
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p && p.id !== product.id && isOfferable(p)))
      .map((p) => ({ product: p, together: boughtWith?.get(p.id) ?? 0 }));
  }
  return autoPairings(product, products, pairs, limit);
}

function autoPairings(product: Product, products: Product[], pairs: Pairs, limit: number): Pairing[] {
  const ownDeepest = new Set(deepest(product));
  const ownKinds = new Set(kindShelves(product));
  /* Age matters for children's things only; anything also meant for adults ignores it. */
  const kidsAges = product.ages.length && !product.ages.includes(ADULT_AGE) ? product.ages : [];
  /* Each of the product's shelves brings its partners; its own kind (Qur'an, prayer mat) outweighs its age shelves. */
  const partnerWeights = new Map<string, number>();
  for (const shelf of shelves(product)) {
    const base = AUDIENCE.test(shelf) ? 40 : 60;
    (AFFINITY[shelf] ?? []).forEach((partner, rank) => partnerWeights.set(partner, Math.max(partnerWeights.get(partner) ?? 0, base - rank * 6)));
  }
  const boughtWith = pairs.together.get(product.id);
  const priceCap = Math.max(product.price * 2.5, 12_000);

  const scored: Array<{ candidate: Product; together: number; score: number }> = [];
  for (const candidate of products) {
    if (candidate.id === product.id || !isOfferable(candidate)) continue;
    const together = boughtWith?.get(candidate.id) ?? 0;
    const sameKind = deepest(candidate).some((slug) => ownDeepest.has(slug)) || kindShelves(candidate).some((slug) => ownKinds.has(slug));
    let affinity = 0;
    for (const shelf of shelves(candidate)) affinity = Math.max(affinity, partnerWeights.get(shelf) ?? 0);
    if (!together && (sameKind || affinity === 0)) continue;

    let score = together * 1000 + affinity;
    /* Ages must overlap: no toddler's prayer mat beside an adult's Qur'an. Children's things also prefer the same age. */
    const overlap = product.ages.length > 0 && candidate.ages.length > 0 && candidate.ages.some((age) => product.ages.includes(age));
    if (product.ages.length && candidate.ages.length && !overlap) score -= 40;
    else if (kidsAges.length && overlap) score += 14;
    if (!kidsAges.length && candidate.ages.length && !candidate.ages.includes(ADULT_AGE)) score -= 15;
    if (candidate.collections.includes("best-seller")) score += 8;
    score += Math.min(pairs.sold.get(candidate.id) ?? 0, 20) * 1.5;
    if (candidate.price > priceCap) score -= 30;
    score += jitter(product.id, candidate.id) * 10;
    scored.push({ candidate, together, score });
  }

  /* Best first, and never two of the same kind (two Qur'ans, two hijabs, two tasbeehs). */
  scored.sort((a, b) => b.score - a.score);
  const picked: Pairing[] = [];
  const kinds = new Set<string>();
  for (const { candidate, together } of scored) {
    const marks = [deepest(candidate).sort().join(","), ...kindShelves(candidate)];
    if (marks.some((mark) => kinds.has(mark))) continue;
    for (const mark of marks) kinds.add(mark);
    picked.push({ product: candidate, together });
    if (picked.length === limit) break;
  }
  return picked;
}

/* Recomputed at most once a minute per server, since every product page asks. */
let memo: { at: number; value: Promise<{ products: Product[]; pairs: Pairs }> } | null = null;

async function load() {
  if (!memo || Date.now() - memo.at > 60_000) {
    memo = {
      at: Date.now(),
      value: Promise.all([getCatalog(), listOrders()]).then(([catalog, orders]) => ({ products: catalog.products, pairs: countPairs(orders) })),
    };
    memo.value.catch(() => {
      memo = null;
    });
  }
  return memo.value;
}

export async function getPairings(product: Product, limit = 2) {
  const { products, pairs } = await load();
  return pairingsFor(product, products, pairs, limit);
}

/** What Automatic would show for a product, for the dashboard's editor. */
export async function automaticPairings(product: Product, limit = 2) {
  const { products, pairs } = await load();
  return pairingsFor(product, products, pairs, limit, { automatic: true });
}

/** Every product's pairings, compact, for the bag's suggestions. */
export async function getPairingMap(limit = 3) {
  const { products, pairs } = await load();
  const map: Record<string, Array<[string, number]>> = {};
  /* What each product is, so the bag doesn't offer a second Qur'an to someone who already has one. */
  const kinds: Record<string, string[]> = {};
  const used = new Set<string>();
  for (const product of products) {
    const own = kindShelves(product);
    if (own.length) kinds[product.id] = own;
    const list = pairingsFor(product, products, pairs, limit);
    if (!list.length) continue;
    map[product.id] = list.map(({ product: p, together }) => [p.id, together]);
    for (const { product: p } of list) used.add(p.id);
  }
  const items = Object.fromEntries(
    products
      .filter((product) => used.has(product.id))
      .map((product) => [product.id, { id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0] ?? null, hasOptions: product.variants.length > 0 }]),
  );
  return { pairs: map, items, kinds };
}

/** The pairs customers buy most often, for the dashboard. */
export async function topPairs(limit = 8) {
  const { products, pairs } = await load();
  const byId = new Map(products.map((product) => [product.id, product]));
  const rows: Array<{ a: Product; b: Product; count: number }> = [];
  for (const [a, row] of pairs.together) {
    for (const [b, count] of row) {
      if (a >= b) continue; // each pair once
      const pa = byId.get(a);
      const pb = byId.get(b);
      if (pa && pb) rows.push({ a: pa, b: pb, count });
    }
  }
  return rows.sort((x, y) => y.count - x.count).slice(0, limit);
}
