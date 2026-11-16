import { cache } from "react";
import type { SiteText } from "@/lib/content/schema";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { DEFAULT_DELIVERY, type DeliveryMethod, type DeliverySettings, type DeliveryVars, type DeliveryZone } from "@/lib/shipping";
import { getDriver } from "@/lib/store/driver";

const KEY = "delivery";
const ID = /^[a-z0-9-]{1,40}$/;
const RESERVED = new Set(["free", "pickup"]);

const words = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const naira = (value: unknown, max = 50_000_000) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value) : null;

/**
 * Checks delivery settings from the dashboard (or the store) and tidies them.
 * Every message names the zone or method at fault, in the dashboard's words.
 */
export function checkDelivery(input: unknown): { ok: true; settings: DeliverySettings } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!input || typeof input !== "object") return fail("The delivery settings couldn't be read.");
  const raw = input as Record<string, unknown>;

  const free = (raw.freeDelivery ?? {}) as Record<string, unknown>;
  const freeEnabled = free.enabled === true;
  const threshold = naira(free.threshold);
  if (freeEnabled && (threshold === null || threshold < 1)) return fail("Set the order amount for free delivery, or turn free delivery off.");

  const pickupRaw = (raw.pickup ?? {}) as Record<string, unknown>;
  const pickup = { enabled: pickupRaw.enabled === true, name: words(pickupRaw.name, 60), note: words(pickupRaw.note, 200) };
  if (!pickup.name) return fail("Give the pickup option a name.");

  if (!Array.isArray(raw.zones)) return fail("The delivery zones couldn't be read.");
  if (raw.zones.length > 40) return fail("There can be at most 40 zones.");

  const valid = new Set(NIGERIAN_STATES);
  const owner = new Map<string, string>();
  const zoneIds = new Set<string>();
  const zones: DeliveryZone[] = [];

  for (const [index, entry] of raw.zones.entries()) {
    const zone = (entry ?? {}) as Record<string, unknown>;
    const name = words(zone.name, 60);
    const label = name ? `“${name}”` : `Zone ${index + 1}`;
    if (!name) return fail(`${label} needs a name.`);
    const id = typeof zone.id === "string" && ID.test(zone.id) && !zoneIds.has(zone.id) ? zone.id : `zone-${index + 1}`;
    zoneIds.add(id);

    const states = Array.isArray(zone.states) ? [...new Set(zone.states.filter((s): s is string => typeof s === "string" && valid.has(s)))] : [];
    if (!states.length) return fail(`${label} has no states. Add at least one, or delete the zone.`);
    for (const state of states) {
      const other = owner.get(state);
      if (other) return fail(`${state} is in both ${other} and ${label}. A state can only be in one zone.`);
      owner.set(state, label);
    }

    if (!Array.isArray(zone.methods) || !zone.methods.length) return fail(`${label} needs at least one delivery option.`);
    if (zone.methods.length > 10) return fail(`${label} can have at most 10 delivery options.`);
    const methodIds = new Set<string>();
    const methods: DeliveryMethod[] = [];
    for (const [m, item] of zone.methods.entries()) {
      const method = (item ?? {}) as Record<string, unknown>;
      const methodName = words(method.name, 80);
      if (!methodName) return fail(`${label}, option ${m + 1} needs a name.`);
      const cost = naira(method.cost);
      if (cost === null) return fail(`${label}: “${methodName}” needs a price in naira (0 for free).`);
      let methodId = typeof method.id === "string" && ID.test(method.id) && !RESERVED.has(method.id) ? method.id : `option-${m + 1}`;
      while (methodIds.has(methodId)) methodId = `${methodId}-${m + 1}`;
      methodIds.add(methodId);
      methods.push({ id: methodId, name: methodName, cost, note: words(method.note, 200) });
    }
    zones.push({ id, name, states, methods });
  }

  return {
    ok: true,
    settings: { zones, freeDelivery: { enabled: freeEnabled, threshold: threshold ?? DEFAULT_DELIVERY.freeDelivery.threshold }, pickup },
  };
}

/** The saved settings, or the defaults (also if what's saved can't be read). */
export const getDeliverySettings = cache(async (): Promise<DeliverySettings> => {
  try {
    const saved = await getDriver().getValue<unknown>(KEY);
    if (saved) {
      const checked = checkDelivery(saved);
      if (checked.ok) return checked.settings;
      console.error("Saved delivery settings are invalid; using the defaults.", checked.error);
    }
  } catch (error) {
    console.error("Couldn't read the delivery settings; using the defaults.", error);
  }
  return DEFAULT_DELIVERY;
});

export async function setDeliverySettings(settings: DeliverySettings) {
  await getDriver().setValue(KEY, settings);
}

/** Store details the delivery wording may use. */
export const deliveryVars = (store: SiteText["store"]): DeliveryVars => ({
  kadunaNote: store.kadunaNote,
  pickupDays: store.pickupDays,
  pickupTime: store.pickupTime,
});
