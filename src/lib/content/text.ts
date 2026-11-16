import { cache } from "react";
import { fill } from "@/lib/content/format";
import { SECTIONS, SECTION_KEYS, type Field, type SectionKey, type SiteText, type TextOverrides } from "@/lib/content/schema";
import { getDeliverySettings } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { DEFAULT_DELIVERY, freeDeliveryFrom, localFee, type DeliverySettings } from "@/lib/shipping";
import { site } from "@/lib/site";
import { getDriver } from "@/lib/store/driver";

const KEY = "site-text";

type Value = string | Array<Record<string, string>>;

export async function getTextOverrides(): Promise<TextOverrides> {
  return (await getDriver().getValue<TextOverrides>(KEY)) ?? {};
}

export async function setTextOverrides(overrides: TextOverrides) {
  await getDriver().setValue(KEY, overrides);
}

/** A saved value is only used if it still fits its field (fields can change shape between versions). */
function fits(field: Field, value: unknown): value is Value {
  if (field.kind !== "list") return typeof value === "string";
  return (
    Array.isArray(value) &&
    value.every((item) => item && typeof item === "object" && Object.keys(field.fields).every((key) => typeof item[key] === "string"))
  );
}

/** The placeholders every field may use. Fees come from the dashboard's Delivery settings. */
export function globalVars(store: SiteText["store"], delivery: DeliverySettings = DEFAULT_DELIVERY) {
  return {
    storeName: site.name,
    phone: store.phoneDisplay,
    email: store.email,
    state: store.state,
    pickupDays: store.pickupDays,
    pickupTime: store.pickupTime,
    interstateDays: store.interstateDays,
    dispatchHours: store.dispatchHours,
    kadunaFee: formatPrice(localFee(delivery) ?? site.delivery.kadunaFee),
    freeDeliveryFrom: formatPrice(freeDeliveryFrom(delivery) ?? site.freeDeliveryThreshold),
    kadunaNote: store.kadunaNote,
    addressNote: store.addressNote,
    instagramHandle: store.instagramHandle,
  };
}

/** One page's text as typed in the dashboard (placeholders not yet filled in): saved values over the defaults. */
export function sectionValues(section: SectionKey, overrides: TextOverrides): Record<string, Value> {
  const fields = SECTIONS[section].fields as Record<string, Field>;
  const saved = overrides[section] ?? {};
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, fits(field, saved[key]) ? saved[key] : field.default]));
}

export function buildSiteText(overrides: TextOverrides, delivery: DeliverySettings = DEFAULT_DELIVERY): SiteText {
  const merged: Record<string, Record<string, Value>> = {};
  for (const section of SECTION_KEYS) merged[section] = sectionValues(section, overrides);

  const vars = globalVars(merged.store as SiteText["store"], delivery);
  for (const section of SECTION_KEYS) {
    if (section === "store") continue;
    for (const [key, value] of Object.entries(merged[section])) {
      merged[section][key] =
        typeof value === "string"
          ? fill(value, vars)
          : value.map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, fill(v, vars)])));
    }
  }
  return merged as SiteText;
}

/**
 * The storefront's text: what an admin saved, over the defaults in schema.ts.
 * Read once per render. Pages stay static: saving text in the dashboard
 * rebuilds them (see saveSiteTextAction).
 */
export const getSiteText = cache(async (): Promise<SiteText> => {
  try {
    const [overrides, delivery] = await Promise.all([getTextOverrides(), getDeliverySettings()]);
    return buildSiteText(overrides, delivery);
  } catch (error) {
    console.error("Couldn't read the site text; showing the defaults.", error);
    return buildSiteText({});
  }
});
