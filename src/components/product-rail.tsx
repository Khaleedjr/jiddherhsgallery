import { ProductCard } from "@/components/product-card";
import { cx } from "@/components/ui";
import type { CardProduct } from "@/lib/types";

/**
 * Horizontal, snap-scrolling rail on small screens; a plain grid from `md` up.
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
    <div className={cx("relative", className)}>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.slug}
            product={product}
            priority={priority && index < 2}
            className="w-[63vw] shrink-0 snap-start sm:w-[42vw] md:w-auto"
            sizes="(min-width: 1024px) 18rem, (min-width: 768px) 30vw, 63vw"
          />
        ))}
      </div>
    </div>
  );
}
