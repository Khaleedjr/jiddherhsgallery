"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { AlertIcon, UndoIcon } from "@/components/admin/icons";
import { adminButton, cx, inputClass, selectClass } from "@/components/admin/ui";
import { CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { saveDeliveryAction } from "@/lib/admin/actions/delivery";
import { fill } from "@/lib/content/format";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { DEFAULT_DELIVERY, type DeliveryMethod, type DeliverySettings, type DeliveryVars, type DeliveryZone } from "@/lib/shipping";

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

/**
 * The dashboard's delivery settings: free delivery, pickup, and the zones,
 * each a set of states with the delivery options (and prices) customers in
 * those states can choose at checkout.
 */
export function DeliveryEditor({ initial, vars }: { initial: DeliverySettings; vars: DeliveryVars }) {
  const router = useRouter();
  const [draft, setDraft] = useState<DeliverySettings>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const dirty = JSON.stringify(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const zoneOf = useMemo(() => {
    const map = new Map<string, DeliveryZone>();
    for (const zone of draft.zones) for (const state of zone.states) map.set(state, zone);
    return map;
  }, [draft.zones]);
  const uncovered = NIGERIAN_STATES.filter((state) => !zoneOf.has(state));

  const update = (next: Partial<DeliverySettings>) => {
    setDraft((current) => ({ ...current, ...next }));
    setError(null);
  };
  const updateZone = (id: string, change: (zone: DeliveryZone) => DeliveryZone) =>
    update({ zones: draft.zones.map((zone) => (zone.id === id ? change(zone) : zone)) });

  /* A state can only be in one zone: adding it here takes it out of any other. */
  const addState = (zoneId: string, state: string) =>
    update({
      zones: draft.zones.map((zone) =>
        zone.id === zoneId ? { ...zone, states: [...zone.states, state] } : { ...zone, states: zone.states.filter((s) => s !== state) },
      ),
    });

  const addZone = () =>
    update({
      zones: [...draft.zones, { id: newId("zone"), name: "", states: [], methods: [{ id: newId("option"), name: "Waybill to {state}", cost: 0, note: "" }] }],
    });

  const removeZone = (zone: DeliveryZone) => {
    const label = zone.name || "this zone";
    if (!window.confirm(`Delete ${label}? Customers in ${zone.states.length ? zone.states.join(", ") : "its states"} will only be able to pick up.`)) return;
    update({ zones: draft.zones.filter((z) => z.id !== zone.id) });
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveDeliveryAction(draft);
      if (!result.ok) {
        setError(result.error);
        requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      setBaseline(JSON.stringify(draft));
      setNotice("Saved. Checkout uses the new delivery settings now.");
      router.refresh();
    });
  };

  const resetAll = () => {
    if (!window.confirm("Put every delivery setting back to the original fees and zones? Nothing is saved until you press Save.")) return;
    setDraft(DEFAULT_DELIVERY);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Free delivery"
          description="From this order amount, “Free delivery” is offered first, in every zone."
          action={<Switch label="Free delivery" on={draft.freeDelivery.enabled} onChange={(enabled) => update({ freeDelivery: { ...draft.freeDelivery, enabled } })} />}
        >
          <label className="block max-w-xs">
            <span className="mb-1.5 block text-[0.76rem] font-semibold text-ink-700">Free from (₦)</span>
            <MoneyInput
              value={draft.freeDelivery.threshold}
              disabled={!draft.freeDelivery.enabled}
              onChange={(threshold) => update({ freeDelivery: { ...draft.freeDelivery, threshold } })}
            />
          </label>
          <p className="mt-2 text-[0.72rem] text-ink-500">
            {draft.freeDelivery.enabled ? `Orders of ${naira(draft.freeDelivery.threshold)} or more ship free.` : "Off: every order pays its delivery fee."}
          </p>
        </Panel>

        <Panel
          title="Pickup"
          description="Collecting the order in person. It's free, in every state."
          action={<Switch label="Pickup" on={draft.pickup.enabled} onChange={(enabled) => update({ pickup: { ...draft.pickup, enabled } })} />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Name at checkout" value={draft.pickup.name} disabled={!draft.pickup.enabled} onChange={(name) => update({ pickup: { ...draft.pickup, name } })} />
            <TextInput label="Note" value={draft.pickup.note} disabled={!draft.pickup.enabled} onChange={(note) => update({ pickup: { ...draft.pickup, note } })} />
          </div>
          <p className="mt-2 text-[0.72rem] text-ink-500">
            Shows as: {fill(draft.pickup.name, vars)} · {fill(draft.pickup.note, vars) || "no note"}. {"{pickupDays}"} and {"{pickupTime}"} come from Website text → Store details.
          </p>
        </Panel>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Delivery zones</h2>
            <p className="mt-0.5 text-[0.8rem] text-ink-500">
              A zone is a group of states that share the same delivery options. Write {"{state}"} in an option&apos;s name or note to show the customer&apos;s
              state, e.g. “Waybill to {"{state}"}”.
            </p>
          </div>
          <button type="button" onClick={addZone} className={adminButton({ variant: "secondary", size: "sm" })}>
            <PlusIcon className="size-3.5" />
            Add zone
          </button>
        </div>

        {uncovered.length ? (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-100/60 px-3 py-2.5 text-[0.78rem] text-ink-700">
            <AlertIcon className="mt-px size-4 shrink-0 text-gold-700" />
            <span>
              <strong className="font-semibold">No delivery to {uncovered.length === 1 ? "this state" : `these ${uncovered.length} states`}:</strong>{" "}
              {uncovered.join(", ")}. {draft.pickup.enabled ? "Customers there can only pick up." : "Customers there can't order until a zone includes them."}
            </span>
          </p>
        ) : null}

        <div className="mt-4 space-y-4">
          {draft.zones.map((zone, index) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              index={index}
              zoneOf={zoneOf}
              onChange={(change) => updateZone(zone.id, change)}
              onAddState={(state) => addState(zone.id, state)}
              onRemove={() => removeZone(zone)}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-3 z-20 rounded-xl border border-sand-200 bg-white/95 px-4 py-3 shadow-[0_12px_32px_-16px_rgb(20_17_10/0.35)] backdrop-blur">
        {error ? (
          <p ref={errorRef} role="alert" className="mb-2.5 rounded-lg bg-berry-500/8 px-3 py-2 text-[0.8rem] font-medium text-berry-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-[0.78rem] text-ink-500" aria-live="polite">
            {notice ? <span className="font-medium text-coal-700">{notice}</span> : dirty ? <span className="font-medium text-gold-700">Unsaved changes</span> : "These are the delivery settings checkout uses"}
          </p>
          <button type="button" onClick={resetAll} className={adminButton({ variant: "ghost", size: "sm" })}>
            <UndoIcon className="size-3.5" />
            Original settings
          </button>
          <button type="submit" disabled={pending || !dirty} className={adminButton({ size: "sm" })}>
            {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ zone */

function ZoneCard({
  zone,
  index,
  zoneOf,
  onChange,
  onAddState,
  onRemove,
}: {
  zone: DeliveryZone;
  index: number;
  zoneOf: Map<string, DeliveryZone>;
  onChange: (change: (zone: DeliveryZone) => DeliveryZone) => void;
  onAddState: (state: string) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  const others = NIGERIAN_STATES.filter((state) => !zone.states.includes(state));
  const setMethod = (id: string, patch: Partial<DeliveryMethod>) =>
    onChange((z) => ({ ...z, methods: z.methods.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const cheapest = zone.methods.length ? Math.min(...zone.methods.map((m) => m.cost)) : 0;

  return (
    <section className="rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 px-5 py-3.5">
        <label htmlFor={nameId} className="sr-only">
          Zone name
        </label>
        <input
          id={nameId}
          value={zone.name}
          placeholder={`Zone ${index + 1} name, e.g. “South West”`}
          onChange={(event) => onChange((z) => ({ ...z, name: event.target.value }))}
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 font-display text-lg font-semibold text-ink-900 outline-none placeholder:font-sans placeholder:text-[0.85rem] placeholder:font-normal placeholder:text-ink-400 focus:bg-sand-50"
        />
        <span className="text-[0.74rem] text-ink-500 tabular-nums">
          {zone.states.length} {zone.states.length === 1 ? "state" : "states"} · from {naira(cheapest)}
        </span>
        <button type="button" onClick={onRemove} className={adminButton({ variant: "ghost", size: "sm" })} aria-label={`Delete ${zone.name || `zone ${index + 1}`}`}>
          <TrashIcon className="size-3.5" />
          <span className="max-sm:hidden">Delete</span>
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="mb-2 text-[0.76rem] font-semibold text-ink-700">States</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {zone.states.map((state) => (
              <span key={state} className="inline-flex items-center gap-1 rounded-full bg-sand-100 py-1 pr-1 pl-3 text-[0.78rem] font-medium text-ink-800">
                {state}
                <button
                  type="button"
                  onClick={() => onChange((z) => ({ ...z, states: z.states.filter((s) => s !== state) }))}
                  aria-label={`Remove ${state}`}
                  className="grid size-5 place-items-center rounded-full text-ink-500 transition hover:bg-sand-300 hover:text-ink-900"
                >
                  <CloseIcon className="size-3" />
                </button>
              </span>
            ))}
            <select
              value=""
              onChange={(event) => event.target.value && onAddState(event.target.value)}
              aria-label="Add a state to this zone"
              className={cx(selectClass, "h-8 w-auto py-0 text-[0.78rem]")}
            >
              <option value="">Add a state…</option>
              {others.map((state) => {
                const from = zoneOf.get(state);
                return (
                  <option key={state} value={state}>
                    {from ? `${state} (moves from ${from.name || "another zone"})` : state}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.76rem] font-semibold text-ink-700">Delivery options</p>
          <ol className="space-y-2.5">
            {zone.methods.map((method) => (
              <li key={method.id} className="grid gap-2 rounded-lg border border-sand-200 bg-sand-50/60 p-3 sm:grid-cols-[minmax(0,1.1fr)_8.5rem_minmax(0,1.6fr)_auto] sm:items-end">
                <TextInput label="Name" value={method.name} onChange={(name) => setMethod(method.id, { name })} />
                <label className="block">
                  <span className="mb-1 block text-[0.72rem] font-medium text-ink-600">Price (₦)</span>
                  <MoneyInput value={method.cost} onChange={(cost) => setMethod(method.id, { cost })} />
                </label>
                <TextInput label="Note for customers" value={method.note} onChange={(note) => setMethod(method.id, { note })} />
                <button
                  type="button"
                  disabled={zone.methods.length <= 1}
                  onClick={() => onChange((z) => ({ ...z, methods: z.methods.filter((m) => m.id !== method.id) }))}
                  aria-label={`Remove ${method.name || "this option"}`}
                  className="grid size-9 place-items-center justify-self-end rounded-md text-ink-500 transition hover:bg-white hover:text-berry-600 disabled:pointer-events-none disabled:opacity-30"
                >
                  <TrashIcon className="size-4" />
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            disabled={zone.methods.length >= 10}
            onClick={() => onChange((z) => ({ ...z, methods: [...z.methods, { id: newId("option"), name: "", cost: 0, note: "" }] }))}
            className={cx(adminButton({ variant: "secondary", size: "sm" }), "mt-2.5")}
          >
            <PlusIcon className="size-3.5" />
            Add option
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ bits */

function Panel({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-sand-200 px-5 py-3.5">
        <div>
          <h2 className="font-sans text-[0.95rem] font-semibold tracking-normal text-ink-900">{title}</h2>
          <p className="mt-0.5 text-[0.76rem] text-ink-500">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-coal-900" : "bg-sand-300")}
    >
      <span className={cx("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
    </button>
  );
}

function TextInput({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-[0.72rem] font-medium text-ink-600">
        {label}
      </label>
      <input id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </div>
  );
}

function MoneyInput({ value, onChange, disabled }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={50}
      value={Number.isFinite(value) ? value : ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === "" ? Number.NaN : Math.max(0, Math.round(Number(event.target.value))))}
      className={cx(inputClass, "tabular-nums")}
    />
  );
}
