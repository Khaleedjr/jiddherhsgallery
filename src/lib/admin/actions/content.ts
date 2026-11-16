"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { refreshStorefront } from "@/lib/admin/revalidate";
import { MAX_LENGTH, SECTIONS, isSectionKey, type Field, type ScalarField } from "@/lib/content/schema";
import { setSiteFonts } from "@/lib/content/style";
import { getTextOverrides, setTextOverrides } from "@/lib/content/text";
import { isFontId } from "@/lib/fonts";

export type ContentResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ContentResult => ({ ok: false, error });

/** Trims and tidies one value; null when it is not text or too long. One-line fields lose their line breaks. */
function clean(value: unknown, field: ScalarField): string | null {
  if (typeof value !== "string") return null;
  let text = value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  text = field.kind === "text" ? text.replace(/\s*\n\s*/g, " ").trim() : text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  return text.length > MAX_LENGTH[field.kind] ? null : text;
}

function checkFormat(field: ScalarField, value: string): string | null {
  if (field.check === "digits" && !/^\d{8,15}$/.test(value)) return `“${field.label}” should be digits only, with the country code, like 2347039783709.`;
  if (field.check === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `“${field.label}” doesn't look like an email address.`;
  if (field.check === "url" && !/^https:\/\/\S+$/.test(value)) return `“${field.label}” should be a full link starting with https://`;
  return null;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Saves one page's text. Only values that differ from the original wording are
 * stored, so untouched fields keep following the defaults in schema.ts. Every
 * storefront page is rebuilt on its next visit.
 */
export async function saveSiteTextAction(section: string, values: Record<string, unknown>): Promise<ContentResult> {
  await requireAdmin();
  if (!isSectionKey(section)) return fail("That page doesn't exist.");
  if (!values || typeof values !== "object") return fail("Nothing to save.");

  const fields = SECTIONS[section].fields as Record<string, Field>;
  const changed: Record<string, string | Array<Record<string, string>>> = {};

  for (const [key, field] of Object.entries(fields)) {
    const raw = values[key];

    if (field.kind === "list") {
      if (!Array.isArray(raw)) return fail(`“${field.label}” couldn't be read. Reload the page and try again.`);
      const max = field.max ?? 50;
      if (raw.length === 0) return fail(`“${field.label}” needs at least one ${field.item}.`);
      if (raw.length > max) return fail(`“${field.label}” can have at most ${max} entries.`);
      const items: Array<Record<string, string>> = [];
      for (const [index, entry] of raw.entries()) {
        if (!entry || typeof entry !== "object") return fail(`“${field.label}” couldn't be read. Reload the page and try again.`);
        const item: Record<string, string> = {};
        for (const [subKey, subField] of Object.entries(field.fields)) {
          const text = clean((entry as Record<string, unknown>)[subKey], subField);
          if (text === null) return fail(`${field.label}, ${field.item} ${index + 1}: the ${subField.label.toLowerCase()} is too long.`);
          if (!text) return fail(`${field.label}, ${field.item} ${index + 1}: add a ${subField.label.toLowerCase()} or remove the ${field.item}.`);
          item[subKey] = text;
        }
        items.push(item);
      }
      if (!same(items, field.default)) changed[key] = items;
      continue;
    }

    const text = clean(raw, field);
    if (text === null) return fail(`“${field.label}” is too long (at most ${MAX_LENGTH[field.kind].toLocaleString("en-NG")} characters).`);
    if (!text) return fail(`“${field.label}” can't be empty. Use Reset to bring back the original wording.`);
    const problem = checkFormat(field, text);
    if (problem) return fail(problem);
    if (text !== field.default) changed[key] = text;
  }

  const overrides = await getTextOverrides();
  if (Object.keys(changed).length) overrides[section] = changed;
  else delete overrides[section];
  await setTextOverrides(overrides);

  refreshStorefront();
  revalidatePath("/admin/content", "layout");
  return { ok: true };
}

export async function saveFontsAction(choice: { heading: string; body: string }): Promise<ContentResult> {
  await requireAdmin();
  if (!isFontId(choice?.heading) || !isFontId(choice?.body)) return fail("Pick a font from the list.");
  await setSiteFonts({ heading: choice.heading, body: choice.body });
  // The fonts are set on <html>, so every page (the dashboard included) is rebuilt.
  revalidatePath("/", "layout");
  return { ok: true };
}
