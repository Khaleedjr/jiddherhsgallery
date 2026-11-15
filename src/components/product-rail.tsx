import { ProductCard } from "@/components/product-card";
import { cx } from "@/components/ui";
import type { CardProduct } from "@/lib/types";

/**
 * A short row of products, such as "you may also like". Nothing to swipe:
 * a phone shows the first four, two by two; wide screens show up to four in a row.
 */
export function ProductRail({
  products,
  priority = false,
  className,
}: {
  products: CardProduct[];
  priority?: boolean;
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <div className={cx("grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6", className)}>
      {products.slice(0, 4).map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          priority={priority && index < 2}
          sizes="(min-width: 1024px) 18rem, 46vw"
        />
      ))}
    </div>
  );
}
