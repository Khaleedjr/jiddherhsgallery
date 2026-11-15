"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ArrowRightIcon, MinusIcon, PlusIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { ButtonLink, EmptyState, buttonClass, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function CartPageBody() {
  const { items, setQuantity, remove, subtotal, clear, count } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Nothing here yet. Browse the shelves and add something beneficial, in shaa Allah."
        action={
          <ButtonLink href="/shop" size="lg">
            Start shopping
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        }
      />
    );
  }

  const remaining = site.freeDeliveryThreshold - subtotal;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <div>
        <div className="flex items-baseline justify-between border-b border-sand-200 pb-4">
          <p className="text-[0.85rem] text-ink-600">
            <strong className="font-semibold text-ink-900">{count}</strong> {count === 1 ? "item" : "items"}
          </p>
          <button
            type="button"
            onClick={clear}
            className="text-[0.78rem] font-medium text-ink-500 transition hover:text-berry-500"
          >
            Empty bag
          </button>
        </div>

        <ul className="divide-y divide-sand-200">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5 sm:gap-5">
              <Link
                href={`/products/${item.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-md bg-sand-200 sm:size-28"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                ) : (
                  <span className="pattern-girih-light block size-full" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-[0.92rem] leading-snug font-semibold text-ink-900 transition hover:text-coal-700"
                    >
                      {item.name}
                    </Link>
                    {item.variantLabel ? (
                      <p className="mt-1 text-[0.76rem] text-ink-500">{item.variantLabel}</p>
                    ) : null}
                    <p className="mt-1.5 text-[0.85rem] text-ink-600">{formatPrice(item.price)} each</p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-semibold text-coal-800">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-sand-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      className="grid size-8 place-items-center rounded-full text-ink-600 transition hover:bg-sand-100"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <MinusIcon className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-[0.82rem] font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      className="grid size-8 place-items-center rounded-full text-ink-600 transition hover:bg-sand-100"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.76rem] text-ink-500 transition hover:text-berry-500"
                  >
                    <TrashIcon className="size-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <ButtonLink href="/shop" variant="ghost" size="sm" className="mt-6">
          Continue shopping
        </ButtonLink>
      </div>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="text-xl">Order summary</h2>

          <dl className="mt-5 space-y-3 text-[0.85rem]">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-semibold text-ink-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="text-ink-500">Calculated at checkout</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-sand-200 pt-5">
            <span className="text-[0.85rem] font-semibold text-ink-900">Total</span>
            <span className="font-display text-2xl font-semibold text-coal-900">
              {formatPrice(subtotal)}
            </span>
          </div>

          <ButtonLink href="/checkout" size="lg" className="mt-5 w-full">
            Proceed to checkout
          </ButtonLink>

          <p
            className={cx(
              "mt-4 flex items-start gap-2 rounded-md p-3 text-[0.76rem] leading-relaxed",
              remaining > 0 ? "bg-sand-100 text-ink-600" : "bg-coal-50 text-coal-800",
            )}
          >
            <TruckIcon className="mt-0.5 size-4 shrink-0" />
            {remaining > 0 ? (
              <span>
                Spend {formatPrice(remaining)} more to qualify for free nationwide delivery.
              </span>
            ) : (
              <span>Your order qualifies for free nationwide delivery.</span>
            )}
          </p>
        </div>

        <p className="mt-4 px-1 text-[0.74rem] leading-relaxed text-ink-500">
          We confirm every order personally before payment — no surprises, no hidden charges.
        </p>
      </aside>
    </div>
  );
}

export function CartButtonLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className={buttonClass({ variant: "outline", size: "sm" })}>
      View bag ({count})
    </Link>
  );
}
