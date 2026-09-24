import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * A stateless admin session: `<expiry>.<signature>` in an httpOnly cookie. The
 * signing key comes from ADMIN_SESSION_SECRET, or failing that is derived from
 * the password — so changing the password signs everybody out.
 */
export const SESSION_COOKIE = "jg_admin";
export const SESSION_DAYS = 14;

/** Local development gets a known password so the dashboard can be explored; production never does. */
export const DEV_PASSWORD = "jidderh-admin";

export function adminPassword(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

function signingKey(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;
  const password = adminPassword();
  return password ? createHash("sha256").update(`jg-session:${password}`).digest("hex") : null;
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(`admin.${payload}`).digest("base64url");

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function createSessionToken(now = Date.now()) {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not set.");
  const expires = String(now + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return { token: `${expires}.${sign(expires, key)}`, expires: new Date(Number(expires)) };
}

export function verifySessionToken(token: string | undefined, now = Date.now()) {
  const key = signingKey();
  if (!token || !key) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < now) return false;
  return safeEqual(signature, sign(expires, key));
}

export function checkPassword(attempt: string) {
  const password = adminPassword();
  if (!password) return false;
  // Compare digests so the comparison is constant-time whatever the lengths.
  const digest = (value: string) => createHash("sha256").update(value).digest("hex");
  return safeEqual(digest(attempt), digest(password));
}
