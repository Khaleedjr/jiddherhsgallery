"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, adminPassword, checkPassword, createSessionToken } from "@/lib/admin/session";

export type LoginState = { error: string | null };

/** Only follow redirects back into the admin, never to another site. */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
};

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  if (!adminPassword()) {
    return { error: "The dashboard is locked until ADMIN_PASSWORD is set on the server." };
  }
  const attempt = String(form.get("password") ?? "");
  if (!checkPassword(attempt)) {
    // A short pause makes guessing slow without inconveniencing the owner.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { error: "That password isn't right." };
  }
  const { token, expires } = createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
