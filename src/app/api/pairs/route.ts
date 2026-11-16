import { getPairingMap } from "@/lib/pairs";

/*
 * Every product's "goes with" picks, for the bag's suggestions. Built once
 * and cached: rebuilt when the catalogue or stock changes (the dashboard and
 * paid orders refresh the storefront) and at least hourly, so new orders'
 * pairs show up.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return Response.json(await getPairingMap(3));
}
