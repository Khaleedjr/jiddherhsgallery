"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ArrowRightIcon, CheckIcon, LockIcon, ShieldIcon, WhatsappIcon } from "@/components/icons";
import { ButtonLink, EmptyState, buttonClass, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { PICKUP_OPTION, deliveryOptions } from "@/lib/shipping";
import { site, whatsappLink } from "@/lib/site";

type Fields = {
  name: string;
  phone: string;
  email: string;
  fulfilment: "delivery" | "pickup";
  state: string;
  city: string;
  address: string;
  option: string;
  notes: string;
};

const EMPTY: Fields = {
  name: "",
  phone: "",
  email: "",
  fulfilment: "delivery",
  state: "",
  city: "",
  address: "",
  option: "",
  notes: "",
};

/**
 * Checkout: details, a shipping option (the same zones and prices as the old
 * WooCommerce store), then payment on Paystack. The server re-prices
 * everything; the totals here are for the customer's eyes. The bag is kept
 * until Paystack confirms payment, so a failed payment loses nothing.
 */
export function CheckoutForm() {
  const { items, subtotal } = useCart();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setFields((current) => ({ ...current, [key]: value }));

  const options = useMemo(
    () => (fields.fulfilment === "delivery" && fields.state ? deliveryOptions(fields.state, subtotal) : []),
    [fields.fulfilment, fields.state, subtotal],
  );
  const noDelivery = fields.fulfilment === "delivery" && Boolean(fields.state) && options.length === 0;

  /* Keep a valid option selected: the cheapest (free, when the bag qualifies) whenever the list changes. */
  useEffect(() => {
    if (options.length && !options.some((option) => option.id === fields.option)) {
      setFields((current) => ({ ...current, option: options[0].id }));
    }
  }, [options, fields.option]);

  const chosen = fields.fulfilment === "pickup" ? PICKUP_OPTION : (options.find((option) => option.id === fields.option) ?? null);
  const total = subtotal + (chosen?.cost ?? 0);

  const errors = useMemo(() => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = "Please tell us your name";
    if (!/^[0-9+\s()-]{7,}$/.test(fields.phone.trim())) next.phone = "Enter a phone number we can reach";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) next.email = "Enter your email: your receipt goes there";
    if (fields.fulfilment === "delivery") {
      if (!fields.state) next.state = "Choose your state";
      else if (!chosen) next.option = noDelivery ? "We don't deliver here yet" : "Choose a delivery option";
      if (!fields.city.trim()) next.city = "Which city or town?";
      if (!fields.address.trim()) next.address = "We need a delivery address";
    }
    return next;
  }, [fields, chosen, noDelivery]);

  const isValid = Object.keys(errors).length === 0 && items.length > 0;

  const pay = async () => {
    setTouched(true);
    setServerError(null);
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: fields.name, phone: fields.phone, email: fields.email },
          fulfilment: fields.fulfilment,
          shipping: { state: fields.state, city: fields.city, address: fields.address, option: fields.option },
          note: fields.notes,
          items: items.map(({ productId, variantId, slug, variantLabel, quantity }) => ({ productId, variantId, slug, variantLabel, quantity })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { authorizationUrl?: string; error?: string };
      if (response.ok && data.authorizationUrl) {
        // Off to Paystack. The bag stays until the payment is confirmed.
        window.location.assign(data.authorizationUrl);
        return;
      }
      setServerError(data.error ?? "We couldn't start your payment. Please try again.");
    } catch {
      setServerError("You seem to be offline. Check your connection and try again.");
    }
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="There is nothing to check out"
        description="Add a few items to your bag and come back — we will be here, in shaa Allah."
        action={
          <ButtonLink href="/shop" size="lg">
            Browse the shop
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <form
        className="space-y-9"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void pay();
        }}
      >
        <section>
          <h2 className="text-2xl">Your details</h2>
          <p className="mt-1.5 text-[0.85rem] text-ink-500">We use these only to confirm, deliver and send your receipt.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={fields.name} onChange={(v) => set("name", v)} error={touched ? errors.name : undefined} autoComplete="name" required />
            <Field
              label="Phone (WhatsApp)"
              value={fields.phone}
              onChange={(v) => set("phone", v)}
              error={touched ? errors.phone : undefined}
              type="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              required
            />
            <Field
              label="Email"
              value={fields.email}
              onChange={(v) => set("email", v)}
              error={touched ? errors.email : undefined}
              type="email"
              autoComplete="email"
              placeholder="For your Paystack receipt"
              className="sm:col-span-2"
              required
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Delivery</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "delivery", title: "Deliver to me", copy: "Doorstep in Kaduna, or a park in your state" },
                { value: "pickup", title: PICKUP_OPTION.name, copy: `Free · ${PICKUP_OPTION.note}` },
              ] as const
            ).map((option) => (
              <Choice
                key={option.value}
                name="fulfilment"
                checked={fields.fulfilment === option.value}
                onSelect={() => set("fulfilment", option.value)}
                title={option.title}
                copy={option.copy}
              />
            ))}
          </div>

          {fields.fulfilment === "delivery" ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SelectField
                label="State"
                value={fields.state}
                onChange={(v) => set("state", v)}
                options={NIGERIAN_STATES}
                error={touched ? errors.state : undefined}
                className="sm:col-span-2"
              />

              {options.length ? (
                <fieldset className="sm:col-span-2">
                  <legend className="mb-2 block text-[0.8rem] font-semibold text-ink-700">Delivery option</legend>
                  <div className="grid gap-2.5">
                    {options.map((option) => (
                      <Choice
                        key={option.id}
                        name="shipping-option"
                        checked={fields.option === option.id}
                        onSelect={() => set("option", option.id)}
                        title={option.name}
                        copy={option.note}
                        price={option.cost ? formatPrice(option.cost) : "Free"}
                      />
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {noDelivery ? (
                <div className="rounded-[1.25rem] bg-sand-200 p-4 text-[0.88rem] leading-relaxed text-ink-700 sm:col-span-2" role="status">
                  We don&apos;t deliver to {fields.state} yet. You can{" "}
                  <button type="button" onClick={() => set("fulfilment", "pickup")} className="font-semibold text-ink-900 underline underline-offset-4">
                    pick up in Kaduna
                  </button>{" "}
                  instead, or{" "}
                  <a
                    href={whatsappLink(`As-salamu alaykum ${site.name}, can you deliver to ${fields.state}?`)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-ink-900 underline underline-offset-4"
                  >
                    ask us on WhatsApp
                  </a>
                  .
                </div>
              ) : null}

              <Field label="City / town" value={fields.city} onChange={(v) => set("city", v)} error={touched ? errors.city : undefined} autoComplete="address-level2" required />
              <Field
                label="Delivery address"
                value={fields.address}
                onChange={(v) => set("address", v)}
                error={touched ? errors.address : undefined}
                autoComplete="street-address"
                required
              />
            </div>
          ) : null}

          <Field
            label="Anything else we should know? (optional)"
            value={fields.notes}
            onChange={(v) => set("notes", v)}
            className="mt-4"
            multiline
            placeholder="Preferred park or bus stop, landmark, gift wrapping…"
          />
        </section>

        <section className="rounded-[1.25rem] bg-sand-200 p-5">
          <h3 className="flex items-center gap-2 font-sans text-[0.95rem] font-semibold tracking-normal text-ink-900">
            <ShieldIcon className="size-4" />
            How payment works
          </h3>
          <ol className="mt-3 space-y-2 text-[0.85rem] leading-relaxed text-ink-700">
            {[
              "You pay on Paystack's secure page: card, bank transfer or USSD.",
              "Your order is confirmed the moment payment goes through, and your receipt is emailed.",
              `We dispatch within ${site.delivery.dispatchHours} hours; interstate parcels leave on ${site.delivery.interstateDays}.`,
            ].map((step, index) => (
              <li key={step} className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-coal-900 text-[0.65rem] font-bold text-gold-500">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-3">
          <button type="submit" disabled={submitting} className={cx(buttonClass({ size: "lg" }), "w-full")}>
            <LockIcon className="size-4" />
            {submitting ? "Opening Paystack…" : `Pay ${formatPrice(total)} with Paystack`}
          </button>
          <p className="text-center text-[0.78rem] text-ink-500">You&apos;ll be taken to Paystack to pay. We never see or store your card details.</p>
          {serverError ? (
            <p role="alert" className="rounded-xl bg-berry-500/8 px-3 py-2.5 text-center text-[0.82rem] font-medium text-berry-600">
              {serverError}
            </p>
          ) : null}
          {touched && !isValid ? <p className="text-center text-[0.8rem] text-berry-600">Please complete the highlighted fields above.</p> : null}
        </div>
      </form>

      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <div className="rounded-[1.5rem] bg-sand-50 p-6 ring-1 ring-ink-900/10">
          <h2 className="text-2xl">Your order</h2>
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3">
                <div className="relative shrink-0">
                  <Link href={`/products/${item.slug}`} className="relative block size-14 overflow-hidden rounded-xl bg-sand-200">
                    {item.image ? <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" /> : <span className="pattern-girih-light block size-full" />}
                  </Link>
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-coal-900 text-[0.62rem] font-bold text-gold-500">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.82rem] leading-snug font-medium text-ink-900">{item.name}</p>
                  {item.variantLabel ? <p className="mt-0.5 text-[0.72rem] text-ink-500">{item.variantLabel}</p> : null}
                </div>
                <span className="shrink-0 text-[0.82rem] font-semibold text-ink-900 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-ink-900/10 pt-5 text-[0.88rem]">
            <div className="flex justify-between">
              <span className="text-ink-600">Subtotal</span>
              <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-600">{chosen ? chosen.name : "Delivery"}</span>
              <span className="text-right tabular-nums">
                {chosen ? (chosen.cost ? formatPrice(chosen.cost) : "Free") : <span className="text-ink-500">Choose your state</span>}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-2">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="font-display text-2xl font-bold text-ink-900 tabular-nums">{formatPrice(total)}</span>
            </div>
            {subtotal < site.freeDeliveryThreshold ? (
              <p className="pt-1 text-[0.75rem] text-ink-500">Free delivery from {formatPrice(site.freeDeliveryThreshold)}.</p>
            ) : null}
          </div>

          <Link href="/cart" className="mt-4 block text-center text-[0.8rem] font-medium text-ink-500 transition hover:text-ink-900">
            Edit bag
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Choice({
  name,
  checked,
  onSelect,
  title,
  copy,
  price,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  copy: string;
  price?: string;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-start gap-3 rounded-[1.25rem] border-[1.5px] p-4 transition",
        checked ? "border-coal-900 bg-sand-100" : "border-ink-900/15 bg-sand-50 hover:border-ink-900/40",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={cx("mt-0.5 grid size-[1.1rem] shrink-0 place-items-center rounded-full border-[1.5px] transition", checked ? "border-coal-900 bg-coal-900 text-gold-500" : "border-ink-900/30")}
      >
        {checked ? <CheckIcon className="size-2.5" strokeWidth={3.5} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[0.92rem] font-semibold text-ink-900">{title}</span>
          {price ? <span className="shrink-0 text-[0.92rem] font-bold text-ink-900 tabular-nums">{price}</span> : null}
        </span>
        <span className="mt-1 block text-[0.8rem] leading-snug text-ink-500">{copy}</span>
      </span>
    </label>
  );
}

const inputBase = "w-full rounded-xl border bg-sand-50 px-3.5 py-3 text-base text-ink-900 outline-none transition placeholder:text-ink-400 sm:text-[0.92rem]";

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  className,
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const inputClass = cx(inputBase, error ? "border-berry-500" : "border-ink-900/20 focus:border-coal-900");
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-700">
        {label}
        {required ? <span className="text-berry-500"> *</span> : null}
      </span>
      {multiline ? (
        <textarea rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={cx(inputClass, "resize-y")} />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
      {error ? <span className="mt-1 block text-[0.75rem] text-berry-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[0.8rem] font-semibold text-ink-700">
        {label}
        <span className="text-berry-500"> *</span>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cx(inputBase, error ? "border-berry-500" : "border-ink-900/20 focus:border-coal-900", !value && "text-ink-400")}
      >
        <option value="">Select your state</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-[0.75rem] text-berry-600">{error}</span> : null}
    </label>
  );
}
