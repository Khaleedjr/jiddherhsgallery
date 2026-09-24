import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Every admin page and server action calls this; the proxy is only a first, optimistic check. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
