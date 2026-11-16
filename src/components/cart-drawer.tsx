"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, StarKhatimIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { Inline } from "@/components/rich-text";
import { useSiteText } from "@/components/site-text-provider";
import { buttonClass, cx } from "@/components/ui";
import { fill } from "@/lib/content/format";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function CartDrawer() {
  const { items, isOpen, closeCart, setQuantity, remove, subtotal, count } = useCart();
  const t = useSiteText().shopping;

  if (!isOpen) return null;

  const remaining = site.freeDeliveryThreshold - subtotal;
  const progress = Math.min(100, Math.round((subtotal / site.freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        type="button"
        onClick={closeCart}
        className="animate-fade absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        aria-label="Close bag"
      />

      <div className="animate-slide-in absolute inset-y-0 right-0 flex w-[min(26rem,100vw)] flex-col bg-sand-50 shadow-2xl">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sand-200 px-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-coal-900">
            <BagIcon className="size-5" />
            {t.bagTitle}
            {count > 0 ? <span className="text-sm font-normal text-ink-500">({count})</span> : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 text-ink-600 transition hover:bg-sand-200"
            aria-label="Close bag"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <StarKhatimIcon className="size-8 text-gold-300" />
            <div>
              <p className="font-display text-xl text-coal-900">{t.bagEmptyTitle}</p>
              <p className="mt-1.5 text-sm text-ink-500">{t.bagEmptyText}</p>
            </div>
            <Link href="/shop" onClick={closeCart} className={buttonClass()}>
              {t.startShopping}
            </Link>
          </div>
        ) : (
          <>
            {remaining > 0 ? (
              <div className="shrink-0 border-b border-sand-200 bg-sand-100 px-5 py-3">
                <p className="flex items-center gap-2 text-[0.78rem] text-ink-700">
                  <TruckIcon className="size-4 shrink-0 text-coal-600" />
                  <span>
                    <Inline text={fill(t.addMore, { amount: formatPrice(remaining) })} strongClassName="font-semibold text-coal-800" />
                  </span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-300">
                  <div
                    className="h-full rounded-full bg-coal-600 transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="flex shrink-0 items-center gap-2 border-b border-sand-200 bg-coal-50 px-5 py-3 text-[0.78rem] font-medium text-coal-800">
                <TruckIcon className="size-4 shrink-0" />
                {t.earnedFree}
              </p>
            )}

            <ul className="flex-1 divide-y divide-sand-200 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3.5 py-4">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative size-20 shrink-0 overflow-hidden rounded-md bg-sand-200"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="pattern-girih-light block size-full" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="text-[0.85rem] leading-snug font-semibold text-ink-900 hover:text-coal-700"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel ? (
                      <span className="mt-0.5 text-[0.72rem] text-ink-500">{item.variantLabel}</span>
                    ) : null}
                    <span className="mt-1 text-[0.82rem] font-semibold text-coal-800">
                      {formatPrice(item.price)}
                    </span>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-sand-300 bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          className="grid size-7 place-items-center rounded-full text-ink-600 transition hover:bg-sand-100"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-7 text-center text-[0.8rem] font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          className="grid size-7 place-items-center rounded-full text-ink-600 transition hover:bg-sand-100"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.key)}
                        className="rounded-full p-1.5 text-ink-400 transition hover:bg-sand-200 hover:text-berry-500"
                        aria-label={`Remove ${item.name}`}
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="shrink-0 border-t border-sand-200 bg-white px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-600">Subtotal</span>
                <span className="font-display text-2xl font-semibold text-coal-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-[0.72rem] text-ink-500">{t.bagDeliveryNote}</p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className={cx(buttonClass({ size: "lg" }), "mt-4 w-full")}
              >
                {t.checkoutButton}
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 w-full py-2 text-[0.8rem] font-medium text-ink-600 transition hover:text-coal-800"
              >
                {t.continueShopping}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
