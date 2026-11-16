import { fill } from "@/lib/content/format";

/**
 * Delivery zones, fees, free delivery and pickup. The dashboard edits them
 * (Delivery page); until it has, the defaults below apply. They were copied
 * from the WooCommerce checkout on jiddersgallery.com.ng (read through its
 * Store API, 15 Nov 2026), so the new checkout first charged exactly what the
 * old one did. The server re-prices every order from the saved settings,
 * never from the browser.
 *
 * Plain data and pure functions, so checkout can use them in the browser.
 */

export type DeliveryMethod = {
  id: string;
  /** May use {state}, e.g. "Waybill to {state}". */
  name: string;
  /** Naira. */
  cost: number;
  note: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  /** Names from NIGERIAN_STATES; a state belongs to one zone at most. */
  states: string[];
  methods: DeliveryMethod[];
};

export type DeliverySettings = {
  zones: DeliveryZone[];
  freeDelivery: { enabled: boolean; threshold: number };
  pickup: { enabled: boolean; name: string; note: string };
};

/** What checkout shows and an order records. */
export type ShippingOption = { id: string; name: string; cost: number; note: string };

/** Store details the wording may use: {kadunaNote}, {pickupDays}, {pickupTime}. */
export type DeliveryVars = Record<string, string>;

const waybill = (cost: number): DeliveryMethod => ({
  id: "waybill",
  name: "Waybill to {state}",
  cost,
  note: "Sent by bus to the park in {state}; we send you the driver's details",
});

export const DEFAULT_DELIVERY: DeliverySettings = {
  zones: [
    {
      id: "kaduna",
      name: "Kaduna",
      states: ["Kaduna"],
      methods: [{ id: "kaduna", name: "Delivery in Kaduna", cost: 1000, note: "Doorstep delivery within {kadunaNote}" }],
    },
    {
      id: "kano",
      name: "Kano",
      states: ["Kano"],
      methods: [
        waybill(1500),
        { id: "naibawa-park", name: "Na'ibawa Park", cost: 1500, note: "Collect from Na'ibawa Park in Kano" },
        { id: "kanoline", name: "Kanoline", cost: 1500, note: "Collect from the Kanoline terminal in Kano" },
      ],
    },
    {
      id: "abuja",
      name: "Abuja",
      states: ["FCT - Abuja"],
      methods: [
        { id: "zuba-park", name: "Zuba Park", cost: 1500, note: "Collect from Zuba Park in Abuja" },
        { id: "jabi-park", name: "Jabi Park", cost: 1500, note: "Collect from Jabi Park in Abuja" },
      ],
    },
    {
      id: "lagos",
      name: "Lagos",
      states: ["Lagos"],
      methods: [
        { id: "iddo-park", name: "Iddo Park", cost: 5000, note: "Collect from Iddo Park in Lagos" },
        { id: "agege", name: "Agege", cost: 5000, note: "Collect from the Agege park in Lagos" },
      ],
    },
    { id: "niger", name: "Niger", states: ["Niger"], methods: [waybill(1500)] },
    { id: "north-near", name: "North: nearer states", states: ["Bauchi", "Katsina", "Zamfara"], methods: [waybill(2500)] },
    {
      id: "north-far",
      name: "North and Middle Belt",
      states: ["Adamawa", "Benue", "Borno", "Gombe", "Jigawa", "Kebbi", "Kogi", "Nasarawa", "Plateau", "Sokoto", "Taraba", "Yobe"],
      methods: [waybill(3000)],
    },
    {
      id: "south",
      name: "South and South West",
      states: ["Bayelsa", "Cross River", "Delta", "Edo", "Enugu", "Imo", "Kwara", "Ogun", "Ondo", "Osun", "Oyo", "Rivers"],
      methods: [waybill(6000)],
    },
  ],
  freeDelivery: { enabled: true, threshold: 100_000 },
  pickup: { enabled: true, name: "Pick up in Kaduna", note: "{pickupDays}, {pickupTime}" },
};

export const zoneFor = (settings: DeliverySettings, state: string) => settings.zones.find((zone) => zone.states.includes(state)) ?? null;

/** True when some zone covers this state. */
export const deliversTo = (settings: DeliverySettings, state: string) => Boolean(zoneFor(settings, state));

/** The free-delivery threshold, or null when free delivery is off. */
export const freeDeliveryFrom = (settings: DeliverySettings) => (settings.freeDelivery.enabled ? settings.freeDelivery.threshold : null);

/** The fee within Kaduna (the first method of its zone), for wording such as {kadunaFee}. */
export const localFee = (settings: DeliverySettings) => zoneFor(settings, "Kaduna")?.methods[0]?.cost ?? null;

const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

export function pickupOption(settings: DeliverySettings, vars: DeliveryVars = {}): ShippingOption | null {
  if (!settings.pickup.enabled) return null;
  return { id: "pickup", name: fill(settings.pickup.name, vars), cost: 0, note: fill(settings.pickup.note, vars) };
}

/**
 * Delivery options for a state and bag subtotal, in the zone's order. From the
 * free-delivery threshold up, "Free delivery" joins the list and comes first.
 */
export function deliveryOptions(settings: DeliverySettings, state: string, subtotal: number, vars: DeliveryVars = {}): ShippingOption[] {
  const zone = zoneFor(settings, state);
  if (!zone) return [];
  const words = { ...vars, state };
  const options = zone.methods.map((method) => ({ id: method.id, name: fill(method.name, words), cost: method.cost, note: fill(method.note, words) }));
  const threshold = freeDeliveryFrom(settings);
  if (threshold !== null && subtotal >= threshold) {
    options.unshift({ id: "free", name: "Free delivery", cost: 0, note: `Orders from ${naira(threshold)} ship free` });
  }
  return options;
}

/** The option a customer picked, re-priced from the settings; null if it isn't offered for that state and subtotal. */
export function resolveShipping(
  settings: DeliverySettings,
  fulfilment: "delivery" | "pickup",
  state: string,
  optionId: string,
  subtotal: number,
  vars: DeliveryVars = {},
): ShippingOption | null {
  if (fulfilment === "pickup") return pickupOption(settings, vars);
  return deliveryOptions(settings, state, subtotal, vars).find((option) => option.id === optionId) ?? null;
}
