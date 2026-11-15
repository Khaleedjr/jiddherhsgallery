import { NextResponse } from "next/server";
import { confirmPayment } from "@/lib/payments";

/**
 * Where Paystack sends the customer after paying (it adds `reference`). The
 * payment is verified and recorded here, in a route handler, so the store's
 * pages can be rebuilt with the new stock; then the customer is forwarded to
 * the confirmation page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderRef = (url.searchParams.get("order") ?? "").toUpperCase().slice(0, 20);
  const reference = (url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "").slice(0, 80);

  const state = orderRef && reference ? await confirmPayment(orderRef, reference) : "unknown";
  const next = new URL("/checkout/complete", url.origin);
  next.searchParams.set("order", orderRef);
  if (reference) next.searchParams.set("reference", reference);
  next.searchParams.set("status", state);
  return NextResponse.redirect(next, 303);
}
