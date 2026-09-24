"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { adminButton, cx, inputClass, selectClass } from "@/components/admin/ui";
import { adjustStockAction, type AdjustState } from "@/lib/admin/actions/inventory";

export type AdjustTarget = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  stock: number | null;
};

const MODES = [
  { value: "add", label: "Add", reason: "restock" },
  { value: "remove", label: "Remove", reason: "damaged" },
  { value: "set", label: "Set count", reason: "correction" },
] as const;

export function StockAdjustButton({ target, compact = false }: { target: AdjustTarget; compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Remount the form on every open so it never shows the last adjustment's result.
  const [opened, setOpened] = useState(0);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpened((n) => n + 1);
          dialog.current?.showModal();
        }}
        className={adminButton({ variant: "secondary", size: "sm" })}
      >
        {compact ? "Adjust" : "Adjust stock"}
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-forest-950/50"
        aria-labelledby={`adj-${target.productId}-${target.variantId ?? "p"}`}
      >
        {opened > 0 ? <AdjustForm key={opened} target={target} close={() => dialog.current?.close()} /> : null}
      </dialog>
    </>
  );
}

function AdjustForm({ target, close }: { target: AdjustTarget; close: () => void }) {
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("add");
  const [reason, setReason] = useState<string>("restock");
  const [state, action, pending] = useActionState<AdjustState, FormData>(adjustStockAction, { ok: false, message: null });
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (state.ok && state.message) {
      const timer = window.setTimeout(close, 900);
      return () => window.clearTimeout(timer);
    }
  }, [state, close]);

  const current = target.stock ?? 0;
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const preview = mode === "add" ? current + n : mode === "remove" ? Math.max(0, current - n) : n;

  return (
        <form action={action} className="p-5">
          <input type="hidden" name="productId" value={target.productId} />
          <input type="hidden" name="variantId" value={target.variantId ?? ""} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={`adj-${target.productId}-${target.variantId ?? "p"}`} className="font-sans text-[0.95rem] font-semibold tracking-normal text-ink-900">
                Adjust stock
              </h2>
              <p className="mt-0.5 text-[0.78rem] text-ink-500">
                {target.name}
                {target.variantLabel ? ` · ${target.variantLabel}` : ""}
              </p>
            </div>
            <button type="button" onClick={close} className="grid size-8 place-items-center rounded-md text-ink-500 hover:bg-sand-100" aria-label="Close">
              <CloseIcon className="size-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-sand-100 p-1" role="radiogroup" aria-label="Type of change">
            {MODES.map((m) => (
              <label
                key={m.value}
                className={cx(
                  "cursor-pointer rounded-md py-1.5 text-center text-[0.78rem] font-semibold transition",
                  mode === m.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => {
                    setMode(m.value);
                    setReason(m.reason);
                  }}
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-semibold text-ink-700">{mode === "set" ? "New count" : "Units"}</span>
              <input
                name="amount"
                type="number"
                min={0}
                inputMode="numeric"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cx(inputClass, "tabular-nums")}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-semibold text-ink-700">Reason</span>
              <select name="reason" value={reason} onChange={(e) => setReason(e.target.value)} className={selectClass}>
                <option value="restock">Restock / delivery</option>
                <option value="return">Customer return</option>
                <option value="correction">Stock count</option>
                <option value="damaged">Damaged / lost</option>
                <option value="initial">Opening stock</option>
              </select>
            </label>
          </div>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[0.74rem] font-semibold text-ink-700">Note (optional)</span>
            <input name="note" maxLength={300} className={inputClass} placeholder="e.g. Supplier delivery, invoice 214" />
          </label>

          <p className="mt-4 rounded-lg bg-sand-50 px-3 py-2 text-[0.8rem] text-ink-600 tabular-nums">
            {target.stock === null ? "Not counted yet" : `${current} in stock`} →{" "}
            <strong className="text-ink-900">{preview}</strong>
          </p>

          {state.message ? (
            <p role="status" className={cx("mt-3 text-[0.78rem] font-semibold", state.ok ? "text-forest-700" : "text-berry-600")}>
              {state.message}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={close} className={adminButton({ variant: "secondary" })}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={adminButton()}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
  );
}
