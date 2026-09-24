"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { adminButton, cx, inputClass, selectClass } from "@/components/admin/ui";
import {
  addNoteAction,
  setStatusAction,
  updateChargesAction,
  updateCustomerAction,
  type ActionResult,
} from "@/lib/admin/actions/orders";
import { PAYMENT_LABEL, STATUS_META } from "@/lib/admin/format";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { ORDER_STATUSES, PAYMENT_METHODS, type Order, type OrderStatus } from "@/lib/store/types";

const initial: ActionResult = { ok: false, message: null };

function Result({ state }: { state: ActionResult }) {
  if (!state.message) return null;
  return (
    <p role="status" className={cx("text-[0.76rem] font-semibold", state.ok ? "text-forest-700" : "text-berry-600")}>
      {state.ok ? "✓ " : ""}
      {state.message}
    </p>
  );
}

const NEXT_STEP: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "confirmed", label: "Confirm — payment received" },
  confirmed: { status: "dispatched", label: "Mark as dispatched" },
  dispatched: { status: "delivered", label: "Mark as delivered" },
};

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(setStatusAction, initial);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const next = NEXT_STEP[order.status];
  useEffect(() => setStatus(order.status), [order.status]);

  return (
    <div className="space-y-4">
      {next ? (
        <form action={action}>
          <input type="hidden" name="ref" value={order.ref} />
          <input type="hidden" name="status" value={next.status} />
          <button type="submit" disabled={pending} className={cx(adminButton(), "w-full")}>
            {pending ? "Updating…" : next.label}
          </button>
        </form>
      ) : null}

      <form action={action} className="space-y-2.5 border-t border-sand-200 pt-4">
        <input type="hidden" name="ref" value={order.ref} />
        <label className="block">
          <span className="mb-1.5 block text-[0.74rem] font-semibold text-ink-700">Change status</span>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={selectClass}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label} — {STATUS_META[s].hint}
              </option>
            ))}
          </select>
        </label>
        <input name="note" maxLength={500} placeholder="Note for the timeline (optional)" className={inputClass} aria-label="Status note" />
        <button type="submit" disabled={pending || status === order.status} className={cx(adminButton({ variant: "secondary" }), "w-full")}>
          Update status
        </button>
        <Result state={state} />
      </form>

      {order.status !== "cancelled" && order.status !== "delivered" ? (
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm(`Cancel ${order.ref}?${order.stockDeducted ? " Its items will go back into stock." : ""}`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="ref" value={order.ref} />
          <input type="hidden" name="status" value="cancelled" />
          <button type="submit" disabled={pending} className={cx(adminButton({ variant: "danger-outline", size: "sm" }), "w-full")}>
            Cancel order
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function NoteForm({ refCode }: { refCode: string }) {
  const [state, action, pending] = useActionState(addNoteAction, initial);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="space-y-2">
      <input type="hidden" name="ref" value={refCode} />
      <textarea name="note" rows={2} maxLength={1000} required placeholder="Add a private note — e.g. waybill number, call outcome…" className={cx(inputClass, "resize-y")} aria-label="Note" />
      <div className="flex items-center justify-between gap-3">
        <Result state={state} />
        <button type="submit" disabled={pending} className={cx(adminButton({ variant: "secondary", size: "sm" }), "ml-auto")}>
          {pending ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}

export function ChargesForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(updateChargesAction, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="ref" value={order.ref} />
      <label className="block">
        <span className="mb-1 block text-[0.72rem] font-semibold text-ink-600">Delivery fee ₦</span>
        <input name="deliveryFee" inputMode="numeric" defaultValue={order.deliveryFee || ""} placeholder="0" className={cx(inputClass, "tabular-nums")} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[0.72rem] font-semibold text-ink-600">Discount ₦</span>
        <input name="discount" inputMode="numeric" defaultValue={order.discount || ""} placeholder="0" className={cx(inputClass, "tabular-nums")} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[0.72rem] font-semibold text-ink-600">Paid by</span>
        <select name="paymentMethod" defaultValue={order.paymentMethod ?? ""} className={selectClass}>
          <option value="">Not recorded</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-3 sm:col-span-3">
        <Result state={state} />
        <button type="submit" disabled={pending} className={cx(adminButton({ variant: "secondary", size: "sm" }), "ml-auto")}>
          {pending ? "Saving…" : "Save charges"}
        </button>
      </div>
    </form>
  );
}

export function CustomerForm({ order, onDone }: { order: Order; onDone?: () => void }) {
  const [state, action, pending] = useActionState(updateCustomerAction, initial);
  const [fulfilment, setFulfilment] = useState(order.fulfilment);
  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ref" value={order.ref} />
      <input name="name" defaultValue={order.customer.name} required placeholder="Name" className={inputClass} aria-label="Customer name" />
      <input name="phone" defaultValue={order.customer.phone} required placeholder="Phone" className={inputClass} aria-label="Phone" />
      <input name="email" type="email" defaultValue={order.customer.email ?? ""} placeholder="Email (optional)" className={inputClass} aria-label="Email" />
      <select name="fulfilment" value={fulfilment} onChange={(e) => setFulfilment(e.target.value as Order["fulfilment"])} className={selectClass} aria-label="Fulfilment">
        <option value="delivery">Delivery</option>
        <option value="pickup">Pickup in Kaduna</option>
      </select>
      {fulfilment === "delivery" ? (
        <>
          <select name="state" defaultValue={order.shipping.state ?? ""} className={selectClass} aria-label="State">
            <option value="">State…</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input name="city" defaultValue={order.shipping.city ?? ""} placeholder="City / town" className={inputClass} aria-label="City" />
          <textarea name="address" rows={2} defaultValue={order.shipping.address ?? ""} placeholder="Address" className={cx(inputClass, "resize-y")} aria-label="Address" />
        </>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Result state={state} />
        <button type="submit" disabled={pending} className={cx(adminButton({ size: "sm" }), "ml-auto")}>
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}

export function EditableCustomer({ order, children }: { order: Order; children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      {editing ? <CustomerForm order={order} onDone={() => setEditing(false)} /> : children}
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="mt-3 text-[0.76rem] font-semibold text-forest-700 hover:underline"
      >
        {editing ? "Cancel editing" : "Edit customer & delivery"}
      </button>
    </div>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={adminButton({ variant: "secondary" })}>
      Print
    </button>
  );
}
