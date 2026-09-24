"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { adjustStock } from "@/lib/store/inventory";
import { STOCK_REASONS, type StockReason } from "@/lib/store/types";

export type AdjustState = { ok: boolean; message: string | null; after?: number | null };

export async function adjustStockAction(_: AdjustState, form: FormData): Promise<AdjustState> {
  await requireAdmin();
  const productId = String(form.get("productId") ?? "");
  const variantId = String(form.get("variantId") ?? "") || null;
  const mode = form.get("mode");
  const amount = Math.floor(Number(form.get("amount")));
  const reason = String(form.get("reason") ?? "") as StockReason;
  const note = String(form.get("note") ?? "").slice(0, 300);

  if (mode !== "add" && mode !== "remove" && mode !== "set") return { ok: false, message: "Choose add, remove or set." };
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return { ok: false, message: "Enter a whole number of units." };
  if (mode !== "set" && amount === 0) return { ok: false, message: "Enter how many units." };
  if (!STOCK_REASONS.includes(reason) || reason === "sale") return { ok: false, message: "Choose a reason." };

  try {
    const movement = await adjustStock({
      productId,
      variantId,
      mode: mode === "set" ? "set" : "change",
      amount: mode === "remove" ? -amount : amount,
      reason,
      note,
    });
    if (!movement) return { ok: true, message: "Nothing to change — the count was already right." };
    refreshStorefront();
    return {
      ok: true,
      after: movement.after,
      message: `${movement.change > 0 ? "+" : ""}${movement.change} → ${movement.after} in stock`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update stock." };
  }
}
