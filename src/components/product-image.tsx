import Image from "next/image";
import { cx } from "@/components/ui";
import { StarKhatimIcon } from "@/components/icons";

export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cx(
          "pattern-girih-light flex h-full w-full items-center justify-center bg-sand-200",
          className,
        )}
        role="img"
        aria-label={`${alt} — photo coming soon`}
      >
        <StarKhatimIcon className="size-8 text-gold-400/70" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      /* Next 16 deprecated `priority`; above-the-fold photos load eagerly and first instead. */
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={cx("object-cover", className)}
    />
  );
}
