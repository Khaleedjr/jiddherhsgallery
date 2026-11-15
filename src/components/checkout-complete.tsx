"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { LockIcon } from "@/components/icons";
import { buttonClass, cx } from "@/components/ui";

/** Empties the bag once the order is paid (it is kept until then, so a failed payment loses nothing). */
export function ClearBagOnce() {
  const { clear, count } = useCart();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done && count > 0) {
      clear();
      setDone(true);
    }
  }, [clear, count, done]);
  return null;
}

/** Sends the customer back to Paystack for another go at paying the same order. */
export function RetryPayment({ orderRef, reference, label = "Try paying again" }: { orderRef: string; reference: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = (await response.json().catch(() => ({}))) as { authorizationUrl?: string; error?: string };
      if (response.ok && data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
        return;
      }
      setError(data.error ?? "We couldn't start the payment. Please try again.");
    } catch {
      setError("You seem to be offline. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div>
      <button type="button" onClick={retry} disabled={busy} className={cx(buttonClass({ size: "lg" }), "w-full sm:w-auto")}>
        <LockIcon className="size-4" />
        {busy ? "Opening Paystack…" : label}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-[0.82rem] font-medium text-berry-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
