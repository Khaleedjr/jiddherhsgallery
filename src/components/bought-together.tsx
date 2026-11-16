"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { BagIcon, CheckIcon } from "@/components/icons";
import { useSiteText } from "@/components/site-text-provider";
import { cx } from "@/components/ui";
import { fill } from "@/lib/content/format";
import { formatPrice } from "@/lib/format";

export type CompanionOption = { id: string; label: string; price: number; image: string | null };

/** A product offered alongside another: just what the box and the bag need. */
export type Companion = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  /** Paid orders that held both; 0 when picked to match. */
  together: number;
  /** Colours or sizes in stock, for products that have them. */
  optionName?: string;
  options?: CompanionOption[];
};

/**
 * "Frequently bought together", under the product's own Add to bag: this
 * item and its companions as beads strung on one thread, each with a tick to
 * leave it out, a running total, and one button for all of them. The item
 * itself always stays in; if it needs a colour or size that isn't available,
 * the button asks for one first.
 */
export function BoughtTogether({
  self,
  companions,
  canAddSelf,
  onAddSelf,
}: {
  self: { name: string; price: number; image: string | null };
  companions: Companion[];
  /** False while the chosen option is sold out. */
  canAddSelf: boolean;
  /** Adds the item itself (with its chosen option) to the bag. */
  onAddSelf: () => void;
}) {
  const { add } = useCart();
  const t = useSiteText().shopping;
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(companions.map((c) => c.id)));
  /* Which colour or size of each companion; the first one in stock to begin with. */
  const [optionOf, setOptionOf] = useState<Record<string, string>>(() =>
    Object.fromEntries(companions.flatMap((c) => (c.options?.length ? [[c.id, c.options[0].id]] : []))),
  );
  const [added, setAdded] = useState(false);

  if (!companions.length) return null;

  const optionFor = (c: Companion) => c.options?.find((option) => option.id === optionOf[c.id]) ?? null;
  const priceOf = (c: Companion) => optionFor(c)?.price ?? c.price;
  const fromOrders = companions.some((c) => c.together > 0);
  const chosen = companions.filter((c) => ticked.has(c.id));
  const count = chosen.length + 1;
  const total = self.price + chosen.reduce((sum, c) => sum + priceOf(c), 0);

  const toggle = (id: string) =>
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addAll = () => {
    if (!canAddSelf) return;
    onAddSelf();
    for (const c of chosen) {
      const option = optionFor(c);
      add({ productId: c.id, variantId: option?.id ?? null, slug: c.slug, name: c.name, variantLabel: option?.label ?? null, price: priceOf(c), image: option?.image ?? c.image });
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const rows: Array<Companion & { self?: true }> = [{ id: "self", slug: "", name: self.name, price: self.price, image: self.image, together: 0, self: true }, ...companions];

  return (
    <section aria-labelledby="bought-together" className="mt-8 rounded-[1.5rem] bg-sand-100 p-5 ring-1 ring-ink-900/10 sm:p-6">
      <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-gold-700 uppercase">{t.setEyebrow}</p>
      <h2 id="bought-together" className="mt-1.5 text-xl leading-tight sm:text-2xl">
        {fromOrders ? t.setTitleOrders : t.setTitlePicked}
      </h2>
      <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-600">{fromOrders ? t.setTextOrders : t.setTextPicked}</p>

      {/* One thread through every bead: the photos are strung like a tasbih, as the ages are on the homepage. */}
      <ol className="relative mt-5 space-y-3">
        <span className="absolute top-7 bottom-7 left-[calc(4rem-0.5px)] w-px bg-coal-900/70" aria-hidden />
        {rows.map((row) => {
          const isSelf = row.self === true;
          const on = isSelf || ticked.has(row.id);
          const option = isSelf ? null : optionFor(row);
          const image = option?.image ?? row.image;
          const photo = (
            <span
              className={cx(
                "relative block size-14 shrink-0 overflow-hidden rounded-full bg-sand-200 ring-4 ring-sand-100 transition duration-300",
                !on && "opacity-35 grayscale",
              )}
            >
              {image ? <Image src={image} alt="" fill sizes="56px" className="object-cover" /> : null}
            </span>
          );
          return (
            <li key={row.id} className="relative flex min-h-14 items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={isSelf || undefined}
                aria-label={isSelf ? `${row.name} ${t.setThisItem}` : row.name}
                disabled={isSelf}
                onClick={() => toggle(row.id)}
                className={cx(
                  "grid size-6 shrink-0 place-items-center rounded-md border-[1.5px] transition",
                  on ? "border-coal-900 bg-coal-900 text-gold-500" : "border-ink-400 bg-sand-50 text-transparent hover:border-coal-900",
                  isSelf && "opacity-60",
                )}
              >
                <CheckIcon className="size-3.5" strokeWidth={3} />
              </button>
              {isSelf ? (
                photo
              ) : (
                <Link href={`/products/${row.slug}`} tabIndex={-1} aria-hidden>
                  {photo}
                </Link>
              )}
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className={cx("min-w-0 text-[0.86rem] leading-snug", on ? "text-ink-900" : "text-ink-500")}>
                  {isSelf ? (
                    <span className="line-clamp-2 font-medium">
                      {row.name} <span className="font-normal text-ink-500">{t.setThisItem}</span>
                    </span>
                  ) : (
                    <Link href={`/products/${row.slug}`} className="line-clamp-2 font-medium hover:underline">
                      {row.name}
                    </Link>
                  )}
                  {row.options && row.options.length > 1 ? (
                    <select
                      value={optionOf[row.id]}
                      onChange={(event) => setOptionOf((current) => ({ ...current, [row.id]: event.target.value }))}
                      disabled={!on}
                      aria-label={`${row.optionName ?? "Option"} for ${row.name}`}
                      className="mt-1.5 h-8 max-w-full rounded-full border border-ink-900/20 bg-sand-50 pr-7 pl-3 text-[0.76rem] text-ink-800 disabled:opacity-50"
                    >
                      {row.options.map((choice) => (
                        <option key={choice.id} value={choice.id}>
                          {choice.label}
                        </option>
                      ))}
                    </select>
                  ) : option ? (
                    <span className="mt-0.5 block text-[0.74rem] text-ink-500">{option.label}</span>
                  ) : null}
                </div>
                <span className={cx("shrink-0 text-[0.86rem] font-semibold tabular-nums", on ? "text-ink-900" : "text-ink-400 line-through")}>
                  {formatPrice(isSelf ? row.price : priceOf(row))}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-col gap-4 border-t border-ink-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.78rem] text-ink-600">{count === 1 ? t.setTotalOne : fill(t.setTotal, { count })}</p>
          <p className="font-display text-2xl font-semibold text-ink-900 tabular-nums">{formatPrice(total)}</p>
        </div>
        <button
          type="button"
          onClick={addAll}
          disabled={!canAddSelf}
          className="tone-ink inline-flex h-12 items-center justify-center gap-2 rounded-full bg-coal-900 px-6 text-[0.9rem] font-semibold text-gold-500 transition hover:bg-black active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-52"
        >
          {added ? (
            <>
              <CheckIcon className="size-4" /> {t.setAdded}
            </>
          ) : canAddSelf ? (
            <>
              <BagIcon className="size-4" /> {count === 1 ? t.setAddOne : fill(t.setAdd, { count })}
            </>
          ) : (
            t.setChooseOption
          )}
        </button>
      </div>
    </section>
  );
}
