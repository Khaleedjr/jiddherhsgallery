"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ArrowRightIcon, CheckIcon, ShieldIcon, WhatsappIcon } from "@/components/icons";
import { ButtonLink, EmptyState, buttonClass, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

type Fields = {
  name: string;
  phone: string;
  email: string;
  fulfilment: "delivery" | "pickup";
  state: string;
  city: string;
  address: string;
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
  notes: "",
};

export function CheckoutForm() {
  const { items, subtotal, count } = useCart();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const errors = useMemo(() => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = "Please tell us your name";
    if (!/^[0-9+\s()-]{7,}$/.test(fields.phone.trim())) next.phone = "Enter a phone number we can reach";
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = "That email does not look right";
    }
    if (fields.fulfilment === "delivery") {
      if (!fields.state) next.state = "Choose your state";
      if (!fields.city.trim()) next.city = "Which city or town?";
      if (!fields.address.trim()) next.address = "We need a delivery address";
    }
    return next;
  }, [fields]);

  const isValid = Object.keys(errors).length === 0 && items.length > 0;

  const message = useMemo(() => {
    const lines = [
      `As-salamu alaykum ${site.name}, I would like to place an order.`,
      "",
      "*ORDER*",
      ...items.map(
        (item) =>
          `• ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity} — ${formatPrice(
            item.price * item.quantity,
          )}`,
      ),
      "",
      `*Subtotal:* ${formatPrice(subtotal)} (${count} ${count === 1 ? "item" : "items"})`,
      "",
      "*MY DETAILS*",
      `Name: ${fields.name.trim() || "—"}`,
      `Phone: ${fields.phone.trim() || "—"}`,
      ...(fields.email.trim() ? [`Email: ${fields.email.trim()}`] : []),
      fields.fulfilment === "pickup"
        ? "Fulfilment: Pick up from the store"
        : `Deliver to: ${fields.address.trim()}, ${fields.city.trim()}, ${fields.state}`,
      ...(fields.notes.trim() ? ["", `*Note:* ${fields.notes.trim()}`] : []),
      "",
      "Please confirm availability and the delivery fee. Jazakum Allahu khayran.",
    ];
    return lines.join("\n");
  }, [items, subtotal, count, fields]);

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
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
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (isValid) window.open(whatsappLink(message), "_blank", "noopener");
        }}
      >
        <section>
          <h2 className="text-xl">Your details</h2>
          <p className="mt-1.5 text-[0.82rem] text-ink-500">
            We use these only to confirm and deliver your order.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={fields.name}
              onChange={(value) => set("name", value)}
              error={touched ? errors.name : undefined}
              autoComplete="name"
              required
            />
            <Field
              label="Phone (WhatsApp)"
              value={fields.phone}
              onChange={(value) => set("phone", value)}
              error={touched ? errors.phone : undefined}
              type="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              required
            />
            <Field
              label="Email (optional)"
              value={fields.email}
              onChange={(value) => set("email", value)}
              error={touched ? errors.email : undefined}
              type="email"
              autoComplete="email"
              className="sm:col-span-2"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl">How should we get it to you?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "delivery", title: "Deliver to me", copy: "Nationwide courier — fee confirmed on WhatsApp" },
                { value: "pickup", title: "Pick up in store", copy: `Collect from our ${site.address.city} store` },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cx(
                  "cursor-pointer rounded-lg border p-4 transition",
                  fields.fulfilment === option.value
                    ? "border-forest-700 bg-forest-50"
                    : "border-sand-300 bg-white hover:border-sand-400",
                )}
              >
                <input
                  type="radio"
                  name="fulfilment"
                  value={option.value}
                  checked={fields.fulfilment === option.value}
                  onChange={() => set("fulfilment", option.value)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 text-[0.88rem] font-semibold text-forest-900">
                  <span
                    aria-hidden
                    className={cx(
                      "grid size-4 place-items-center rounded-full border transition",
                      fields.fulfilment === option.value
                        ? "border-forest-700 bg-forest-700 text-sand-50"
                        : "border-sand-400",
                    )}
                  >
                    {fields.fulfilment === option.value ? <CheckIcon className="size-2.5" strokeWidth={3} /> : null}
                  </span>
                  {option.title}
                </span>
                <span className="mt-1.5 block pl-6 text-[0.78rem] text-ink-500">{option.copy}</span>
              </label>
            ))}
          </div>

          {fields.fulfilment === "delivery" ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SelectField
                label="State"
                value={fields.state}
                onChange={(value) => set("state", value)}
                options={NIGERIAN_STATES}
                error={touched ? errors.state : undefined}
              />
              <Field
                label="City / town"
                value={fields.city}
                onChange={(value) => set("city", value)}
                error={touched ? errors.city : undefined}
                autoComplete="address-level2"
                required
              />
              <Field
                label="Delivery address"
                value={fields.address}
                onChange={(value) => set("address", value)}
                error={touched ? errors.address : undefined}
                autoComplete="street-address"
                className="sm:col-span-2"
                required
              />
            </div>
          ) : null}

          <Field
            label="Anything else we should know? (optional)"
            value={fields.notes}
            onChange={(value) => set("notes", value)}
            className="mt-4"
            multiline
            placeholder="Gift wrapping, landmark, preferred delivery day…"
          />
        </section>

        <section className="rounded-lg border border-sand-200 bg-sand-100 p-5">
          <h3 className="flex items-center gap-2 text-[0.9rem] font-semibold text-forest-900">
            <ShieldIcon className="size-4" />
            How checkout works
          </h3>
          <ol className="mt-3 space-y-2 text-[0.82rem] leading-relaxed text-ink-600">
            {[
              "Send us your order — it opens in WhatsApp, already filled in.",
              "We confirm stock and tell you the exact delivery fee.",
              "You pay by transfer, and we dispatch the same or next working day.",
            ].map((step, index) => (
              <li key={step} className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-forest-800 text-[0.65rem] font-bold text-sand-50">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-3">
          <button type="submit" className={cx(buttonClass({ variant: "whatsapp", size: "lg" }), "w-full")}>
            <WhatsappIcon className="size-4" />
            Send my order on WhatsApp
          </button>
          <button
            type="button"
            onClick={copyOrder}
            className={cx(buttonClass({ variant: "outline", size: "lg" }), "w-full")}
          >
            {copied ? (
              <>
                <CheckIcon className="size-4" /> Order copied
              </>
            ) : (
              "Copy order details instead"
            )}
          </button>
          {touched && !isValid ? (
            <p className="text-center text-[0.78rem] text-berry-600">
              Please complete the highlighted fields above.
            </p>
          ) : null}
        </div>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="text-xl">Your order</h2>

          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3">
                <div className="relative shrink-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative block size-14 overflow-hidden rounded-md bg-sand-200"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="pattern-girih-light block size-full" />
                    )}
                  </Link>
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-forest-800 text-[0.62rem] font-bold text-sand-50">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.8rem] leading-snug font-medium text-ink-900">
                    {item.name}
                  </p>
                  {item.variantLabel ? (
                    <p className="mt-0.5 text-[0.7rem] text-ink-500">{item.variantLabel}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[0.8rem] font-semibold text-forest-800">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-sand-200 pt-5 text-[0.85rem]">
            <div className="flex justify-between">
              <span className="text-ink-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">Delivery</span>
              <span className="text-ink-500">Confirmed on WhatsApp</span>
            </div>
            <div className="flex items-baseline justify-between pt-2">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="font-display text-2xl font-semibold text-forest-900">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          <Link
            href="/cart"
            className="mt-4 block text-center text-[0.78rem] font-medium text-ink-500 transition hover:text-forest-800"
          >
            Edit bag
          </Link>
        </div>
      </aside>
    </div>
  );
}

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
  const inputClass = cx(
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-[0.88rem] text-ink-900 outline-none transition placeholder:text-ink-400",
    error ? "border-berry-500" : "border-sand-300 focus:border-forest-500",
  );

  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[0.78rem] font-medium text-ink-700">
        {label}
        {required ? <span className="text-berry-500"> *</span> : null}
      </span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cx(inputClass, "resize-y")}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
      {error ? <span className="mt-1 block text-[0.72rem] text-berry-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.78rem] font-medium text-ink-700">
        {label}
        <span className="text-berry-500"> *</span>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          "w-full rounded-md border bg-white px-3 py-2.5 text-[0.88rem] text-ink-900 outline-none transition",
          error ? "border-berry-500" : "border-sand-300 focus:border-forest-500",
          !value && "text-ink-400",
        )}
      >
        <option value="">Select a state</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-[0.72rem] text-berry-600">{error}</span> : null}
    </label>
  );
}
