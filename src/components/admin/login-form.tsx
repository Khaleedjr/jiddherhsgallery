"use client";

import { useActionState } from "react";
import { adminButton, inputClass } from "@/components/admin/ui";
import { login, type LoginState } from "@/lib/admin/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="password" className="mb-1.5 block text-[0.78rem] font-semibold text-ink-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={inputClass}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      {state.error ? (
        <p id="login-error" role="alert" className="rounded-lg bg-berry-500/8 px-3 py-2 text-[0.78rem] font-medium text-berry-600">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${adminButton()} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
