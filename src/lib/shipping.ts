import { site } from "@/lib/site";

/**
 * Shipping zones and methods, copied from the WooCommerce checkout on
 * jiddersgallery.com.ng (read through its Store API, 15 Nov 2026), so the new
 * checkout charges exactly what the old one did. The server re-prices every
 * order from this table, never from the browser.
 *
 * WooCommerce called the per-state method "Flat rate"; it's shown here as the
 * waybill to that state (or delivery within Kaduna). Named parks keep their
 * names. "Local pickup", offered in every zone, is the Kaduna pickup option.
 * Abia, Akwa Ibom, Anambra, Ebonyi and Ekiti have no zone on the old store, so
 * they have no delivery option here either (pickup still works).
 */

export type ShippingOption = {
  id: string;
  name: string;
  /** Naira. */
  cost: number;
  note: string;
};

type Zone = Array<{ id: string; name?: string; cost: number; note?: string }>;

const waybill = (cost: number): Zone => [{ id: "waybill", cost }];

/** Keys are the names in NIGERIAN_STATES. */
const ZONES: Record<string, Zone> = {
  Kaduna: [{ id: "kaduna", name: "Delivery in Kaduna", cost: 1000, note: `Doorstep delivery within ${site.delivery.kadunaNote}` }],
  Kano: [
    { id: "waybill", cost: 1500 },
    { id: "naibawa-park", name: "Na'ibawa Park", cost: 1500, note: "Collect from Na'ibawa Park in Kano" },
    { id: "kanoline", name: "Kanoline", cost: 1500, note: "Collect from the Kanoline terminal in Kano" },
  ],
  "FCT - Abuja": [
    { id: "zuba-park", name: "Zuba Park", cost: 1500, note: "Collect from Zuba Park in Abuja" },
    { id: "jabi-park", name: "Jabi Park", cost: 1500, note: "Collect from Jabi Park in Abuja" },
  ],
  Lagos: [
    { id: "iddo-park", name: "Iddo Park", cost: 5000, note: "Collect from Iddo Park in Lagos" },
    { id: "agege", name: "Agege", cost: 5000, note: "Collect from the Agege park in Lagos" },
  ],
  Niger: waybill(1500),
  Bauchi: waybill(2500),
  Katsina: waybill(2500),
  Zamfara: waybill(2500),
  Adamawa: waybill(3000),
  Benue: waybill(3000),
  Borno: waybill(3000),
  Gombe: waybill(3000),
  Jigawa: waybill(3000),
  Kebbi: waybill(3000),
  Kogi: waybill(3000),
  Nasarawa: waybill(3000),
  Plateau: waybill(3000),
  Sokoto: waybill(3000),
  Taraba: waybill(3000),
  Yobe: waybill(3000),
  Bayelsa: waybill(6000),
  "Cross River": waybill(6000),
  Delta: waybill(6000),
  Edo: waybill(6000),
  Enugu: waybill(6000),
  Imo: waybill(6000),
  Kwara: waybill(6000),
  Ogun: waybill(6000),
  Ondo: waybill(6000),
  Osun: waybill(6000),
  Oyo: waybill(6000),
  Rivers: waybill(6000),
};

export const PICKUP_OPTION: ShippingOption = {
  id: "pickup",
  name: "Pick up in Kaduna",
  cost: 0,
  note: `${site.pickup.days}, ${site.pickup.time}`,
};

/** True when the old store had a shipping zone for this state. */
export const deliversTo = (state: string) => Boolean(ZONES[state]);

/**
 * Delivery options for a state and bag subtotal, cheapest first. From the
 * free-delivery threshold up, "Free delivery" joins the list (as it did on the
 * old store) and comes first.
 */
export function deliveryOptions(state: string, subtotal: number): ShippingOption[] {
  const zone = ZONES[state];
  if (!zone) return [];
  const options: ShippingOption[] = zone.map((method) => ({
    id: method.id,
    name: method.name ?? `Waybill to ${state}`,
    cost: method.cost,
    note: method.note ?? `Sent by bus to the park in ${state}; we send you the driver's details`,
  }));
  if (subtotal >= site.freeDeliveryThreshold) {
    options.unshift({ id: "free", name: "Free delivery", cost: 0, note: `Orders from ₦${site.freeDeliveryThreshold.toLocaleString("en-NG")} ship free` });
  }
  return options;
}

/** The option a customer picked, re-priced on the server; null if it isn't offered for that state and subtotal. */
export function resolveShipping(fulfilment: "delivery" | "pickup", state: string, optionId: string, subtotal: number): ShippingOption | null {
  if (fulfilment === "pickup") return PICKUP_OPTION;
  return deliveryOptions(state, subtotal).find((option) => option.id === optionId) ?? null;
}
