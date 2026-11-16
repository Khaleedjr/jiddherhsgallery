"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BoughtTogether, type Companion } from "@/components/bought-together";
import { useCart } from "@/components/cart-provider";
import {
  BagIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  ShieldIcon,
  StarKhatimIcon,
  TruckIcon,
} from "@/components/icons";
import { Badge, Button, buttonClass, cx } from "@/components/ui";
import {
  discountPercent,
  formatPrice,
  formatPriceRange,
  isLowStock,
  lowStockLabel,
} from "@/lib/format";
import { useSiteText } from "@/components/site-text-provider";
import type { Product } from "@/lib/types";

export function ProductDetail({ product, companions = [] }: { product: Product; companions?: Companion[] }) {
  const { add } = useCart();
  const { shopping: t } = useSiteText();
  const hasVariants = product.variants.length > 0;

  const [variantId, setVariantId] = useState<string | null>(
    hasVariants ? (product.variants.find((variant) => variant.inStock)?.id ?? product.variants[0].id) : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => product.variants.find((entry) => entry.id === variantId) ?? null,
    [product.variants, variantId],
  );

  const images = product.images.length > 0 ? product.images : [];
  const price = variant?.price ?? product.price;
  const compareAt = variant ? variant.regularPrice : product.compareAtPrice;
  const showCompare = compareAt !== null && compareAt > price;
  const discount = discountPercent(price, compareAt);
  const purchasable = hasVariants ? Boolean(variant?.inStock) : product.inStock;
  const stock = variant ? variant.stock : product.stock;
  const lowStock = isLowStock(stock, purchasable);
  const optionName = product.variants[0]?.optionName ?? "Option";

  const selectVariant = (id: string) => {
    setVariantId(id);
    const next = product.variants.find((entry) => entry.id === id);
    if (next?.image) {
      const index = images.indexOf(next.image);
      if (index >= 0) setActiveImage(index);
    }
  };

  const addSelf = (count: number) =>
    add(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        name: product.name,
        variantLabel: variant?.label ?? null,
        price,
        image: variant?.image ?? images[0] ?? null,
      },
      count,
    );

  const handleAdd = () => {
    addSelf(quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        {/* The whole photo, never cropped: portrait shots sit on cream instead of losing their top and bottom. */}
        <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-sand-200 lg:rounded-[2rem]">
          {images[activeImage] ? (
            <Image
              src={images[activeImage]}
              alt={`${product.name} — image ${activeImage + 1}`}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 34rem, 100vw"
              className="object-contain"
            />
          ) : (
            <div className="pattern-girih-light grid size-full place-items-center">
              <StarKhatimIcon className="size-10 text-gold-400/70" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap gap-1.5">
            {!product.inStock ? <Badge tone="sold-out">{t.soldOut}</Badge> : null}
            {product.inStock && discount >= 10 ? <Badge tone="sale">-{discount}%</Badge> : null}
            {product.collections.includes("best-seller") ? <Badge tone="gold">{t.bestSeller}</Badge> : null}
          </div>
        </div>

        {images.length > 1 ? (
          /* A grid that wraps, not a strip that scrolls: every photo is in sight and one tap away. */
          <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-2.5">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={index === activeImage}
                className={cx(
                  "relative aspect-square overflow-hidden rounded-lg border-2 bg-sand-200 transition active:scale-95 sm:rounded-xl",
                  index === activeImage ? "border-coal-900" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image} alt="" fill sizes="(min-width: 1024px) 6rem, 16vw" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        {product.summary ? (
          <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-gold-600 uppercase">
            {product.summary}
          </p>
        ) : null}

        <h1 className="mt-3 text-[2rem] leading-tight sm:text-[2.6rem]">{product.name}</h1>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-3xl font-semibold text-coal-800">
            {hasVariants && !variant
              ? formatPriceRange(product.price, product.priceMax)
              : formatPrice(price)}
          </span>
          {showCompare ? (
            <span className="text-[0.95rem] text-ink-400 line-through">{formatPrice(compareAt)}</span>
          ) : null}
          {discount >= 10 ? (
            <span className="rounded-full bg-coal-900 px-2.5 py-1 text-[0.75rem] font-bold text-gold-500">You save {discount}%</span>
          ) : null}
        </div>

        <p
          className={cx(
            "mt-3 inline-flex items-center gap-1.5 text-[0.8rem] font-medium",
            purchasable ? (lowStock ? "font-semibold text-gold-700" : "text-coal-700") : "text-ink-600",
          )}
        >
          <span
            className={cx(
              "size-1.5 rounded-full",
              purchasable ? (lowStock ? "bg-gold-600" : "bg-coal-600") : "bg-ink-400",
            )}
            aria-hidden
          />
          {purchasable
            ? lowStock
              ? `${lowStockLabel(stock as number)} — order soon`
              : t.inStock
            : t.stockOut}
        </p>

        {hasVariants ? (
          <fieldset className="mt-8">
            <legend className="text-[0.8rem] font-semibold text-ink-900">
              {optionName}
              {variant ? <span className="ml-1.5 font-normal text-ink-500">{variant.label}</span> : null}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectVariant(entry.id)}
                  disabled={!entry.inStock}
                  className={cx(
                    "rounded-full border px-4 py-2 text-[0.8rem] font-medium transition",
                    entry.id === variantId
                      ? "border-coal-800 bg-coal-800 text-sand-50"
                      : "border-sand-300 bg-white text-ink-700 hover:border-coal-500",
                    !entry.inStock && "cursor-not-allowed text-ink-400 line-through opacity-55",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex h-12 items-center rounded-full border border-sand-300 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="grid size-11 place-items-center rounded-full text-ink-600 transition hover:bg-sand-100"
              aria-label="Decrease quantity"
            >
              <MinusIcon className="size-4" />
            </button>
            <span className="w-9 text-center text-[0.9rem] font-semibold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              className="grid size-11 place-items-center rounded-full text-ink-600 transition hover:bg-sand-100"
              aria-label="Increase quantity"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>

          <Button size="lg" onClick={handleAdd} disabled={!purchasable} className="min-w-44 flex-1 sm:flex-none">
            {added ? (
              <>
                <CheckIcon className="size-4" /> {t.addedToBag}
              </>
            ) : (
              <>
                <BagIcon className="size-4" /> {purchasable ? t.addToBag : t.outOfStock}
              </>
            )}
          </Button>
        </div>

        {product.inStock && companions.length ? (
          <BoughtTogether
            self={{ name: variant ? `${product.name} (${variant.label})` : product.name, price, image: variant?.image ?? images[0] ?? null }}
            companions={companions}
            canAddSelf={purchasable}
            onAddSelf={() => addSelf(1)}
          />
        ) : null}

        <ul className="mt-8 grid gap-3 border-y border-sand-200 py-5 sm:grid-cols-2">
          {[
            { Icon: TruckIcon, text: t.freeDeliveryLine },
            { Icon: ShieldIcon, text: t.vettedLine },
          ].map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-[0.8rem] text-ink-600">
              <Icon className="size-4 shrink-0 text-coal-600" />
              {text}
            </li>
          ))}
        </ul>

        {product.descriptionHtml ? (
          <section className="mt-8">
            <h2 className="text-xl">Product details</h2>
            <div
              className="prose-store mt-3 text-[0.9rem]"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </section>
        ) : null}

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-sand-100 p-5 text-[0.8rem]">
          {product.sku ? <Detail label="SKU" value={product.sku} /> : null}
          {product.language ? <Detail label="Language" value={product.language} /> : null}
          {product.ages.length > 0 ? (
            <Detail label="Suitable for" value={product.ages.join(", ")} />
          ) : null}
          {product.variants.length > 0 ? (
            <Detail label={optionName} value={product.variants.map((entry) => entry.label).join(", ")} />
          ) : null}
        </dl>

        {product.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.75rem] text-ink-500">Topics:</span>
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-sand-300 px-2.5 py-0.5 text-[0.7rem] text-ink-600 capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] tracking-[0.14em] text-ink-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-ink-800">{value}</dd>
    </div>
  );
}
