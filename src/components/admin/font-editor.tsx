"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { UndoIcon } from "@/components/admin/icons";
import { adminButton, cx } from "@/components/admin/ui";
import { CheckIcon } from "@/components/icons";
import { saveFontsAction } from "@/lib/admin/actions/content";
import { DEFAULT_FONTS, FONT_OPTIONS, fontById, fontStack, type FontChoice, type FontId } from "@/lib/fonts";

const ROLES = [
  { key: "heading", title: "Headings", description: "Page titles, section headings, prices and product names in large type.", sample: "Nurturing towards Jannah" },
  {
    key: "body",
    title: "Text",
    description: "Paragraphs, menus, buttons, forms: everything that isn't a heading.",
    sample: "Islamic books, toys and ibadah essentials for every age, sent from Kaduna to all of Nigeria.",
  },
] as const;

/** Picks the heading and text fonts, with a live sample of the pair before saving. */
export function FontEditor({ initial }: { initial: FontChoice }) {
  const router = useRouter();
  const [choice, setChoice] = useState<FontChoice>(initial);
  const [saved, setSaved] = useState<FontChoice>(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = choice.heading !== saved.heading || choice.body !== saved.body;
  const isDefault = choice.heading === DEFAULT_FONTS.heading && choice.body === DEFAULT_FONTS.body;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveFontsAction(choice);
      if (!result.ok) return setError(result.error);
      setSaved(choice);
      setNotice("Saved. The website uses these fonts now.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      {/* The pair together, as a visitor would see it. */}
      <section className="rounded-xl border border-sand-200 bg-white p-6 shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
        <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-ink-500 uppercase">Preview</p>
        <p className="mt-3 text-[2rem] leading-[1.05] font-bold tracking-[-0.02em] text-ink-900 sm:text-[2.6rem]" style={{ fontFamily: fontStack(choice.heading) }}>
          Begin where your child is
        </p>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-600" style={{ fontFamily: fontStack(choice.body) }}>
          Tell us the age, the budget and the occasion. We will put a bundle together and send you photos before you pay.
        </p>
        <p className="mt-4 text-[0.76rem] text-ink-500">
          Headings in <strong className="font-semibold text-ink-700">{fontById(choice.heading).name}</strong>, text in{" "}
          <strong className="font-semibold text-ink-700">{fontById(choice.body).name}</strong>.
        </p>
      </section>

      {ROLES.map((role) => (
        <section key={role.key} className="rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
          <div className="border-b border-sand-200 px-5 py-3.5">
            <h2 className="font-sans text-[0.95rem] font-semibold tracking-normal text-ink-900">{role.title}</h2>
            <p className="mt-0.5 text-[0.76rem] text-ink-500">{role.description}</p>
          </div>
          <div role="radiogroup" aria-label={`${role.title} font`} className="grid gap-2.5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {FONT_OPTIONS.map((font) => {
              const selected = choice[role.key] === font.id;
              const original = DEFAULT_FONTS[role.key] === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChoice((current) => ({ ...current, [role.key]: font.id as FontId }))}
                  className={cx(
                    "relative flex flex-col rounded-lg border p-3.5 text-left transition",
                    selected ? "border-coal-900 bg-sand-50 ring-1 ring-coal-900" : "border-sand-200 hover:border-sand-400",
                  )}
                >
                  <span className="flex items-center gap-2 pr-6 text-[0.72rem] font-semibold text-ink-600">
                    {font.name}
                    {original ? <span className="rounded-full bg-sand-200 px-1.5 py-px text-[0.6rem] font-semibold text-ink-600">Original</span> : null}
                  </span>
                  <span
                    className={cx("mt-1.5 text-ink-900", role.key === "heading" ? "text-[1.35rem] leading-tight font-bold" : "text-[0.9rem] leading-snug")}
                    style={{ fontFamily: fontStack(font.id) }}
                  >
                    {role.key === "heading" ? role.sample : role.sample.slice(0, 64) + "…"}
                  </span>
                  <span className="mt-1.5 text-[0.7rem] leading-snug text-ink-500">{font.note}</span>
                  {selected ? (
                    <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-coal-900 text-gold-400">
                      <CheckIcon className="size-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-3 z-20 rounded-xl border border-sand-200 bg-white/95 px-4 py-3 shadow-[0_12px_32px_-16px_rgb(20_17_10/0.35)] backdrop-blur">
        {error ? (
          <p role="alert" className="mb-2.5 rounded-lg bg-berry-500/8 px-3 py-2 text-[0.8rem] font-medium text-berry-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-[0.78rem] text-ink-500" aria-live="polite">
            {notice ? <span className="font-medium text-coal-700">{notice}</span> : dirty ? <span className="font-medium text-gold-700">Unsaved changes</span> : "These are the fonts on the website"}
          </p>
          {!isDefault ? (
            <button type="button" onClick={() => setChoice(DEFAULT_FONTS)} className={adminButton({ variant: "ghost", size: "sm" })}>
              <UndoIcon className="size-3.5" />
              Original fonts
            </button>
          ) : null}
          <button type="button" onClick={save} disabled={pending || !dirty} className={adminButton({ size: "sm" })}>
            {pending ? "Saving…" : dirty ? "Save fonts" : "Saved"}
          </button>
        </div>
      </div>
    </div>
  );
}
