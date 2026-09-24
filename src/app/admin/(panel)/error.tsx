"use client";

import { AlertIcon } from "@/components/admin/icons";
import { adminButton } from "@/components/admin/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <AlertIcon className="mx-auto size-10 text-berry-500" />
      <h1 className="mt-4 font-sans text-xl font-semibold tracking-normal text-ink-900">Something went wrong</h1>
      <p className="mt-2 text-[0.85rem] text-ink-500">
        This page couldn&apos;t load. Your data is safe — try again, and if it keeps happening, note the code below.
      </p>
      {error.digest ? <p className="mt-3 font-mono text-[0.72rem] text-ink-400">Code {error.digest}</p> : null}
      <button type="button" onClick={reset} className={`${adminButton()} mt-6`}>
        Try again
      </button>
    </div>
  );
}
