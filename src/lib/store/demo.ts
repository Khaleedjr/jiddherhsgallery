import { getDriver } from "@/lib/store/driver";
import { deleteMovements, listMovements } from "@/lib/store/inventory";
import { PAID_STATUSES, deleteDemoOrders, orderRef, priceLines } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";
import type { Order, OrderChannel, OrderStatus, StoredProduct } from "@/lib/store/types";

/**
 * Sample orders so the dashboard can be explored before real ones arrive.
 * Every record is flagged `demo`, never moves real stock, and is removed in
 * one step from the Orders page.
 */

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Aisha", "Fatima", "Maryam", "Zainab", "Hauwa", "Khadija", "Amina", "Hafsat", "Ruqayya", "Safiya", "Habiba", "Ummi", "Sadiya", "Bilkisu", "Rahma", "Aminu", "Ibrahim", "Musa", "Abdullahi", "Yusuf", "Umar", "Sani", "Bashir", "Kabir", "Nafisa", "Hadiza", "Rukayat", "Mariam", "Suleiman", "Idris", "Halima", "Jamila", "Asma'u", "Zulaihat", "Aliyu", "Faruk"];
const LAST = ["Bello", "Abubakar", "Mohammed", "Sani", "Usman", "Ibrahim", "Yakubu", "Garba", "Aliyu", "Suleiman", "Adamu", "Lawal", "Abdulkadir", "Idris", "Umar", "Ahmad", "Balogun", "Olayinka", "Salihu", "Danjuma"];
const STATES: Array<[string, number, string[]]> = [
  ["Kaduna", 34, ["Kaduna", "Zaria", "Kafanchan"]],
  ["FCT - Abuja", 15, ["Gwarinpa", "Wuse", "Kubwa", "Garki"]],
  ["Kano", 11, ["Kano", "Nassarawa GRA"]],
  ["Lagos", 10, ["Ikeja", "Lekki", "Surulere"]],
  ["Katsina", 5, ["Katsina"]],
  ["Plateau", 4, ["Jos"]],
  ["Niger", 4, ["Minna"]],
  ["Kwara", 4, ["Ilorin"]],
  ["Sokoto", 3, ["Sokoto"]],
  ["Bauchi", 3, ["Bauchi"]],
  ["Oyo", 3, ["Ibadan"]],
  ["Rivers", 2, ["Port Harcourt"]],
  ["Gombe", 2, ["Gombe"]],
];
const CHANNELS: Array<[OrderChannel, number]> = [
  ["website", 52],
  ["whatsapp", 31],
  ["instagram", 13],
  ["walk-in", 4],
];

