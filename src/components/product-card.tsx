"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductImage } from "@/components/product-image";
import { BagIcon, CheckIcon, ChevronRightIcon } from "@/components/icons";
import { Badge, cx } from "@/components/ui";
import { discountPercent, formatPrice, formatPriceRange } from "@/lib/format";
import type { CardProduct } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1280px) 20rem, (min-width: 768px) 30vw, 45vw",
  className,
}: {
  product: CardProduct;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const hasOptions = product.hasOptions;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const href = `/products/${product.slug}`;

  const handleAdd = () => {
    add({
      slug: product.slug,
      name: product.name,
      variantLabel: null,
      price: product.price,
      image: product.image,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <article
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-lg border border-sand-200 bg-white transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-sand-300 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-sand-100">
        <div className="absolute inset-0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
          <ProductImage src={product.image ?? undefined} alt={product.name} sizes={sizes} priority={priority} />
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start gap-1.5">
          {!product.inStock ? <Badge tone="sold-out">Sold out</Badge> : null}
          {/* A percentage is only meaningful against a single price, not a range. */}
          {product.inStock && !product.priceMax && discount >= 15 ? (
            <Badge tone="sale">-{discount}%</Badge>
          ) : null}
          {product.inStock && product.collections.includes("new-arrivals") ? (
            <Badge tone="new">New</Badge>
          ) : null}
          {product.inStock && product.collections.includes("best-seller") ? (
            <Badge tone="gold">Best seller</Badge>
          ) : null}
        </div>

        {/* Quick action rail — visible on touch, revealed on hover for pointers. */}
        {product.inStock ? (
          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-100 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            {hasOptions ? (
              <Link
                href={href}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-forest-900/95 text-xs font-semibold text-sand-50 backdrop-blur transition hover:bg-forest-800"
              >
                Choose option
                <ChevronRightIcon className="size-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-forest-900/95 text-xs font-semibold text-sand-50 backdrop-blur transition hover:bg-forest-800"
              >
                {justAdded ? (
                  <>
                    <CheckIcon className="size-3.5" /> Added
                  </>
                ) : (
                  <>
                    <BagIcon className="size-3.5" /> Add to bag
                  </>
                )}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-sans text-[0.9rem] leading-snug font-semibold text-ink-900">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        {product.summary ? (
          <p className="line-clamp-2 text-[0.78rem] leading-relaxed text-ink-500">{product.summary}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-1">
          <span className="text-[0.95rem] font-semibold text-forest-800">
            {formatPriceRange(product.price, product.priceMax)}
          </span>
          {product.compareAtPrice && !product.priceMax ? (
            <span className="text-[0.78rem] text-ink-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
}: {
  products: CardProduct[];
  priorityCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} priority={index < priorityCount} />
      ))}
    </div>
  );
}
