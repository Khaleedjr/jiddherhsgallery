"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { sendOrderReceipt } from "@/lib/receipts";
import { clearDemoData, loadDemoOrders } from "@/lib/store/demo";
import {
  OrderError,
  addOrderNote,
  createOrder,
  deleteOrder,
  listOrders,
  setOrderStatus,
  updateOrder,
  type LineInput,
} from "@/lib/store/orders";
import {
  ORDER_CHANNELS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  type OrderChannel,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/store/types";

export type ActionResult = { ok: boolean; message: string | null };

const text = (form: FormData, key: string, max = 300) => String(form.get(key) ?? "").trim().slice(0, max);
const whole = (form: FormData, key: string) => Math.max(0, Math.round(Number(String(form.get(key) ?? "0").replace(/[,\s₦]/g, "")) || 0));

export async function setStatusAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ref = text(form, "ref", 20);
  const status = text(form, "status", 20) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return { ok: false, message: "Choose a status." };
  try {
    await setOrderStatus(ref, status, text(form, "note", 500));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update the order." };
  }
  // Confirming or cancelling moves stock, which the storefront shows.
  refreshStorefront();
  return { ok: true, message: "Status updated" };
}

export async function addNoteAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const note = text(form, "note", 1000);
  if (!note) return { ok: false, message: "Write a note first." };
  await addOrderNote(text(form, "ref", 20), note);
  revalidatePath(`/admin/orders/${text(form, "ref", 20)}`);
  return { ok: true, message: "Note added" };
}

export async function sendReceiptAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ref = text(form, "ref", 20);
  const result = await sendOrderReceipt(ref, { force: true });
  revalidatePath(`/admin/orders/${ref}`);
  return result;
}

export async function updateChargesAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const method = text(form, "paymentMethod", 20);
  try {
    await updateOrder(text(form, "ref", 20), {
      deliveryFee: whole(form, "deliveryFee"),
      discount: whole(form, "discount"),
      paymentMethod: PAYMENT_METHODS.includes(method as PaymentMethod) ? (method as PaymentMethod) : null,
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved" };
}

export async function updateCustomerAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = text(form, "name", 120);
  const phone = text(form, "phone", 40);
  if (!name || !/^[0-9+\s()-]{7,}$/.test(phone)) return { ok: false, message: "A name and a reachable phone number are needed." };
  const fulfilment = form.get("fulfilment") === "pickup" ? "pickup" : "delivery";
  try {
    await updateOrder(text(form, "ref", 20), {
      customer: { name, phone, email: text(form, "email", 160) || null },
      fulfilment,
      shipping:
        fulfilment === "pickup"
          ? { state: null, city: null, address: null }
          : { state: text(form, "state", 60) || null, city: text(form, "city", 80) || null, address: text(form, "address", 300) || null },
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved" };
}

export async function deleteOrderAction(form: FormData) {
  await requireAdmin();
  await deleteOrder(text(form, "ref", 20));
  refreshStorefront();
  redirect("/admin/orders?deleted=1");
}

export type ManualOrderInput = {
  channel: OrderChannel;
  status: OrderStatus;
  createdAt: string | null;
  customer: { name: string; phone: string; email: string };
  fulfilment: "delivery" | "pickup";
  shipping: { state: string; city: string; address: string };
  items: Array<{ productId: string; variantId: string | null; quantity: number; price: number | null }>;
  deliveryFee: number;
  discount: number;
  paymentMethod: PaymentMethod | null;
  note: string;
};

export async function createManualOrderAction(input: ManualOrderInput): Promise<{ ok: true; ref: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!ORDER_CHANNELS.includes(input.channel) || input.channel === "website") return { ok: false, error: "Choose where the order came from." };
  if (!ORDER_STATUSES.includes(input.status)) return { ok: false, error: "Choose a status." };
  let createdAt: string | undefined;
  if (input.createdAt) {
    const date = new Date(input.createdAt);
    if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 60_000) return { ok: false, error: "The order date can't be in the future." };
    createdAt = date.toISOString();
  }
  const items: LineInput[] = input.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    ...(item.price !== null ? { price: item.price } : {}),
  }));
  try {
    const order = await createOrder({
      channel: input.channel,
      status: input.status,
      createdAt,
      customer: input.customer,
      fulfilment: input.fulfilment,
      shipping: input.shipping,
      items,
      deliveryFee: input.deliveryFee,
      discount: input.discount,
      paymentMethod: input.paymentMethod,
      customerNote: input.note,
      by: "admin",
    });
    refreshStorefront();
    return { ok: true, ref: order.ref };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function loadSampleDataAction() {
  await requireAdmin();
  const real = (await listOrders()).filter((order) => !order.demo);
  if (!real.length) await loadDemoOrders();
  revalidatePath("/admin", "layout");
  redirect("/admin?sample=loaded");
}

export async function clearSampleDataAction() {
  await requireAdmin();
  await clearDemoData();
  revalidatePath("/admin", "layout");
  redirect("/admin?sample=cleared");
}
