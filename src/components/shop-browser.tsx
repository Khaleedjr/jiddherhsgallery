"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { CheckIcon, ChevronDownIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { Button, EmptyState, buttonClass, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { AgeGroup, Department, ShopProduct } from "@/lib/types";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A - Z" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

const PAGE_SIZE = 24;

export type ShopScope = {
  /** Category slug the page is already limited to, if any. */
  category?: string;
  /** Age value ("6-12 years") the page is already limited to, if any. */
  age?: string;
};

export function ShopBrowser({
  products,
  departments,
  ageGroups,
  scope = {},
  hideCategoryFilter = false,
  hideAgeFilter = false,
}: {
  products: ShopProduct[];
  departments: Department[];
  ageGroups: AgeGroup[];
  scope?: ShopScope;
  hideCategoryFilter?: boolean;
  hideAgeFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categoryParam = searchParams.getAll("category");
  const ageParam = searchParams.getAll("age");
  const languageParam = searchParams.getAll("language");
  const tagParam = searchParams.getAll("tag");
  const sort = (searchParams.get("sort") as SortValue | null) ?? "featured";
  const inStockOnly = searchParams.get("stock") === "1";
  const saleOnly = searchParams.get("sale") === "1";
  const minPrice = Number(searchParams.get("min") ?? "") || null;
  const maxPrice = Number(searchParams.get("max") ?? "") || null;

  const activeCount =
    categoryParam.length +
    ageParam.length +
    languageParam.length +
    tagParam.length +
    (inStockOnly ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleValue = useCallback(
    (key: string, value: string) => {
      updateParams((params) => {
        const current = params.getAll(key);
        params.delete(key);
        const next = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];
        next.forEach((entry) => params.append(key, entry));
      });
      setVisible(PAGE_SIZE);
    },
    [updateParams],
  );

  const setFlag = useCallback(
    (key: string, on: boolean) => {
      updateParams((params) => (on ? params.set(key, "1") : params.delete(key)));
      setVisible(PAGE_SIZE);
    },
    [updateParams],
  );

  const setSort = useCallback(
    (value: string) => {
      updateParams((params) => (value === "featured" ? params.delete("sort") : params.set("sort", value)));
    },
    [updateParams],
  );

  const setPrice = useCallback(
    (key: "min" | "max", value: string) => {
      updateParams((params) => (value ? params.set(key, value) : params.delete(key)));
      setVisible(PAGE_SIZE);
    },
    [updateParams],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
    setVisible(PAGE_SIZE);
  }, [pathname, router]);

  // Facets are derived from the page's scope, so counts always reflect reality.
  const facets = useMemo(() => {
    const categories = new Map<string, number>();
    const ages = new Map<string, number>();
    const languages = new Map<string, number>();
    const tags = new Map<string, number>();

    for (const product of products) {
      for (const slug of product.categories) categories.set(slug, (categories.get(slug) ?? 0) + 1);
      for (const age of product.ages) ages.set(age, (ages.get(age) ?? 0) + 1);
      if (product.language) languages.set(product.language, (languages.get(product.language) ?? 0) + 1);
      for (const tag of product.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }

    const topTags = [...tags.entries()]
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);

    return { categories, ages, languages, tags: topTags };
  }, [products]);

  const results = useMemo(() => {
    const matches = products.filter((product) => {
      if (inStockOnly && !product.inStock) return false;
      if (saleOnly && !product.compareAtPrice) return false;
      if (minPrice && product.price < minPrice) return false;
      if (maxPrice && product.price > maxPrice) return false;
      if (categoryParam.length && !categoryParam.some((slug) => product.categories.includes(slug))) {
        return false;
      }
      if (ageParam.length && !ageParam.some((age) => product.ages.includes(age))) return false;
      if (languageParam.length && (!product.language || !languageParam.includes(product.language))) {
        return false;
      }
      if (tagParam.length && !tagParam.some((tag) => product.tags.includes(tag))) return false;
      return true;
    });

    const sorted = [...matches];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        sorted.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      default:
        sorted.sort(
          (a, b) => Number(b.inStock) - Number(a.inStock) || a.position - b.position || a.name.localeCompare(b.name),
        );
    }
    return sorted;
  }, [
    products,
    inStockOnly,
    saleOnly,
    minPrice,
    maxPrice,
    categoryParam,
    ageParam,
    languageParam,
    tagParam,
    sort,
  ]);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  const shown = results.slice(0, visible);

  const panel = (
    <FilterPanel
      departments={departments}
      ageGroups={ageGroups}
      facets={facets}
      scope={scope}
      hideCategoryFilter={hideCategoryFilter}
      hideAgeFilter={hideAgeFilter}
      selected={{
        category: categoryParam,
        age: ageParam,
        language: languageParam,
        tag: tagParam,
        inStockOnly,
        saleOnly,
        minPrice,
        maxPrice,
      }}
      onToggle={toggleValue}
      onFlag={setFlag}
      onPrice={setPrice}
      onClear={clearAll}
      activeCount={activeCount}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100dvh-var(--header-h)-3rem)] overflow-y-auto pr-2 pb-6">{panel}</div>
      </aside>

      <div>
        <div className="sticky top-(--header-h) z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-sand-200 bg-sand-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cx(buttonClass({ variant: "outline", size: "sm" }), "lg:hidden")}
          >
            <MenuIcon className="size-4" />
            Filters
            {activeCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-coal-800 text-[0.65rem] text-sand-50">
                {activeCount}
              </span>
            ) : null}
          </button>

          <p className="hidden text-[0.85rem] text-ink-600 lg:block">
            <strong className="font-semibold text-ink-900">{results.length}</strong>{" "}
            {results.length === 1 ? "product" : "products"}
          </p>

          <label className="ml-auto flex items-center gap-2 text-[0.8rem] text-ink-600">
            <span className="hidden sm:inline">Sort</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-9 appearance-none rounded-full border border-sand-300 bg-white pr-8 pl-3.5 text-[0.8rem] font-medium text-ink-800 outline-none transition hover:border-sand-400"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-500" />
            </div>
          </label>
        </div>

        <p className="mb-4 text-[0.85rem] text-ink-600 lg:hidden">
          <strong className="font-semibold text-ink-900">{results.length}</strong>{" "}
          {results.length === 1 ? "product" : "products"}
        </p>

        {results.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            description="Try widening your price range or clearing a filter — the shelf is deep, something close is probably waiting."
            action={
              <Button variant="outline" onClick={clearAll}>
                Clear all filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
              {shown.map((product, index) => (
                <ProductCard key={product.slug} product={product} priority={index < 4} />
              ))}
            </div>

            {visible < results.length ? (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-[0.8rem] text-ink-500">
                  Showing {shown.length} of {results.length}
                </p>
                <Button variant="outline" size="lg" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                  Load more products
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="animate-fade absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="animate-slide-in absolute inset-y-0 right-0 flex w-[min(22rem,92vw)] flex-col bg-sand-50 shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-sand-200 px-5">
              <span className="font-display text-lg font-semibold text-coal-900">Filters</span>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-full p-2 text-ink-600 transition hover:bg-sand-200"
                aria-label="Close filters"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{panel}</div>
            <div className="shrink-0 border-t border-sand-200 bg-white p-4">
              <Button size="lg" className="w-full" onClick={() => setFiltersOpen(false)}>
                Show {results.length} {results.length === 1 ? "product" : "products"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Facets = {
  categories: Map<string, number>;
  ages: Map<string, number>;
  languages: Map<string, number>;
  tags: Array<[string, number]>;
};

function FilterPanel({
  departments,
  ageGroups,
  facets,
  scope,
  hideCategoryFilter,
  hideAgeFilter,
  selected,
  onToggle,
  onFlag,
  onPrice,
  onClear,
  activeCount,
}: {
  departments: Department[];
  ageGroups: AgeGroup[];
  facets: Facets;
  scope: ShopScope;
  hideCategoryFilter: boolean;
  hideAgeFilter: boolean;
  selected: {
    category: string[];
    age: string[];
    language: string[];
    tag: string[];
    inStockOnly: boolean;
    saleOnly: boolean;
    minPrice: number | null;
    maxPrice: number | null;
  };
  onToggle: (key: string, value: string) => void;
  onFlag: (key: string, on: boolean) => void;
  onPrice: (key: "min" | "max", value: string) => void;
  onClear: () => void;
  activeCount: number;
}) {
  const visibleDepartments = departments
    .map((dept) => ({
      ...dept,
      children: dept.children.filter((child) => (facets.categories.get(child.slug) ?? 0) > 0),
    }))
    .filter((dept) => (facets.categories.get(dept.slug) ?? 0) > 0 || dept.children.length > 0)
    .filter((dept) => dept.slug !== scope.category);

  const visibleAges = ageGroups.filter(
    (age) => (facets.ages.get(age.value) ?? 0) > 0 && age.value !== scope.age,
  );

  return (
    <div className="space-y-7">
      {activeCount > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="flex w-full items-center justify-between rounded-md bg-coal-50 px-3 py-2.5 text-[0.8rem] font-semibold text-coal-800 transition hover:bg-coal-100"
        >
          Clear all filters
          <span className="rounded-full bg-coal-800 px-2 py-0.5 text-[0.65rem] text-sand-50">
            {activeCount}
          </span>
        </button>
      ) : null}

      <FilterGroup title="Availability">
        <CheckRow
          label="In stock only"
          checked={selected.inStockOnly}
          onChange={(next) => onFlag("stock", next)}
        />
        <CheckRow label="On offer" checked={selected.saleOnly} onChange={(next) => onFlag("sale", next)} />
      </FilterGroup>

      {!hideCategoryFilter && visibleDepartments.length > 0 ? (
        <FilterGroup title="Category">
          <div className="space-y-4">
            {visibleDepartments.map((dept) => (
              <div key={dept.slug}>
                <CheckRow
                  label={dept.name}
                  count={facets.categories.get(dept.slug)}
                  checked={selected.category.includes(dept.slug)}
                  onChange={() => onToggle("category", dept.slug)}
                  emphasis
                />
                {dept.children.length > 0 ? (
                  <div className="mt-1 space-y-0.5 border-l border-sand-200 pl-3">
                    {dept.children.map((child) => (
                      <CheckRow
                        key={child.slug}
                        label={child.name}
                        count={facets.categories.get(child.slug)}
                        checked={selected.category.includes(child.slug)}
                        onChange={() => onToggle("category", child.slug)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </FilterGroup>
      ) : null}

      {!hideAgeFilter && visibleAges.length > 0 ? (
        <FilterGroup title="Age group">
          {visibleAges.map((age) => (
            <CheckRow
              key={age.slug}
              label={age.name}
              count={facets.ages.get(age.value)}
              checked={selected.age.includes(age.value)}
              onChange={() => onToggle("age", age.value)}
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <PriceInput
            label="Minimum price"
            placeholder="Min"
            value={selected.minPrice}
            onCommit={(value) => onPrice("min", value)}
          />
          <span className="text-ink-400">–</span>
          <PriceInput
            label="Maximum price"
            placeholder="Max"
            value={selected.maxPrice}
            onCommit={(value) => onPrice("max", value)}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {[
            { label: `Under ${formatPrice(5000)}`, min: "", max: "5000" },
            { label: `${formatPrice(5000)} – ${formatPrice(15000)}`, min: "5000", max: "15000" },
            { label: `Over ${formatPrice(15000)}`, min: "15000", max: "" },
          ].map((band) => (
            <button
              key={band.label}
              type="button"
              onClick={() => {
                onPrice("min", band.min);
                onPrice("max", band.max);
              }}
              className="rounded-full border border-sand-300 px-2.5 py-1 text-[0.7rem] text-ink-600 transition hover:border-coal-400 hover:text-coal-800"
            >
              {band.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {facets.languages.size > 1 ? (
        <FilterGroup title="Language">
          {[...facets.languages.entries()].map(([language, count]) => (
            <CheckRow
              key={language}
              label={language}
              count={count}
              checked={selected.language.includes(language)}
              onChange={() => onToggle("language", language)}
            />
          ))}
        </FilterGroup>
      ) : null}

      {facets.tags.length > 0 ? (
        <FilterGroup title="Popular topics">
          <div className="flex flex-wrap gap-1.5">
            {facets.tags.map(([tag, count]) => {
              const active = selected.tag.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggle("tag", tag)}
                  className={cx(
                    "rounded-full border px-2.5 py-1 text-[0.72rem] capitalize transition",
                    active
                      ? "border-coal-700 bg-coal-800 text-sand-50"
                      : "border-sand-300 text-ink-600 hover:border-coal-400 hover:text-coal-800",
                  )}
                >
                  {tag}
                  <span className={cx("ml-1", active ? "text-sand-300/80" : "text-ink-400")}>{count}</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-ink-500 uppercase">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
  emphasis = false,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: (next: boolean) => void;
  emphasis?: boolean;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 transition hover:bg-sand-100",
        emphasis ? "text-[0.85rem] font-semibold text-coal-900" : "text-[0.82rem] text-ink-700",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cx(
          "grid size-4 shrink-0 place-items-center rounded-[4px] border transition",
          checked ? "border-coal-700 bg-coal-700 text-sand-50" : "border-sand-400 bg-white",
        )}
      >
        {checked ? <CheckIcon className="size-3" strokeWidth={2.6} /> : null}
      </span>
      <span className="flex-1 leading-snug">{label}</span>
      {count !== undefined ? <span className="text-[0.7rem] text-ink-400">{count}</span> : null}
    </label>
  );
}

function PriceInput({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value ? String(value) : "");

  useEffect(() => {
    setDraft(value ? String(value) : "");
  }, [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit(draft);
        }
      }}
      className="h-9 w-full min-w-0 rounded-md border border-sand-300 bg-white px-2.5 text-[0.8rem] text-ink-800 outline-none transition focus:border-coal-500"
    />
  );
}
