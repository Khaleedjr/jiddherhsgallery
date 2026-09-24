import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/controls";
import { DownloadIcon, SearchIcon } from "@/components/admin/icons";
import { ProductsTable, type ProductRow } from "@/components/admin/products-table";
import { AdminLink, AdminPage, Card, Empty, Pagination, cx, inputClass, pageParam, withQuery } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { timeAgo } from "@/lib/admin/format";
import { taxonomy, inCategory } from "@/lib/catalog";
import { isLowStock } from "@/lib/format";
import { listProducts } from "@/lib/store/products";
import type { StoredProduct } from "@/lib/store/types";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 25;

const VIEWS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
] as const;

const SORTS = [
  { key: "featured", label: "Store order" },
  { key: "newest", label: "Newest first" },
  { key: "updated", label: "Recently edited" },
  { key: "name", label: "Name A–Z" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "stock-asc", label: "Stock: lowest first" },
] as const;

type Query = { q?: string; view?: string; cat?: string; sort?: string; page?: string; deleted?: string };

const matchesView = (p: StoredProduct, view: string) => {
  if (view === "published") return p.status === "published";
  if (view === "draft") return p.status === "draft";
  if (view === "low") return isLowStock(p.stock, p.inStock);
  if (view === "out") return !p.inStock;
  return true;
};

const sorters: Record<string, (a: StoredProduct, b: StoredProduct) => number> = {
  featured: (a, b) => a.position - b.position,
  newest: (a, b) => Number(b.id) - Number(a.id),
  updated: (a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || Number(b.id) - Number(a.id),
  name: (a, b) => a.name.localeCompare(b.name),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => (b.priceMax ?? b.price) - (a.priceMax ?? a.price),
  "stock-asc": (a, b) => (a.inStock ? (a.stock ?? 9999) : -1) - (b.inStock ? (b.stock ?? 9999) : -1),
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const view = VIEWS.some((v) => v.key === query.view) ? query.view! : "all";
  const sort = query.sort && sorters[query.sort] ? query.sort : "featured";
  const q = (query.q ?? "").trim().toLowerCase();
  const cat = taxonomy.departments.some((d) => d.slug === query.cat) ? query.cat! : "";

  const all = await listProducts();
  const counts = Object.fromEntries(VIEWS.map((v) => [v.key, all.filter((p) => matchesView(p, v.key)).length]));

  const filtered = all
    .filter((p) => matchesView(p, view))
    .filter((p) => !cat || inCategory(p, cat))
    .filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.id === q ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)),
    )
    .sort(sorters[sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pageParam(query.page), pages);
  const current = { q: query.q, view: view === "all" ? undefined : view, cat: cat || undefined, sort: sort === "featured" ? undefined : sort };
  const deptName = new Map(taxonomy.departments.map((d) => [d.slug, d.name]));

  const rows: ProductRow[] = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    image: p.images[0] ?? null,
    status: p.status,
    price: p.price,
    priceMax: p.priceMax,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    inStock: p.inStock,
    variants: p.variants.length,
    departments: p.categories.filter((c) => deptName.has(c)).map((c) => deptName.get(c)!),
    updated: p.updatedAt ? timeAgo(p.updatedAt) : "Imported",
  }));

  return (
    <AdminPage
      title="Products"
      description={`${all.length} products · ${counts.published} live on the store`}
      actions={
        <>
          <a href="/admin/export/products" className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-4 text-[0.82rem] font-semibold text-ink-800 transition hover:border-sand-400">
            <DownloadIcon className="size-4" />
            Export CSV
          </a>
          <AdminLink href="/admin/products/new">
            <PlusIcon className="size-4" />
            Add product
          </AdminLink>
        </>
      }
    >
      {query.deleted ? (
        <p role="status" className="rounded-lg border border-forest-200 bg-forest-50 px-4 py-2.5 text-[0.8rem] font-medium text-forest-700">
          Product deleted.
        </p>
      ) : null}

      <Card flush>
        <div className="flex gap-1 overflow-x-auto border-b border-sand-200 px-3 pt-2" role="tablist" aria-label="Filter products">
          {VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <Link
                key={v.key}
                href={withQuery("/admin/products", current, { view: v.key === "all" ? null : v.key, page: null })}
                role="tab"
                aria-selected={active}
                className={cx(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.8rem] font-semibold whitespace-nowrap transition",
                  active ? "border-forest-700 text-forest-800" : "border-transparent text-ink-500 hover:text-ink-800",
                )}
              >
                {v.label}
                <span className={cx("rounded-full px-1.5 text-[0.68rem] tabular-nums", active ? "bg-forest-100 text-forest-800" : "bg-sand-200 text-ink-600")}>
                  {counts[v.key]}
                </span>
              </Link>
            );
          })}
        </div>

        <form className="grid gap-2 border-b border-sand-200 p-3 sm:grid-cols-[1fr_12rem_12rem]" action="/admin/products">
          {current.view ? <input type="hidden" name="view" value={current.view} /> : null}
          <label className="relative">
            <span className="sr-only">Search products</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Search by name, SKU, ID or tag…"
              className={cx(inputClass, "pl-9")}
            />
          </label>
          <AutoSubmitSelect name="cat" defaultValue={cat} aria-label="Department">
            <option value="">All departments</option>
            {taxonomy.departments.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="sort" defaultValue={sort} aria-label="Sort by">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </AutoSubmitSelect>
        </form>

        {rows.length ? (
          <>
            <ProductsTable rows={rows} back={withQuery("/admin/products", current, { page: page > 1 ? page : null })} />
            <Pagination
              page={page}
              pages={pages}
              total={filtered.length}
              perPage={PER_PAGE}
              href={(target) => withQuery("/admin/products", current, { page: target > 1 ? target : null })}
            />
          </>
        ) : (
          <Empty
            title={q ? `Nothing matches “${query.q}”` : "No products here"}
            description="Try a different filter, or add a new product."
            action={<AdminLink href="/admin/products/new" variant="secondary">Add product</AdminLink>}
          />
        )}
      </Card>
    </AdminPage>
  );
}
