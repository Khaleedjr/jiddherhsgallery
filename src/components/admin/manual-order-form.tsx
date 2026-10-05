"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertIcon, SearchIcon } from "@/components/admin/icons";
import { Field, Thumb, adminButton, cx, inputClass, selectClass } from "@/components/admin/ui";
import { CloseIcon } from "@/components/icons";
import { createManualOrderAction, type ManualOrderInput } from "@/lib/admin/actions/orders";
import { CHANNEL_LABEL, PAYMENT_LABEL, STATUS_META } from "@/lib/admin/format";
import { formatPrice } from "@/lib/format";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { ORDER_STATUSES, PAYMENT_METHODS, type OrderChannel, type OrderStatus, type PaymentMethod } from "@/lib/store/types";

export type PickerProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  stock: number | null;
  inStock: boolean;
  variants: Array<{ id: string; label: string; price: number | null; stock: number | null; inStock: boolean }>;
};

export type KnownCustomer = { key: string; name: string; phone: string; email: string | null; state: string | null; city: string | null };

type Line = { key: string; productId: string; variantId: string | null; quantity: number; price: string };

const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function ManualOrderForm({ products, customers }: { products: PickerProduct[]; customers: KnownCustomer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<OrderChannel>("whatsapp");
  const [status, setStatus] = useState<OrderStatus>("confirmed");
  const [createdAt, setCreatedAt] = useState(localNow);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [shipping, setShipping] = useState({ state: "", city: "", address: "" });
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("transfer");
  const [note, setNote] = useState("");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return [];
    return products.filter((p) => p.name.toLowerCase().includes(term) || p.id === term).slice(0, 8);
  }, [products, search]);

  const unitPrice = (line: Line) => {
    const product = byId.get(line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return variant?.price ?? product?.price ?? 0;
  };
  const priceOf = (line: Line) => {
    const typed = Number(line.price.replace(/[,\s]/g, ""));
    return line.price.trim() !== "" && Number.isFinite(typed) ? typed : unitPrice(line);
  };
  const subtotal = lines.reduce((n, line) => n + priceOf(line) * line.quantity, 0);
  const fee = Number(deliveryFee.replace(/[,\s]/g, "")) || 0;
  const off = Number(discount.replace(/[,\s]/g, "")) || 0;
  const total = Math.max(0, subtotal + fee - off);

  const add = (product: PickerProduct) => {
    const variant = product.variants.find((v) => v.inStock) ?? product.variants[0] ?? null;
    setLines((current) => [...current, { key: `${product.id}-${Date.now()}`, productId: product.id, variantId: variant?.id ?? null, quantity: 1, price: "" }]);
    setSearch("");
  };
  const update = (key: string, patch: Partial<Line>) => setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const fillCustomer = (key: string) => {
    const known = customers.find((c) => c.key === key);
    if (!known) return;
    setCustomer({ name: known.name, phone: known.phone, email: known.email ?? "" });
    if (known.state) {
      setFulfilment("delivery");
      setShipping((s) => ({ ...s, state: known.state ?? "", city: known.city ?? "" }));
    }
  };

  const submit = () => {
    setError(null);
    if (!lines.length) return setError("Add at least one product.");
    const payload: ManualOrderInput = {
      channel,
      status,
      createdAt: createdAt ? new Date(createdAt).toISOString() : null,
      customer,
      fulfilment,
      shipping,
      items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, price: l.price.trim() ? priceOf(l) : null })),
      deliveryFee: fee,
      discount: off,
      paymentMethod: paymentMethod || null,
      note,
    };
    startTransition(async () => {
      const result = await createManualOrderAction(payload);
      if (result.ok) router.push(`/admin/orders/${result.ref}`);
      else setError(result.error);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]"
    >
      <div className="min-w-0 space-y-6">
        <Block title="Products">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add…"
              className={cx(inputClass, "pl-9")}
              aria-label="Search products"
              autoComplete="off"
            />
            {results.length ? (
              <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-80 overflow-auto rounded-lg border border-sand-200 bg-white py-1 shadow-lift">
                {results.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => add(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-sand-50">
                      <Thumb src={p.image} alt="" size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.82rem] font-medium text-ink-900">{p.name}</span>
                        <span className="block text-[0.72rem] text-ink-500">
                          {formatPrice(p.price)}
                          {p.variants.length ? ` · ${p.variants.length} options` : ""}
                          {!p.inStock ? " · out of stock" : p.stock !== null ? ` · ${p.stock} in stock` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : search.trim().length >= 2 ? (
              <p className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 text-[0.78rem] text-ink-500 shadow-lift">
                No products match.
              </p>
            ) : null}
          </div>

          {lines.length ? (
            <ul className="mt-4 divide-y divide-sand-200/80 border-t border-sand-200">
              {lines.map((line) => {
                const product = byId.get(line.productId)!;
                return (
                  <li key={line.key} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 py-3 sm:grid-cols-[auto_1fr_auto_auto_auto_auto] sm:items-center">
                    <Thumb src={product.image} alt="" size={40} />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[0.82rem] font-medium text-ink-900">{product.name}</p>
                      {product.variants.length ? (
                        <select
                          value={line.variantId ?? ""}
                          onChange={(e) => update(line.key, { variantId: e.target.value, price: "" })}
                          className={cx(selectClass, "mt-1 h-8 py-1 text-[0.76rem]")}
                          aria-label="Option"
                        >
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                              {!v.inStock ? " (out of stock)" : ""}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLines((c) => c.filter((l) => l.key !== line.key))}
                      className="grid size-8 place-items-center rounded-md text-ink-400 hover:bg-berry-500/8 hover:text-berry-600 sm:order-last"
                      aria-label={`Remove ${product.name}`}
                    >
                      <CloseIcon className="size-4" />
                    </button>
                    <label className="col-span-3 flex items-center gap-2 sm:col-span-1">
                      <span className="text-[0.7rem] font-semibold text-ink-500 sm:sr-only">Qty</span>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => update(line.key, { quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                        className={cx(inputClass, "h-8 w-16 py-1 tabular-nums")}
                        aria-label="Quantity"
                      />
                    </label>
                    <label className="col-span-2 flex items-center gap-2 sm:col-span-1">
                      <span className="text-[0.7rem] font-semibold text-ink-500">₦</span>
                      <input
                        inputMode="numeric"
                        value={line.price}
                        placeholder={String(unitPrice(line))}
                        onChange={(e) => update(line.key, { price: e.target.value.replace(/[^\d,]/g, "") })}
                        className={cx(inputClass, "h-8 w-24 py-1 tabular-nums")}
                        aria-label="Unit price"
                        title="Leave empty to use the catalogue price"
                      />
                    </label>
                    <span className="text-right text-[0.84rem] font-semibold text-ink-900 tabular-nums">{formatPrice(priceOf(line) * line.quantity)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-sand-300 px-4 py-6 text-center text-[0.8rem] text-ink-500">
              Search above to add what the customer ordered.
            </p>
          )}
        </Block>

        <Block title="Customer">
          {customers.length ? (
            <select defaultValue="" onChange={(e) => fillCustomer(e.target.value)} className={cx(selectClass, "mb-4")} aria-label="Returning customer">
              <option value="">Returning customer? Pick to fill in…</option>
              {customers.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </select>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="mo-name">
              <input id="mo-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={inputClass} required />
            </Field>
            <Field label="Phone" htmlFor="mo-phone">
              <input id="mo-phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={inputClass} required inputMode="tel" />
            </Field>
            <Field label="Email (optional)" htmlFor="mo-email" className="sm:col-span-2">
              <input id="mo-email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["delivery", "pickup"] as const).map((f) => (
              <label key={f} className={cx("cursor-pointer rounded-lg border px-3 py-2.5 text-[0.8rem] font-semibold transition", fulfilment === f ? "border-forest-600 bg-forest-50 text-forest-800" : "border-sand-300 text-ink-700")}>
                <input type="radio" name="fulfilment" className="sr-only" checked={fulfilment === f} onChange={() => setFulfilment(f)} />
                {f === "delivery" ? "Delivery" : "Pickup in Kaduna"}
              </label>
            ))}
          </div>
          {fulfilment === "delivery" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="State" htmlFor="mo-state">
                <select id="mo-state" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} className={selectClass}>
                  <option value="">Choose…</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="City / town" htmlFor="mo-city">
                <input id="mo-city" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Address" htmlFor="mo-address" className="sm:col-span-2">
                <input id="mo-address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} className={inputClass} />
              </Field>
            </div>
          ) : null}
        </Block>
      </div>

      <div className="min-w-0 space-y-6 lg:sticky lg:top-6">
        <Block title="Order">
          <div className="space-y-4">
            <Field label="Came in through" htmlFor="mo-channel">
              <select id="mo-channel" value={channel} onChange={(e) => setChannel(e.target.value as OrderChannel)} className={selectClass}>
                {(["whatsapp", "instagram", "walk-in", "other"] as const).map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="mo-status" hint={status === "pending" || status === "cancelled" ? "Stock is not taken out yet." : "Stock is taken out when you save."}>
              <select id="mo-status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={selectClass}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Order date" htmlFor="mo-date">
              <input id="mo-date" type="datetime-local" value={createdAt} max={localNow()} onChange={(e) => setCreatedAt(e.target.value)} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Delivery ₦" htmlFor="mo-fee">
                <input id="mo-fee" inputMode="numeric" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value.replace(/[^\d,]/g, ""))} placeholder="0" className={cx(inputClass, "tabular-nums")} />
              </Field>
              <Field label="Discount ₦" htmlFor="mo-discount">
                <input id="mo-discount" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^\d,]/g, ""))} placeholder="0" className={cx(inputClass, "tabular-nums")} />
              </Field>
            </div>
            <Field label="Paid by" htmlFor="mo-pay">
              <select id="mo-pay" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")} className={selectClass}>
                <option value="">Not recorded</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Note (optional)" htmlFor="mo-note">
              <textarea id="mo-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={cx(inputClass, "resize-y")} />
            </Field>
          </div>

          <dl className="mt-5 space-y-1.5 border-t border-sand-200 pt-4 text-[0.82rem]">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="tabular-nums">{formatPrice(fee)}</dd>
            </div>
            {off ? (
              <div className="flex justify-between text-forest-700">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatPrice(off)}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between pt-1.5">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-semibold text-forest-900 tabular-nums">{formatPrice(total)}</dd>
            </div>
          </dl>

          {error ? (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-berry-500/8 px-3 py-2 text-[0.78rem] font-medium text-berry-600">
              <AlertIcon className="mt-px size-4 shrink-0" />
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={cx(adminButton(), "mt-4 w-full")}>
            {pending ? "Saving…" : "Save order"}
          </button>
        </Block>
      </div>
    </form>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
      <h2 className="border-b border-sand-200/80 px-5 py-3.5 font-sans text-[0.9rem] font-semibold tracking-normal text-ink-900">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}
