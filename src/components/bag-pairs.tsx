"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { PlusIcon } from "@/components/icons";
import { useSiteText } from "@/components/site-text-provider";
import { fill } from "@/lib/content/format";
import { formatPrice } from "@/lib/format";

type PairData = {
  pairs: Record<string, Array<[string, number]>>;
  kinds: Record<string, string[]>;
  items: Record<string, { id: string; slug: string; name: string; price: number; image: string | null; hasOptions: boolean }>;
};

/* Fetched once per visit, the first time the bag opens with something in it. */
let request: Promise<PairData> | null = null;
const loadPairs = () =>
  (request ??= fetch("/api/pairs")
    .then((response) => (response.ok ? (response.json() as Promise<PairData>) : { pairs: {}, items: {}, kinds: {} }))
    .catch(() => {
      request = null;
      return { pairs: {}, items: {}, kinds: {} };
    }));

/**
 * Under the bag's items: up to two things that go with what's in it, each
 * saying which item it pairs with. Real "bought together" pairs come first,
 * then the most recently added item's matches. Items with colours or sizes
 * link to their page to choose one.
 */
export function BagPairs({ onNavigate }: { onNavigate: () => void }) {
  const { items, add } = useCart();
  const t = useSiteText().shopping;
  const [data, setData] = useState<PairData | null>(null);

  useEffect(() => {
    let live = true;
    void loadPairs().then((loaded) => live && setData(loaded));
    return () => {
      live = false;
    };
  }, []);

  if (!data) return null;
  const inBag = new Set(items.map((item) => item.productId));
  const bagKinds = new Set(items.flatMap((item) => (item.productId ? (data.kinds?.[item.productId] ?? []) : [])));
  const offers = new Map<string, { id: string; withName: string; together: number }>();
  for (const item of [...items].reverse()) {
    if (!item.productId) continue;
    for (const [id, together] of data.pairs[item.productId] ?? []) {
      if (inBag.has(id) || offers.has(id) || !data.items[id]) continue;
      if ((data.kinds?.[id] ?? []).some((kind) => bagKinds.has(kind))) continue; // already has one of these
      offers.set(id, { id, withName: item.name, together });
    }
  }
  const list = [...offers.values()].sort((a, b) => b.together - a.together).slice(0, 2);
  if (!list.length) return null;

  return (
    <section aria-label={t.bagSuggestTitle} className="mx-5 mb-5 rounded-[1.25rem] bg-sand-100 p-4">
      <p className="text-[0.66rem] font-semibold tracking-[0.18em] text-gold-700 uppercase">{t.bagSuggestTitle}</p>
      <ul className="mt-3 space-y-3">
        {list.map((offer) => {
          const product = data.items[offer.id];
          const href = `/products/${product.slug}`;
          return (
            <li key={offer.id} className="flex items-center gap-3">
              <Link href={href} onClick={onNavigate} className="relative size-12 shrink-0 overflow-hidden rounded-full bg-sand-200 ring-2 ring-sand-100">
                {product.image ? <Image src={product.image} alt="" fill sizes="48px" className="object-cover" /> : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={href} onClick={onNavigate} className="line-clamp-1 text-[0.82rem] font-medium text-ink-900 hover:underline">
                  {product.name}
                </Link>
                <p className="line-clamp-1 text-[0.72rem] text-ink-500">
                  {fill(offer.together ? t.bagSuggestOrders : t.bagSuggestPicked, { item: offer.withName })} · {formatPrice(product.price)}
                </p>
              </div>
              {product.hasOptions ? (
                <Link
                  href={href}
                  onClick={onNavigate}
                  className="inline-flex h-8 shrink-0 items-center rounded-full border-[1.5px] border-coal-900 px-3 text-[0.74rem] font-semibold text-coal-900 transition hover:bg-coal-900 hover:text-gold-500"
                >
                  {t.bagSuggestChoose}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    add({ productId: product.id, variantId: null, slug: product.slug, name: product.name, variantLabel: null, price: product.price, image: product.image })
                  }
                  className="tone-ink inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-coal-900 px-3 text-[0.74rem] font-semibold text-gold-500 transition hover:bg-black active:scale-95"
                >
                  <PlusIcon className="size-3.5" />
                  {t.bagSuggestAdd}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
