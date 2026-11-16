import { getCatalog, toCards } from "@/lib/catalog";

/** How many mushafs the homepage's Qur'an card shows at most (three on phones, four from laptops up). */
const QURAN_PICKS = 4;

/**
 * Everything the homepage draws on, read from the live catalogue. The page is
 * static, and the admin rebuilds every storefront page after any catalogue or
 * stock change (see refreshStorefront in lib/admin/revalidate.ts), so products
 * added, edited or sold out there show up here on the next visit.
 */
export async function getHomeData() {
  const catalog = await getCatalog();

  /* Only mushafs that are in stock and have a photo can stand in the Qur'an card.
     The category also holds Qur'an players and stands, so the name has to say Qur'an or mushaf. */
  const quran = catalog
    .productsInCategory("books/the-holy-quran")
    .filter((product) => product.inStock && product.images.length > 0 && /qur'?an|mus-?haf/i.test(product.name))
    .slice(0, QURAN_PICKS);

  return {
    productCount: catalog.catalogMeta.productCount,
    departments: catalog.departments,
    ageGroups: catalog.ageGroups,
    quran: toCards(quran),
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;

/** "0 - 3 years" reads better as a figure and a unit when it is set large: "0-3". */
export const ageFigure = (name: string) => name.replace(/\s*years?/i, "").replace(/\s*-\s*/, "-");
