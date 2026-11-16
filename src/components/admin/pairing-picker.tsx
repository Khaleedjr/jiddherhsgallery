"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/admin/icons";
import { cx, inputClass } from "@/components/admin/ui";
import { CloseIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { MAX_PAIRED, type ProductPairing } from "@/lib/types";

/** One product as the picker lists it. */
export type PickerProduct = { id: string; name: string; price: number; image: string | null; available: boolean };

const MODES: Array<{ value: ProductPairing["mode"]; label: string }> = [
  { value: "auto", label: "Automatic" },
  { value: "manual", label: "Choose them" },
  { value: "off", label: "Don't show" },
];

const normalise = (value: string) => value.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, " ").trim();

/**
 * The product editor's "Featured together" setting: leave the box to pick
 * its own companions, hand-pick them (up to MAX_PAIRED, in order), or hide it
 * on this product.
 */
export function PairingPicker({
  value,
  onChange,
  catalogue,
  selfId,
  automatic,
}: {
  value: ProductPairing;
  onChange: (value: ProductPairing) => void;
  catalogue: PickerProduct[];
  selfId: string | null;
  /** What Automatic picks right now, by name; null for a product not saved yet. */
  automatic: string[] | null;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(catalogue.map((p) => [p.id, p])), [catalogue]);
  const chosen = value.ids.map((id) => byId.get(id)).filter((p): p is PickerProduct => Boolean(p));
  const full = chosen.length >= MAX_PAIRED;

  const results = useMemo(() => {
    const words = normalise(query).split(" ").filter(Boolean);
    if (!words.length) return [];
    return catalogue
      .filter((p) => p.id !== selfId && !value.ids.includes(p.id) && words.every((w) => normalise(p.name).includes(w)))
      .slice(0, 6);
  }, [catalogue, query, selfId, value.ids]);

  const setIds = (ids: string[]) => onChange({ ...value, ids });
  const move = (index: number, by: number) => {
    const ids = [...value.ids];
    const [id] = ids.splice(index, 1);
    ids.splice(index + by, 0, id);
    setIds(ids);
  };

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="How the box picks its products" className="grid grid-cols-3 gap-1 rounded-lg bg-sand-100 p-1">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={value.mode === mode.value}
            onClick={() => onChange({ ...value, mode: mode.value })}
            className={cx(
              "rounded-md px-2 py-1.5 text-[0.78rem] font-semibold transition",
              value.mode === mode.value ? "bg-white text-ink-900 shadow-[0_1px_2px_rgb(20_17_10/0.12)]" : "text-ink-500 hover:text-ink-900",
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {value.mode === "auto" ? (
        <p className="text-[0.8rem] leading-relaxed text-ink-600">
          The store picks things that go with it: products customers bought together first, then items from matching shelves for the same age.
          {automatic === null ? (
            " You'll see its picks once the product is saved."
          ) : automatic.length ? (
            <>
              {" "}
              Right now it shows <strong className="font-semibold text-ink-900">{automatic.join(" + ")}</strong>.
            </>
          ) : (
            " Right now it finds nothing to pair, so the box doesn't show."
          )}
        </p>
      ) : null}

      {value.mode === "off" ? <p className="text-[0.8rem] text-ink-600">The “Featured together” box won&apos;t show on this product.</p> : null}

      {value.mode === "manual" ? (
        <div className="space-y-3">
          {chosen.length ? (
            <ol className="space-y-2">
              {chosen.map((p, index) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-sand-200 bg-sand-50/60 p-2 pr-1.5">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-sand-200">
                    {p.image ? <Image src={p.image} alt="" fill sizes="40px" className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[0.82rem] font-medium text-ink-900">{p.name}</span>
                    <span className="text-[0.72rem] text-ink-500">
                      {formatPrice(p.price)}
                      {p.available ? "" : " · hidden while sold out or unpublished"}
                    </span>
                  </span>
                  <SmallButton label={`Move ${p.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUpIcon className="size-3.5" />
                  </SmallButton>
                  <SmallButton label={`Move ${p.name} down`} disabled={index === chosen.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDownIcon className="size-3.5" />
                  </SmallButton>
                  <SmallButton label={`Remove ${p.name}`} onClick={() => setIds(value.ids.filter((id) => id !== p.id))}>
                    <CloseIcon className="size-3.5" />
                  </SmallButton>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-dashed border-sand-300 px-3 py-3 text-center text-[0.78rem] text-ink-500">
              No products chosen yet. Search below to add up to {MAX_PAIRED}.
            </p>
          )}

          <div>
            <label htmlFor={searchId} className="mb-1.5 block text-[0.76rem] font-semibold text-ink-700">
              {full ? `That's the most it can show (${MAX_PAIRED})` : "Add a product"}
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
              <input
                id={searchId}
                type="search"
                value={query}
                disabled={full}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, e.g. prayer mat"
                className={cx(inputClass, "pl-9")}
                autoComplete="off"
              />
            </div>
            {results.length ? (
              <ul className="mt-1.5 overflow-hidden rounded-lg border border-sand-200 bg-white">
                {results.map((p) => (
                  <li key={p.id} className="border-b border-sand-100 last:border-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIds([...value.ids, p.id]);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-sand-50"
                    >
                      <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-sand-200">
                        {p.image ? <Image src={p.image} alt="" fill sizes="32px" className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-[0.8rem] text-ink-900">{p.name}</span>
                        <span className="text-[0.7rem] text-ink-500">
                          {formatPrice(p.price)}
                          {p.available ? "" : " · sold out or unpublished"}
                        </span>
                      </span>
                      <PlusIcon className="size-4 shrink-0 text-ink-500" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <p className="mt-1.5 text-[0.74rem] text-ink-500">No products match “{query.trim()}”.</p>
            ) : null}
            <p className="mt-2 text-[0.72rem] leading-relaxed text-ink-500">
              They show in this order. Anything sold out or unpublished is left out until it&apos;s back. Items with colours or sizes come with their options.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SmallButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-md text-ink-500 transition hover:bg-white hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
