import { taxonomy } from "@/lib/catalog";
import { listProducts } from "@/lib/store/products";

/** Everything the product editor's pickers need, shared by the new and edit pages. */
export async function editorOptions() {
  const products = await listProducts();
  const languages = [...new Set(products.map((p) => p.language).filter((l): l is string => Boolean(l)))].sort();
  return {
    departments: taxonomy.departments,
    ageGroups: taxonomy.ageGroups,
    collections: taxonomy.collections,
    languages: languages.length ? languages : ["English", "Arabic"],
  };
}
