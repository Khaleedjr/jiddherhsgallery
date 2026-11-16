import { taxonomy } from "@/lib/catalog";
import { listProducts } from "@/lib/store/products";

/** Everything the product editor's pickers need, shared by the new and edit pages. */
export async function editorOptions() {
  const products = await listProducts();
  const languages = [...new Set(products.map((p) => p.language).filter((l): l is string => Boolean(l)))].sort();
  /* For the "Featured together" picker: every product, published and in stock ones first. */
  const catalogue = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.variants.length ? (p.variants.find((v) => v.inStock)?.price ?? p.variants[0]?.price ?? p.price) : p.price,
      image: p.images[0] ?? null,
      available: p.status === "published" && (p.variants.length ? p.variants.some((v) => v.inStock) : p.inStock),
    }))
    .sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name));
  return {
    catalogue,
    departments: taxonomy.departments,
    ageGroups: taxonomy.ageGroups,
    collections: taxonomy.collections,
    languages: languages.length ? languages : ["English", "Arabic"],
  };
}
