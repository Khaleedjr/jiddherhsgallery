"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmSubmit } from "@/components/admin/controls";
import { ExternalIcon, PencilIcon } from "@/components/admin/icons";
import { Pill, StockPill, Thumb, adminButton, cx, selectClass, td, th } from "@/components/admin/ui";
import { bulkProductsAction } from "@/lib/admin/actions/products";
import { formatPrice, formatPriceRange } from "@/lib/format";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  image: string | null;
  status: "published" | "draft";
  price: number;
  priceMax: number | null;
  compareAtPrice: number | null;
  stock: number | null;
  inStock: boolean;
  variants: number;
  departments: string[];
  updated: string;
};

export function ProductsTable({ rows, back }: { rows: ProductRow[]; back: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState("");
  const allOnPage = rows.length > 0 && rows.every((row) => selected.has(row.id));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form action={bulkProductsAction}>
      <input type="hidden" name="back" value={back} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}

      <div
        className={cx(
          "flex flex-wrap items-center gap-2 border-b border-sand-200 px-4 py-2.5 text-[0.78rem] transition",
          selected.size ? "bg-forest-50" : "bg-sand-50/60",
        )}
      >
        <span className="font-medium text-ink-600">
          {selected.size ? `${selected.size} selected` : "Select products to act on several at once"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            name="bulk"
            value={bulk}
            onChange={(event) => setBulk(event.target.value)}
            className={cx(selectClass, "h-8 w-44 py-1 text-[0.78rem]")}
            aria-label="Bulk action"
          >
            <option value="">Bulk actions</option>
            <option value="publish">Publish</option>
            <option value="draft">Move to drafts</option>
            <option value="delete">Delete permanently</option>
          </select>
          <ConfirmSubmit
            message={
              bulk === "delete"
                ? `Delete ${selected.size} product(s) permanently? This cannot be undone.`
                : `Apply to ${selected.size} product(s)?`
            }
            disabled={!selected.size || !bulk}
            className={adminButton({ variant: bulk === "delete" ? "danger" : "secondary", size: "sm" })}
            pendingLabel="Applying…"
          >
            Apply
          </ConfirmSubmit>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[56rem]">
          <thead className="border-b border-sand-200 bg-sand-50/60">
            <tr>
              <th className={cx(th, "w-10 pr-0")}>
                <input
                  type="checkbox"
                  className="size-4 accent-forest-700"
                  checked={allOnPage}
                  onChange={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      for (const row of rows) {
                        if (allOnPage) next.delete(row.id);
                        else next.add(row.id);
                      }
                      return next;
                    })
                  }
                  aria-label="Select all on this page"
                />
              </th>
              <th className={th}>Product</th>
              <th className={th}>Status</th>
              <th className={th}>Stock</th>
              <th className={cx(th, "text-right")}>Price</th>
              <th className={th}>Department</th>
              <th className={th}>Updated</th>
              <th className={cx(th, "text-right")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200/80">
            {rows.map((row) => (
              <tr key={row.id} className={cx("transition hover:bg-sand-50", selected.has(row.id) && "bg-forest-50/50")}>
                <td className={cx(td, "pr-0")}>
                  <input
                    type="checkbox"
                    className="size-4 accent-forest-700"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Thumb src={row.image} alt="" size={44} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${row.id}`}
                        className="line-clamp-2 max-w-[22rem] font-semibold text-ink-900 hover:text-forest-700"
                      >
                        {row.name}
                      </Link>
                      <p className="mt-0.5 text-[0.72rem] text-ink-500">
                        #{row.id}
                        {row.sku ? ` · SKU ${row.sku}` : ""}
                        {row.variants ? ` · ${row.variants} options` : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={td}>
                  {row.status === "published" ? <Pill tone="good">Published</Pill> : <Pill>Draft</Pill>}
                </td>
                <td className={td}>
                  <StockPill stock={row.stock} inStock={row.inStock} />
                </td>
                <td className={cx(td, "text-right whitespace-nowrap tabular-nums")}>
                  <span className="font-semibold text-ink-900">{formatPriceRange(row.price, row.priceMax)}</span>
                  {row.compareAtPrice && !row.priceMax ? (
                    <span className="ml-1.5 text-[0.72rem] text-ink-400 line-through">{formatPrice(row.compareAtPrice)}</span>
                  ) : null}
                </td>
                <td className={cx(td, "text-[0.78rem] text-ink-600")}>{row.departments.join(", ") || "—"}</td>
                <td className={cx(td, "text-[0.76rem] whitespace-nowrap text-ink-500")}>{row.updated}</td>
                <td className={cx(td, "text-right")}>
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className={adminButton({ variant: "ghost", size: "sm" })}
                      aria-label={`Edit ${row.name}`}
                    >
                      <PencilIcon className="size-3.5" />
                      Edit
                    </Link>
                    {row.status === "published" ? (
                      <Link
                        href={`/products/${row.slug}`}
                        target="_blank"
                        className={adminButton({ variant: "ghost", size: "sm" })}
                        aria-label={`View ${row.name} on the store`}
                      >
                        <ExternalIcon className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
