"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleCheckIcon } from "@/components/admin/icons";
import { useCart } from "@/components/cart-provider";
import { ArrowRightIcon, CheckIcon, ShieldIcon, WhatsappIcon } from "@/components/icons";
import { ButtonLink, EmptyState, buttonClass, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { site, whatsappLink } from "@/lib/site";

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

type Line = { name: string; variantLabel: string | null; price: number; quantity: number };

export function CheckoutForm() {
  const { items, subtotal, count, clear } = useCart();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ ref: string | null; message: string } | null>(null);

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

  const buildMessage = (ref: string | null, lines: Line[], total: number) => {
    const units = lines.reduce((n, line) => n + line.quantity, 0);
    const lineText = [
      `As-salamu alaykum ${site.name}, I would like to place an order.`,
      ...(ref ? ["", `*Order ref:* ${ref}`] : []),
      "",
      "*ORDER*",
      ...lines.map(
        (line) =>
          `• ${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ""} × ${line.quantity} — ${formatPrice(
            line.price * line.quantity,
          )}`,
      ),
      "",
      `*Subtotal:* ${formatPrice(total)} (${units} ${units === 1 ? "item" : "items"})`,
      "",
      "*MY DETAILS*",
      `Name: ${fields.name.trim() || "—"}`,
      `Phone: ${fields.phone.trim() || "—"}`,
      ...(fields.email.trim() ? [`Email: ${fields.email.trim()}`] : []),
      fields.fulfilment === "pickup"
        ? "Fulfilment: Pick up in Kaduna (weekend)"
        : `Deliver to: ${fields.address.trim()}, ${fields.city.trim()}, ${fields.state}`,
      ...(fields.notes.trim() ? ["", `*Note:* ${fields.notes.trim()}`] : []),
      "",
      "Please confirm availability and the delivery fee. Jazakum Allahu khayran.",
    ];
    return lineText.join("\n");
  };

  const cartLines: Line[] = items.map(({ name, variantLabel, price, quantity }) => ({ name, variantLabel, price, quantity }));
  const message = buildMessage(placed?.ref ?? null, cartLines, subtotal);

  const placeOrder = async () => {
    setTouched(true);
    setServerError(null);
    if (!isValid || submitting) return;
    setSubmitting(true);
    // Open the tab while we still have the click: browsers block pop-ups opened after an await.
    const tab = window.open("", "_blank");

    let ref: string | null = null;
    let lines = cartLines;
    let total = subtotal;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: fields.name, phone: fields.phone, email: fields.email },
          fulfilment: fields.fulfilment,
          shipping: { state: fields.state, city: fields.city, address: fields.address },
          note: fields.notes,
          items: items.map(({ productId, variantId, slug, variantLabel, quantity }) => ({
            productId,
            variantId,
            slug,
            variantLabel,
            quantity,
          })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ref?: string;
        subtotal?: number;
        items?: Line[];
        error?: string;
      };
      if (response.ok && data.ref) {
        ref = data.ref;
        lines = data.items ?? lines;
        total = data.subtotal ?? total;
      } else if (response.status === 400 || response.status === 409) {
        tab?.close();
        setServerError(data.error ?? "Please check your bag and try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      // Offline or the server is down: still send the order by WhatsApp rather than lose it.
    }

    const text = buildMessage(ref, lines, total);
    const link = whatsappLink(text);
    if (tab) {
      tab.opener = null;
      tab.location.href = link;
    } else {
      window.location.href = link;
    }
    setPlaced({ ref, message: text });
    clear();
    setSubmitting(false);
  };

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(placed?.message ?? message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-sand-200 bg-white p-7 text-center shadow-card sm:p-10">
        <CircleCheckIcon className="mx-auto size-12 text-forest-600" />
        <h2 className="mt-4 text-3xl">{placed.ref ? `Order ${placed.ref} is ready` : "Your order is ready"}</h2>
        <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-600">
          We have opened WhatsApp with your order filled in. <strong>Press send</strong> so it reaches us — we will confirm
          stock and the delivery fee, in shaa Allah.
        </p>
        {placed.ref ? (
          <p className="mt-3 text-[0.8rem] text-ink-500">
            Keep your reference <strong className="text-ink-800">{placed.ref}</strong> for pickup or any questions.
          </p>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappLink(placed.message)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "whatsapp", size: "lg" })}
          >
            <WhatsappIcon className="size-4" />
            Open WhatsApp again
          </a>
          <button type="button" onClick={copyOrder} className={buttonClass({ variant: "outline", size: "lg" })}>
            {copied ? "Copied" : "Copy order details"}
          </button>
        </div>
        <Link href="/shop" className="mt-6 inline-block text-[0.8rem] font-medium text-forest-700 hover:text-forest-900">
          Continue shopping →
        </Link>
      </div>
    );
  }

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
          void placeOrder();
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
                {
                  value: "pickup",
                  title: "Pick up in Kaduna",
                  copy: `${site.pickup.days}, ${site.pickup.time}`,
                },
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
              "We confirm stock and tell you the exact delivery and waybill fee.",
              "You pay by transfer, and we dispatch within 24 hours.",
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
          <button
            type="submit"
            disabled={submitting}
            className={cx(buttonClass({ variant: "whatsapp", size: "lg" }), "w-full")}
          >
            <WhatsappIcon className="size-4" />
            {submitting ? "Preparing your order…" : "Send my order on WhatsApp"}
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
          {serverError ? (
            <p role="alert" className="rounded-md bg-berry-500/8 px-3 py-2 text-center text-[0.8rem] font-medium text-berry-600">
              {serverError}
            </p>
          ) : null}
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
