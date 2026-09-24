"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon } from "@/components/icons";
import { CopyIcon } from "@/components/admin/icons";
import { adminButton, cx, selectClass } from "@/components/admin/ui";

/** A filter dropdown that applies itself, so list filters work without an "Apply" click. */
export function AutoSubmitSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cx(selectClass, className)}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    />
  );
}

/** A submit button that asks first — for deletes and other things that are hard to undo. */
export function ConfirmSubmit({
  message,
  children,
  className,
  pendingLabel,
  ...props
}: ComponentProps<"button"> & { message: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...props}
      disabled={pending || props.disabled}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...props} disabled={pending || props.disabled} className={className ?? adminButton()}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className ?? adminButton({ variant: "secondary", size: "sm" })}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
