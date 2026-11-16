"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { checkDelivery, setDeliverySettings } from "@/lib/delivery";

export type DeliveryResult = { ok: true } | { ok: false; error: string };

/** Saves the delivery zones, fees, free delivery and pickup; checkout and the store pages pick them up straight away. */
export async function saveDeliveryAction(input: unknown): Promise<DeliveryResult> {
  await requireAdmin();
  const checked = checkDelivery(input);
  if (!checked.ok) return checked;
  await setDeliverySettings(checked.settings);
  refreshStorefront();
  revalidatePath("/admin/delivery");
  return { ok: true };
}
