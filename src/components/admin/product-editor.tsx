"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { AlertIcon, CopyIcon, ExternalIcon, ImageIcon, UploadIcon } from "@/components/admin/icons";
import { uploadImage } from "@/components/admin/image-upload";
import { Field, adminButton, cx, inputClass, selectClass } from "@/components/admin/ui";
import { ChevronLeftFallback } from "@/components/admin/editor-bits";
import { CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { deleteProductAction, duplicateProductAction, saveProductAction } from "@/lib/admin/actions/products";
import { isAllowedImage, type ProductInput } from "@/lib/admin/product-input";
import { sanitizeHtml } from "@/lib/admin/sanitize";
import { slugify } from "@/lib/admin/slugify";
import type { StoredProduct } from "@/lib/store/types";
import type { AgeGroup, Collection, Department } from "@/lib/types";

type VariantDraft = {
  key: string;
  id: string | null;
  optionValue: string;
  option2Value: string;
  price: string;
  wasPrice: string;
  stock: string;
  inStock: boolean;
  image: string | null;
};

type Draft = {
  name: string;
  slug: string;
  slugTouched: boolean;
  sku: string;
  summary: string;
  descriptionHtml: string;
  status: "published" | "draft";
  price: string;
  wasPrice: string;
  trackStock: boolean;
  stock: string;
  inStock: boolean;
  images: string[];
  categories: string[];
  ages: string[];
  collections: string[];
  tags: string;
  language: string;
  optionName: string;
  option2Name: string;
  hasOptions: boolean;
  variants: VariantDraft[];
};

let keySeed = 0;
const newKey = () => `v${Date.now().toString(36)}${(keySeed += 1)}`;
const str = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));
const num = (value: string) => {
  const cleaned = value.replace(/[,\s₦]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

function toDraft(product: StoredProduct | null): Draft {
  if (!product) {
    return {
      name: "",
      slug: "",
      slugTouched: false,
      sku: "",
      summary: "",
      descriptionHtml: "",
      status: "published",
      price: "",
      wasPrice: "",
      trackStock: true,
      stock: "",
      inStock: true,
      images: [],
      categories: [],
      ages: [],
      collections: [],
      tags: "",
      language: "",
      optionName: "Colour",
      option2Name: "",
      hasOptions: false,
      variants: [],
    };
  }
  const first = product.variants[0];
  return {
    name: product.name,
    slug: product.slug,
    slugTouched: true,
    sku: product.sku ?? "",
    summary: product.summary,
    descriptionHtml: product.descriptionHtml,
    status: product.status,
    price: str(product.price),
    wasPrice: str(product.compareAtPrice),
    trackStock: product.stock !== null,
    stock: str(product.stock),
    inStock: product.inStock,
    images: product.images,
    categories: product.categories,
    ages: product.ages,
    collections: product.collections,
    tags: product.tags.join(", "),
    language: product.language ?? "",
    optionName: first?.optionName ?? "Colour",
    option2Name: first?.option2Name ?? "",
    hasOptions: product.variants.length > 0,
    variants: product.variants.map((v) => ({
      key: newKey(),
      id: v.id,
      optionValue: v.optionValue,
      option2Value: v.option2Value ?? "",
      price: str(v.price),
      wasPrice: v.regularPrice !== null && v.price !== null && v.regularPrice > v.price ? str(v.regularPrice) : "",
      stock: str(v.stock),
      inStock: v.inStock,
      image: v.image,
    })),
  };
}

function toInput(id: string | null, d: Draft): ProductInput {
  return {
    id,
    name: d.name,
    slug: d.slug,
    sku: d.sku,
    summary: d.summary,
    descriptionHtml: d.descriptionHtml,
    status: d.status,
    price: num(d.price),
    wasPrice: num(d.wasPrice),
    trackStock: d.trackStock,
    stock: d.trackStock ? (num(d.stock) ?? 0) : null,
    inStock: d.inStock,
    images: d.images,
    categories: d.categories,
    ages: d.ages,
    collections: d.collections,
    tags: d.tags.split(","),
    language: d.language || null,
    optionName: d.hasOptions ? d.optionName : null,
    option2Name: d.hasOptions && d.option2Name.trim() ? d.option2Name : null,
    variants: d.hasOptions
      ? d.variants.map((v) => ({
          id: v.id,
          optionValue: v.optionValue,
          option2Value: v.option2Value || null,
          price: num(v.price),
          wasPrice: num(v.wasPrice),
          stock: num(v.stock),
          inStock: v.inStock,
          image: v.image,
        }))
      : [],
  };
}

export function ProductEditor({
  product,
  departments,
  ageGroups,
  collections,
  languages,
  children,
}: {
  product: StoredProduct | null;
  departments: Department[];
  ageGroups: AgeGroup[];
  collections: Collection[];
  languages: string[];
  /** Server-rendered panels (sales, stock history) shown under the form. */
  children?: ReactNode;
}) {
  const router = useRouter();
  // Built once: option rows get random keys, so a second toDraft() would never equal the first.
  const [initial] = useState(() => toDraft(product));
  const [draft, setDraft] = useState<Draft>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = (statusOverride?: Draft["status"]) => {
    setError(null);
    const next = statusOverride ? { ...draft, status: statusOverride } : draft;
    if (statusOverride) setDraft(next);
    startTransition(async () => {
      const result = await saveProductAction(toInput(product?.id ?? null, next));
      if (!result.ok) {
        setError(result.error);
        requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      const saved = { ...next, slug: result.slug };
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      if (!product) {
        router.replace(`/admin/products/${result.id}?created=1`);
      } else {
        setNotice("Changes saved");
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!product) return;
    if (!window.confirm(`Delete “${product.name}” permanently? Past orders keep their record of it.`)) return;
    setBaseline(JSON.stringify(draft));
    startTransition(async () => {
      await deleteProductAction(product.id);
    });
  };

  const duplicate = () => {
    if (!product) return;
    if (dirty && !window.confirm("You have unsaved changes. Duplicate the last saved version anyway?")) return;
    startTransition(async () => {
      await duplicateProductAction(product.id);
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="pb-24 lg:pb-0"
    >
      {error ? (
        <div
          ref={errorRef}
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-berry-500/25 bg-berry-500/8 px-4 py-3 text-[0.82rem] font-medium text-berry-600"
        >
          <AlertIcon className="mt-px size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel title="Product details">
            <div className="space-y-4">
              <Field label="Name" htmlFor="p-name">
                <input
                  id="p-name"
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => ({ ...d, name, slug: d.slugTouched ? d.slug : slugify(name) }));
                  }}
                  className={cx(inputClass, "text-[0.95rem] font-medium")}
                  placeholder="e.g. My First Book of Duas"
                  required
                  maxLength={200}
                />
              </Field>
              <Field
                label="Web address"
                htmlFor="p-slug"
                hint={`jiddersgallery.com.ng/products/${draft.slug || slugify(draft.name) || "…"}`}
              >
                <input
                  id="p-slug"
                  value={draft.slug}
                  onChange={(e) => setDraft((d) => ({ ...d, slug: slugify(e.target.value), slugTouched: true }))}
                  className={cx(inputClass, "font-mono text-[0.8rem]")}
                  placeholder="made-from-the-name"
                />
              </Field>
              <Field label="Short summary" htmlFor="p-summary" hint="One line shown under the name on product cards.">
                <input
                  id="p-summary"
                  value={draft.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  className={inputClass}
                  maxLength={240}
                  placeholder="e.g. Board book · Ages 0-3"
                />
              </Field>
              <DescriptionEditor value={draft.descriptionHtml} onChange={(value) => set("descriptionHtml", value)} />
            </div>
          </Panel>

          <Panel title="Photos" description="The first photo is the cover shown in the shop. Photos are resized before upload.">
            <ImageManager images={draft.images} onChange={(images) => set("images", images)} />
          </Panel>

          <Panel
            title="Pricing & options"
            description={draft.hasOptions ? "Each option has its own price and stock." : "Selling price, and an optional ‘was’ price to show a discount."}
            action={
              <label className="flex cursor-pointer items-center gap-2 text-[0.78rem] font-semibold text-ink-700">
                <input
                  type="checkbox"
                  className="size-4 accent-forest-700"
                  checked={draft.hasOptions}
                  onChange={(e) => {
                    const on = e.target.checked;
                    if (!on && draft.variants.length && !window.confirm("Remove all options? Their prices and stock will be cleared.")) return;
                    setDraft((d) => ({
                      ...d,
                      hasOptions: on,
                      variants:
                        on && !d.variants.length
                          ? [
                              {
                                key: newKey(),
                                id: null,
                                optionValue: "",
                                option2Value: "",
                                price: d.price,
                                wasPrice: d.wasPrice,
                                stock: d.trackStock ? d.stock : "",
                                inStock: true,
                                image: null,
                              },
                            ]
                          : on
                            ? d.variants
                            : [],
                    }));
                  }}
                />
                Has options (colour, size…)
              </label>
            }
          >
            {draft.hasOptions ? (
              <VariantsEditor draft={draft} setDraft={setDraft} />
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price (₦)" htmlFor="p-price">
                    <MoneyInput id="p-price" value={draft.price} onChange={(v) => set("price", v)} required />
                  </Field>
                  <Field label="Was price (₦)" htmlFor="p-was" hint="Leave empty unless it's on sale.">
                    <MoneyInput id="p-was" value={draft.wasPrice} onChange={(v) => set("wasPrice", v)} />
                  </Field>
                </div>
                <DiscountNote price={num(draft.price)} was={num(draft.wasPrice)} />
                <div className="grid gap-4 border-t border-sand-200 pt-5 sm:grid-cols-2">
                  <Field label="SKU" htmlFor="p-sku" hint="Your own stock code (optional).">
                    <input id="p-sku" value={draft.sku} onChange={(e) => set("sku", e.target.value)} className={inputClass} />
                  </Field>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-[0.76rem] font-semibold text-ink-700">
                      <input
                        type="checkbox"
                        className="size-4 accent-forest-700"
                        checked={draft.trackStock}
                        onChange={(e) => set("trackStock", e.target.checked)}
                      />
                      Count stock for this product
                    </label>
                    {draft.trackStock ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={draft.stock}
                          onChange={(e) => set("stock", e.target.value)}
                          className={inputClass}
                          aria-label="Units in stock"
                          placeholder="0"
                        />
                        <p className="mt-1 text-[0.72rem] text-ink-500">
                          Changes here are logged as a stock count. Use{" "}
                          <Link href="/admin/inventory" className="font-semibold text-forest-700 underline-offset-2 hover:underline">
                            Inventory
                          </Link>{" "}
                          to record a restock.
                        </p>
                      </>
                    ) : (
                      <select
                        value={draft.inStock ? "in" : "out"}
                        onChange={(e) => set("inStock", e.target.value === "in")}
                        className={selectClass}
                        aria-label="Stock status"
                      >
                        <option value="in">In stock</option>
                        <option value="out">Out of stock</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {children}
        </div>

        <div className="min-w-0 space-y-6 lg:sticky lg:top-6">
          <Panel title="Publish">
            <div className="space-y-4">
              <fieldset className="grid grid-cols-2 gap-2">
                <legend className="sr-only">Visibility</legend>
                {(
                  [
                    { value: "published", label: "Published", hint: "Live on the store" },
                    { value: "draft", label: "Draft", hint: "Hidden from shoppers" },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={cx(
                      "cursor-pointer rounded-lg border px-3 py-2.5 transition",
                      draft.status === option.value ? "border-forest-600 bg-forest-50" : "border-sand-300 hover:border-sand-400",
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={draft.status === option.value}
                      onChange={() => set("status", option.value)}
                      className="sr-only"
                    />
                    <span className="block text-[0.8rem] font-semibold text-ink-900">{option.label}</span>
                    <span className="block text-[0.7rem] text-ink-500">{option.hint}</span>
                  </label>
                ))}
              </fieldset>
              <button type="submit" disabled={pending} className={cx(adminButton(), "hidden w-full lg:inline-flex")}>
                {pending ? "Saving…" : product ? "Save changes" : "Create product"}
              </button>
              {notice ? (
                <p role="status" className="text-center text-[0.76rem] font-semibold text-forest-700">
                  ✓ {notice}
                </p>
              ) : dirty && product ? (
                <p className="text-center text-[0.74rem] text-gold-700">Unsaved changes</p>
              ) : null}
              {product ? (
                <div className="flex flex-wrap gap-2 border-t border-sand-200 pt-4">
                  {product.status === "published" ? (
                    <Link href={`/products/${product.slug}`} target="_blank" className={adminButton({ variant: "secondary", size: "sm" })}>
                      <ExternalIcon className="size-3.5" />
                      View
                    </Link>
                  ) : null}
                  <button type="button" onClick={duplicate} disabled={pending} className={adminButton({ variant: "secondary", size: "sm" })}>
                    <CopyIcon className="size-3.5" />
                    Duplicate
                  </button>
                  <button type="button" onClick={remove} disabled={pending} className={adminButton({ variant: "danger-outline", size: "sm" })}>
                    <TrashIcon className="size-3.5" />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Categories">
            <CategoryPicker departments={departments} value={draft.categories} onChange={(v) => set("categories", v)} />
          </Panel>

          <Panel title="Age groups">
            <CheckList
              options={ageGroups.map((a) => ({ value: a.value, label: a.name }))}
              value={draft.ages}
              onChange={(v) => set("ages", v)}
            />
          </Panel>

          <Panel title="Collections" description="Feature it on the home page rails.">
            <CheckList
              options={collections.map((c) => ({ value: c.slug, label: c.name }))}
              value={draft.collections}
              onChange={(v) => set("collections", v)}
            />
          </Panel>

          <Panel title="Tags & language">
            <div className="space-y-4">
              <Field label="Tags" htmlFor="p-tags" hint="Comma separated — they help search.">
                <input id="p-tags" value={draft.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} placeholder="seerah, bedtime, gift" />
              </Field>
              <Field label="Language" htmlFor="p-lang">
                <select id="p-lang" value={draft.language} onChange={(e) => set("language", e.target.value)} className={selectClass}>
                  <option value="">Not set</option>
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>
        </div>
      </div>

      {/* Mobile save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button type="submit" disabled={pending} className={cx(adminButton(), "w-full")}>
          {pending ? "Saving…" : product ? (dirty ? "Save changes" : "Saved") : "Create product"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ pieces */

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-sand-200/80 px-5 py-3.5">
        <div>
          <h2 className="font-sans text-[0.9rem] font-semibold tracking-normal text-ink-900">{title}</h2>
          {description ? <p className="mt-0.5 text-[0.74rem] text-ink-500">{description}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MoneyInput({ id, value, onChange, required }: { id?: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[0.85rem] text-ink-400">₦</span>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d,.]/g, ""))}
        className={cx(inputClass, "pl-7 tabular-nums")}
        placeholder="0"
        required={required}
      />
    </div>
  );
}

function DiscountNote({ price, was }: { price: number | null; was: number | null }) {
  if (price === null || was === null) return null;
  if (was <= price) {
    return <p className="text-[0.74rem] text-gold-700">The was price must be higher than the price to show as a sale — it will be ignored.</p>;
  }
  return (
    <p className="text-[0.74rem] font-medium text-forest-700">
      Shows as {Math.round(((was - price) / was) * 100)}% off on the store.
    </p>
  );
}

function CheckList({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-[0.8rem] text-ink-700">
          <input
            type="checkbox"
            className="size-4 accent-forest-700"
            checked={value.includes(option.value)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, option.value] : value.filter((v) => v !== option.value))
            }
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function CategoryPicker({
  departments,
  value,
  onChange,
}: {
  departments: Department[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const selected = new Set(value);
  const toggle = (slug: string, on: boolean) => {
    const next = new Set(selected);
    if (on) {
      next.add(slug);
    } else {
      // Unticking a department also unticks everything filed under it.
      for (const s of [...next]) if (s === slug || s.startsWith(`${slug}/`)) next.delete(s);
    }
    onChange([...next]);
  };
  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
      {departments.map((dept) => (
        <div key={dept.slug}>
          <label className="flex cursor-pointer items-center gap-2.5 text-[0.82rem] font-semibold text-ink-900">
            <input type="checkbox" className="size-4 accent-forest-700" checked={selected.has(dept.slug)} onChange={(e) => toggle(dept.slug, e.target.checked)} />
            {dept.name}
          </label>
          <div className="mt-1.5 space-y-1.5">
            {dept.children.map((child) => {
              const depth = child.slug.split("/").length - 1;
              return (
                <label
                  key={child.slug}
                  className="flex cursor-pointer items-center gap-2.5 text-[0.78rem] text-ink-600"
                  style={{ paddingLeft: `${depth * 1.1}rem` }}
                >
                  <input
                    type="checkbox"
                    className="size-3.5 accent-forest-700"
                    checked={selected.has(child.slug)}
                    onChange={(e) => toggle(child.slug, e.target.checked)}
                  />
                  {child.name}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[0.7rem] text-ink-500">Ticking a sub-category files it under its department too.</p>
    </div>
  );
}

function VariantsEditor({ draft, setDraft }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const second = draft.option2Name.trim().length > 0;
  const update = (key: string, patch: Partial<VariantDraft>) =>
    setDraft((d) => ({ ...d, variants: d.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));
  const add = () =>
    setDraft((d) => {
      const last = d.variants.at(-1);
      return {
        ...d,
        variants: [
          ...d.variants,
          { key: newKey(), id: null, optionValue: "", option2Value: "", price: last?.price ?? "", wasPrice: last?.wasPrice ?? "", stock: "", inStock: true, image: null },
        ],
      };
    });
  const total = draft.variants.reduce((sum, v) => sum + (num(v.stock) ?? 0), 0);
  const tracked = draft.variants.some((v) => num(v.stock) !== null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Option name" htmlFor="opt1" hint="e.g. Colour, Size, Edition">
          <input id="opt1" value={draft.optionName} onChange={(e) => setDraft((d) => ({ ...d, optionName: e.target.value }))} className={inputClass} />
        </Field>
        <Field label="Second option (optional)" htmlFor="opt2" hint="Only if it varies two ways, e.g. Size and Colour.">
          <input id="opt2" value={draft.option2Name} onChange={(e) => setDraft((d) => ({ ...d, option2Name: e.target.value }))} className={inputClass} placeholder="—" />
        </Field>
      </div>

      <div className="relative -mx-5 overflow-x-auto border-y border-sand-200">
        <table className="w-full min-w-[40rem]">
          <thead className="bg-sand-50/70">
            <tr className="text-left text-[0.66rem] font-semibold tracking-[0.06em] text-ink-500 uppercase">
              <th className="px-3 py-2 pl-5">{draft.optionName || "Option"}</th>
              {second ? <th className="px-3 py-2">{draft.option2Name}</th> : null}
              <th className="px-3 py-2">Price ₦</th>
              <th className="px-3 py-2">Was ₦</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2 pr-5">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200/70">
            {draft.variants.map((v, index) => {
              const counted = num(v.stock) !== null;
              return (
                <tr key={v.key}>
                  <td className="px-3 py-2 pl-5">
                    <input
                      value={v.optionValue}
                      onChange={(e) => update(v.key, { optionValue: e.target.value })}
                      className={cx(inputClass, "py-1.5")}
                      placeholder={index === 0 ? "e.g. Blue" : ""}
                      aria-label={`${draft.optionName || "Option"} ${index + 1}`}
                    />
                  </td>
                  {second ? (
                    <td className="px-3 py-2">
                      <input
                        value={v.option2Value}
                        onChange={(e) => update(v.key, { option2Value: e.target.value })}
                        className={cx(inputClass, "py-1.5")}
                        aria-label={`${draft.option2Name} ${index + 1}`}
                      />
                    </td>
                  ) : null}
                  <td className="w-28 px-3 py-2">
                    <input
                      inputMode="numeric"
                      value={v.price}
                      onChange={(e) => update(v.key, { price: e.target.value.replace(/[^\d,.]/g, "") })}
                      className={cx(inputClass, "py-1.5 tabular-nums")}
                      aria-label={`Price for option ${index + 1}`}
                    />
                  </td>
                  <td className="w-28 px-3 py-2">
                    <input
                      inputMode="numeric"
                      value={v.wasPrice}
                      onChange={(e) => update(v.key, { wasPrice: e.target.value.replace(/[^\d,.]/g, "") })}
                      className={cx(inputClass, "py-1.5 tabular-nums")}
                      aria-label={`Was price for option ${index + 1}`}
                    />
                  </td>
                  <td className="w-40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={v.stock}
                        onChange={(e) => update(v.key, { stock: e.target.value })}
                        className={cx(inputClass, "w-16 py-1.5 tabular-nums")}
                        placeholder="—"
                        aria-label={`Stock for option ${index + 1}`}
                      />
                      {counted ? null : (
                        <label className="flex items-center gap-1 text-[0.7rem] whitespace-nowrap text-ink-600">
                          <input type="checkbox" className="size-3.5 accent-forest-700" checked={v.inStock} onChange={(e) => update(v.key, { inStock: e.target.checked })} />
                          In stock
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 pr-5 text-right">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, variants: d.variants.filter((x) => x.key !== v.key) }))}
                      disabled={draft.variants.length === 1}
                      className="grid size-8 place-items-center rounded-md text-ink-400 transition hover:bg-berry-500/8 hover:text-berry-600 disabled:opacity-30"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={add} className={adminButton({ variant: "secondary", size: "sm" })}>
          <PlusIcon className="size-3.5" />
          Add option
        </button>
        <p className="text-[0.74rem] text-ink-500">
          {tracked ? `${total} units across all options. ` : ""}Leave stock empty for options you don&apos;t count.
        </p>
      </div>
    </div>
  );
}

function DescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const editor = useRef<HTMLDivElement>(null);
  const latest = useRef(value);
  latest.current = value;
  // What we loaded, as given and as the browser normalised it — so a click-in/click-out isn't an edit.
  const loaded = useRef({ source: value, normalised: "" });

  // The visual editor owns its DOM while typing; only load HTML into it when switching in.
  useEffect(() => {
    if (mode !== "visual" || !editor.current) return;
    editor.current.innerHTML = latest.current;
    loaded.current = { source: latest.current, normalised: editor.current.innerHTML };
  }, [mode]);

  const emit = () => {
    if (!editor.current) return;
    const html = editor.current.innerHTML;
    if (html === loaded.current.normalised) onChange(loaded.current.source);
    else onChange(html === "<br>" ? "" : html);
  };
  // execCommand is deprecated but still the only built-in way to format a contentEditable region.
  const run = (command: string, arg?: string) => {
    editor.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const tools: Array<{ label: ReactNode; title: string; run: () => void; className?: string }> = [
    { label: "B", title: "Bold", run: () => run("bold"), className: "font-bold" },
    { label: "I", title: "Italic", run: () => run("italic"), className: "italic font-serif" },
    { label: "Heading", title: "Heading", run: () => run("formatBlock", "<h3>") },
    { label: "Text", title: "Normal text", run: () => run("formatBlock", "<p>") },
    { label: "• List", title: "Bulleted list", run: () => run("insertUnorderedList") },
    { label: "1. List", title: "Numbered list", run: () => run("insertOrderedList") },
    {
      label: "Link",
      title: "Link",
      run: () => {
        const url = window.prompt("Link address (https://…)");
        if (url && /^(https?:\/\/|\/|mailto:)/i.test(url.trim())) run("createLink", url.trim());
      },
    },
    { label: "Clear", title: "Clear formatting", run: () => run("removeFormat") },
  ];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[0.76rem] font-semibold text-ink-700" id="desc-label">
          Description
        </span>
        <div className="flex rounded-lg bg-sand-100 p-0.5 text-[0.72rem] font-semibold" role="tablist" aria-label="Editor mode">
          {(
            [
              { key: "visual", label: "Visual" },
              { key: "html", label: "HTML" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={mode === t.key}
              onClick={() => {
                if (mode === "visual") emit();
                setMode(t.key);
              }}
              className={cx("rounded-md px-2.5 py-1 transition", mode === t.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-sand-300 focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/15">
        {mode === "visual" ? (
          <>
            <div className="flex flex-wrap gap-1 border-b border-sand-200 bg-sand-50 px-2 py-1.5" role="toolbar" aria-label="Formatting">
              {tools.map((tool) => (
                <button
                  key={tool.title}
                  type="button"
                  title={tool.title}
                  // Keep the text selection when a toolbar button is pressed.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={tool.run}
                  className={cx("h-7 min-w-7 rounded px-2 text-[0.76rem] text-ink-700 transition hover:bg-white hover:shadow-sm", tool.className)}
                >
                  {tool.label}
                </button>
              ))}
            </div>
            <div
              ref={editor}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-labelledby="desc-label"
              onInput={emit}
              onBlur={emit}
              onPaste={(e) => {
                // Pasted web/Word content arrives full of styling; keep only the simple formatting the store uses.
                const html = e.clipboardData.getData("text/html");
                if (!html) return;
                e.preventDefault();
                document.execCommand("insertHTML", false, sanitizeHtml(html));
                emit();
              }}
              className="prose-store max-h-[32rem] min-h-48 overflow-y-auto bg-white px-4 py-3 text-[0.88rem] outline-none empty:before:text-ink-400 empty:before:content-['Tell_customers_what_makes_this_special…']"
            />
          </>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
            className="block w-full resize-y border-0 bg-white px-3 py-2.5 font-mono text-[0.78rem] leading-relaxed text-ink-800 outline-none"
            aria-labelledby="desc-label"
          />
        )}
      </div>
    </div>
  );
}

function ImageManager({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [busy, setBusy] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(images);
  latest.current = images;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setProblem(null);
    const list = [...files].slice(0, 10);
    setBusy((n) => n + list.length);
    for (const file of list) {
      try {
        const uploaded = await uploadImage(file);
        onChange([...latest.current, uploaded]);
      } catch (error) {
        setProblem(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  };

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addUrl = () => {
    const value = url.trim();
    if (!value) return;
    if (!isAllowedImage(value)) {
      setProblem("Only photos from jiddersgallery.com.ng/wp-content/uploads can be linked. Upload other photos instead.");
      return;
    }
    onChange([...images, value]);
    setUrl("");
    setProblem(null);
  };

  const skeletons = useMemo(() => Array.from({ length: busy }, (_, i) => i), [busy]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files);
      }}
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        {images.map((src, index) => (
          <div key={`${src}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-sand-200 bg-sand-100">
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            {index === 0 ? (
              <span className="absolute top-1.5 left-1.5 rounded bg-forest-900/85 px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wide text-sand-50 uppercase">
                Cover
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <div className="flex gap-1">
                <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="grid size-7 place-items-center rounded bg-white/90 text-ink-800 disabled:opacity-40" aria-label="Move earlier">
                  <ChevronLeftFallback />
                </button>
                <button type="button" disabled={index === images.length - 1} onClick={() => move(index, index + 1)} className="grid size-7 place-items-center rounded bg-white/90 text-ink-800 disabled:opacity-40" aria-label="Move later">
                  <ChevronLeftFallback flip />
                </button>
              </div>
              <button type="button" onClick={() => onChange(images.filter((_, i) => i !== index))} className="grid size-7 place-items-center rounded bg-white/90 text-berry-600" aria-label="Remove photo">
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {skeletons.map((i) => (
          <div key={`busy-${i}`} className="grid aspect-square animate-pulse place-items-center rounded-lg border border-sand-200 bg-sand-100 text-[0.7rem] text-ink-500">
            Uploading…
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-sand-300 text-[0.74rem] font-semibold text-ink-500 transition hover:border-forest-400 hover:bg-forest-50/50 hover:text-forest-700"
        >
          {images.length ? <UploadIcon className="size-5" /> : <ImageIcon className="size-6" />}
          Add photos
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} tabIndex={-1} />
      <p className="mt-2 text-[0.72rem] text-ink-500">Drag photos here or tap Add photos. JPEG, PNG or WebP.</p>

      <div className="mt-4 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="…or paste a photo link from the old site"
          className={cx(inputClass, "text-[0.78rem]")}
          aria-label="Photo link"
        />
        <button type="button" onClick={addUrl} className={adminButton({ variant: "secondary" })}>
          Add
        </button>
      </div>
      {problem ? <p className="mt-2 text-[0.74rem] font-medium text-berry-600">{problem}</p> : null}
    </div>
  );
}
