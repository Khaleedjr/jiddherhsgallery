"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductImage } from "@/components/product-image";
import { BagIcon, CheckIcon, ChevronRightIcon } from "@/components/icons";
import { Badge, cx } from "@/components/ui";
import { discountPercent, formatPrice, formatPriceRange, isLowStock, lowStockLabel } from "@/lib/format";
import type { CardProduct } from "@/lib/types";

/**
 * Design 4's product card: a rounded photo tile on cream, a round black
 * button in its corner to add to the bag (or to choose an option), then the
 * name and price. The whole card opens the product; the button sits above that link.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1280px) 18rem, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 46vw",
  className,
}: {
  product: CardProduct;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const discount = discountPercent(product.price, product.compareAtPrice);
  const href = `/products/${product.slug}`;

  const handleAdd = () => {
    add({
      productId: product.id,
      variantId: null,
      slug: product.slug,
      name: product.name,
      variantLabel: null,
      price: product.price,
      image: product.image,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const action = "relative z-10 grid size-11 place-items-center rounded-full bg-coal-900 text-gold-500 shadow-[0_8px_18px_-10px_rgba(20,17,10,0.8)] transition duration-200 hover:bg-black active:scale-90";

  return (
    <article className={cx("group relative flex flex-col", className)}>
      <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-sand-200">
        <div className="absolute inset-0 transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
          <ProductImage src={product.image ?? undefined} alt={product.name} sizes={sizes} priority={priority} />
        </div>

        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex flex-wrap items-start gap-1.5">
          {!product.inStock ? <Badge tone="sold-out">Sold out</Badge> : null}
          {/* A percentage is only meaningful against a single price, not a range. */}
          {product.inStock && !product.priceMax && discount >= 15 ? <Badge tone="sale">-{discount}%</Badge> : null}
          {product.inStock && product.collections.includes("new-arrivals") ? <Badge tone="new">New</Badge> : null}
          {product.inStock && product.collections.includes("best-seller") ? <Badge tone="gold">Best seller</Badge> : null}
        </div>

        {product.inStock ? (
          <div className="absolute right-2.5 bottom-2.5">
            {product.hasOptions ? (
              <Link href={href} className={action} aria-label={`Choose an option for ${product.name}`}>
                <ChevronRightIcon className="size-4" />
              </Link>
            ) : (
              <button type="button" onClick={handleAdd} className={action} aria-label={justAdded ? `${product.name} added to bag` : `Add ${product.name} to bag`}>
                {justAdded ? <CheckIcon className="size-4" /> : <BagIcon className="size-4" />}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 font-sans text-[0.95rem] leading-snug font-semibold tracking-normal text-ink-900 sm:text-base">
        <Link href={href} className="after:absolute after:inset-0 after:content-['']">
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
        <span className="font-bold text-ink-900">{formatPriceRange(product.price, product.priceMax)}</span>
        {product.compareAtPrice && !product.priceMax ? (
          <span className="text-[0.82rem] text-ink-500 line-through">
            <span className="sr-only">was </span>
            {formatPrice(product.compareAtPrice)}
          </span>
        ) : null}
      </p>
      {isLowStock(product.stock, product.inStock) ? (
        <p className="mt-1 text-[0.75rem] font-semibold text-gold-700">{lowStockLabel(product.stock as number)}</p>
      ) : null}
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
    <div className={cx("grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10", className)}>
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} priority={index < priorityCount} />
      ))}
    </div>
  );
}