const weighted = <T,>(rand: () => number, entries: Array<[T, number]>) => {
  const total = entries.reduce((n, [, w]) => n + w, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
};

type Person = { name: string; phone: string; email: string | null; state: string; city: string; pickup: boolean };

export async function loadDemoOrders(count = 160, days = 180): Promise<number> {
  const rand = random(20260924);
  const products = (await listProducts()).filter((p) => p.status === "published" && p.inStock && p.images.length);
  if (!products.length) return 0;
  const pool: Array<[StoredProduct, number]> = products.map((p) => [p, p.collections.includes("best-seller") ? 5 : 1]);

  const people: Person[] = Array.from({ length: 72 }, () => {
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const state = weighted(rand, STATES.map(([s, w]) => [s, w]));
    const cities = STATES.find(([s]) => s === state)![2];
    const phone = `0${["803", "806", "813", "703", "706", "810", "902", "816"][Math.floor(rand() * 8)]}${String(Math.floor(rand() * 1e7)).padStart(7, "0")}`;
    return {
      name: `${first} ${last}`,
      phone,
      email: rand() < 0.45 ? `${first.toLowerCase().replace(/[^a-z]/g, "")}.${last.toLowerCase()}@example.com` : null,
      state,
      city: cities[Math.floor(rand() * cities.length)],
      pickup: state === "Kaduna" && rand() < 0.45,
    };
  });
  // A handful of loyal customers come back again and again.
  const personWeights: Array<[Person, number]> = people.map((p, i) => [p, i < 10 ? 6 : i < 25 ? 2 : 1]);

  const now = Date.now();
  const drafts: Array<Omit<Order, "id" | "ref">> = [];
  for (let i = 0; i < count; i += 1) {
    // Skew toward recent days so the trend grows, as a young store's would.
    const ageDays = Math.floor(Math.pow(rand(), 1.35) * days);
    const hour = 7 + Math.floor(rand() * 15);
    const created = new Date(now - ageDays * 86_400_000);
    created.setUTCHours(hour - 1, Math.floor(rand() * 60), 0, 0);
    if (created.getTime() > now) created.setTime(now - Math.floor(rand() * 3_600_000));

    const person = weighted(rand, personWeights);
    const lineCount = 1 + Math.floor(Math.pow(rand(), 2) * 4);
    const chosen = new Map<string, number>();
    while (chosen.size < lineCount) {
      const product = weighted(rand, pool);
      chosen.set(product.id, rand() < 0.2 ? 2 : 1);
    }
    const lines = [...chosen].map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId)!;
      const variant = product.variants.length ? product.variants[Math.floor(rand() * product.variants.length)] : null;
      return { productId, variantId: variant?.id ?? null, quantity };
    });
    const items = priceLines(lines, products, false);

    let status: OrderStatus;
    const r = rand();
    if (ageDays <= 1) status = r < 0.55 ? "pending" : r < 0.85 ? "confirmed" : "cancelled";
    else if (ageDays <= 5) status = r < 0.12 ? "pending" : r < 0.35 ? "confirmed" : r < 0.8 ? "dispatched" : r < 0.93 ? "delivered" : "cancelled";
    else status = r < 0.88 ? "delivered" : r < 0.93 ? "dispatched" : "cancelled";

    const deliveryFee = person.pickup ? 0 : person.state === "Kaduna" ? 1000 : 2500 + Math.floor(rand() * 5) * 500;
    const subtotal = items.reduce((n, item) => n + item.price * item.quantity, 0);
    const discount = rand() < 0.07 ? 500 : 0;
    const at = created.toISOString();
    const channel = weighted(rand, CHANNELS);
    const history: Order["history"] = [{ at, status: "pending", note: channel === "website" ? "Order placed on the website" : `Order recorded from ${channel}`, by: channel === "website" ? "customer" : "admin" }];
    if (status !== "pending") history.push({ at: new Date(created.getTime() + 3_600_000 * (1 + rand() * 8)).toISOString(), status, note: "", by: "admin" });

    drafts.push({
      createdAt: at,
      updatedAt: history[history.length - 1].at,
      status,
      channel,
      customer: { name: person.name, phone: person.phone, email: person.email },
      fulfilment: person.pickup ? "pickup" : "delivery",
      shipping: person.pickup
        ? { state: null, city: null, address: null }
        : { state: person.state, city: person.city, address: `${10 + Math.floor(rand() * 80)} Sample Street` },
      items,
      subtotal,
      deliveryFee,
      discount,
      total: subtotal + deliveryFee - discount,
      paymentMethod: PAID_STATUSES.includes(status) ? (rand() < 0.86 ? "transfer" : rand() < 0.5 ? "pos" : "cash") : null,
      paidAt: PAID_STATUSES.includes(status) ? history[history.length - 1].at : null,
      customerNote: rand() < 0.12 ? "Please call before delivery." : null,
      history,
      stockDeducted: false,
      demo: true,
    });
  }

  drafts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const db = getDriver();
  const last = await db.incr("order", drafts.length);
  const first = last - drafts.length + 1;
  const entries: Record<string, Order> = {};
  drafts.forEach((draft, index) => {
    const seq = first + index;
    const ref = orderRef(seq);
    entries[ref] = { id: String(seq), ref, ...draft };
  });
  await db.put("orders", entries);
  return drafts.length;
}

export async function clearDemoData() {
  const orders = await deleteDemoOrders();
  const demoMovements = (await listMovements()).filter((m) => m.demo).map((m) => m.id);
  await deleteMovements(demoMovements);
  return orders;
}
