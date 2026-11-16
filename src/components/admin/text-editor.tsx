"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { ArrowDownIcon, ArrowUpIcon, ExternalIcon, InfoIcon, UndoIcon } from "@/components/admin/icons";
import { adminButton, cx, inputClass } from "@/components/admin/ui";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { saveSiteTextAction } from "@/lib/admin/actions/content";
import { SECTIONS, type Field as SchemaField, type ListField, type ScalarField, type SectionKey } from "@/lib/content/schema";

type Item = Record<string, string>;
type Values = Record<string, string | Item[]>;

/** Rows for a textarea so the whole text shows without scrolling, within reason. */
function rowsFor(value: string, min: number) {
  const lines = value.split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 78)), 0);
  return Math.min(Math.max(lines + 1, min), 22);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The dashboard's editor for one page's text: the fields from schema.ts in
 * their groups, each showing when it differs from the original wording with a
 * way back. Saving rebuilds the storefront, so the change shows on the next visit.
 */
export function TextEditor({ section, initial, vars }: { section: SectionKey; initial: Values; vars: Record<string, string> }) {
  const router = useRouter();
  const meta = SECTIONS[section];
  const fields = meta.fields as Record<string, SchemaField>;
  const [draft, setDraft] = useState<Values>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const dirty = JSON.stringify(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  /* Fields in their groups, in the order schema.ts lists them. */
  const groups = useMemo(() => {
    const out: Array<{ title: string; keys: string[] }> = [];
    for (const [key, field] of Object.entries(fields)) {
      const title = field.group ?? "";
      const last = out.at(-1);
      if (last && last.title === title) last.keys.push(key);
      else out.push({ title, keys: [key] });
    }
    return out;
  }, [fields]);

  const editedCount = Object.entries(fields).filter(([key, field]) => !same(draft[key], field.default)).length;

  const set = (key: string, value: string | Item[]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveSiteTextAction(section, draft);
      if (!result.ok) {
        setError(result.error);
        requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      }
      setBaseline(JSON.stringify(draft));
      setNotice("Saved. The website shows the new text now.");
      router.refresh();
    });
  };

  const resetAll = () => {
    if (!window.confirm(`Put every field on “${meta.title}” back to the original wording? Nothing is saved until you press Save.`)) return;
    setDraft(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.default])) as Values);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="min-w-0"
    >
      <FillIns vars={vars} />

      <div className="mt-5 space-y-5">
        {groups.map((group) => (
          <section key={group.title} className="rounded-xl border border-sand-200 bg-white shadow-[0_1px_2px_rgb(22_19_15/0.04)]">
            {group.title ? (
              <h2 className="border-b border-sand-200 px-5 py-3.5 font-sans text-[0.95rem] font-semibold tracking-normal text-ink-900">{group.title}</h2>
            ) : null}
            <div className="space-y-5 p-5">
              {group.keys.map((key) => {
                const field = fields[key];
                return field.kind === "list" ? (
                  <ListEditor key={key} field={field} value={draft[key] as Item[]} onChange={(value) => set(key, value)} />
                ) : (
                  <ScalarEditor key={key} field={field} value={draft[key] as string} onChange={(value) => set(key, value)} />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Stays in view at the bottom of the screen while scrolling through long pages. */}
      <div className="sticky bottom-3 z-20 mt-6 rounded-xl border border-sand-200 bg-white/95 px-4 py-3 shadow-[0_12px_32px_-16px_rgb(20_17_10/0.35)] backdrop-blur">
        {error ? (
          <p ref={errorRef} role="alert" className="mb-2.5 rounded-lg bg-berry-500/8 px-3 py-2 text-[0.8rem] font-medium text-berry-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-[0.78rem] text-ink-500" aria-live="polite">
            {notice ? (
              <span className="font-medium text-coal-700">{notice}</span>
            ) : dirty ? (
              <span className="font-medium text-gold-700">Unsaved changes</span>
            ) : editedCount ? (
              `${editedCount} ${editedCount === 1 ? "field differs" : "fields differ"} from the original`
            ) : (
              "Showing the original wording"
            )}
          </p>
          {editedCount ? (
            <button type="button" onClick={resetAll} className={adminButton({ variant: "ghost", size: "sm" })}>
              <UndoIcon className="size-3.5" />
              Reset page
            </button>
          ) : null}
          {meta.href ? (
            <Link href={meta.href} target="_blank" className={adminButton({ variant: "secondary", size: "sm" })}>
              <ExternalIcon className="size-3.5" />
              View page
            </Link>
          ) : null}
          <button type="submit" disabled={pending || !dirty} className={adminButton({ size: "sm" })}>
            {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ fill-ins */

function FillIns({ vars }: { vars: Record<string, string> }) {
  return (
    <details className="group rounded-xl border border-sand-200 bg-sand-50 px-5 py-3.5 text-[0.8rem] text-ink-600">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-ink-800 [&::-webkit-details-marker]:hidden">
        <InfoIcon className="size-4 shrink-0 text-ink-500" />
        Fill-ins: words in {"{curly brackets}"} that the website replaces
        <span className="ml-auto text-[0.72rem] font-normal text-ink-500 group-open:hidden">Show</span>
        <span className="ml-auto hidden text-[0.72rem] font-normal text-ink-500 group-open:inline">Hide</span>
      </summary>
      <p className="mt-3 leading-relaxed">
        Type one of these anywhere, brackets included, and visitors see the value beside it. They follow the Store details page, so
        changing the phone number there changes it everywhere.
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {Object.entries(vars).map(([name, value]) => (
          <div key={name} className="flex min-w-0 gap-2">
            <dt className="shrink-0 font-mono text-[0.74rem] text-coal-700">{`{${name}}`}</dt>
            <dd className="truncate text-ink-500" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/* ------------------------------------------------------------ fields */

function EditedBadge({ onReset }: { onReset: () => void }) {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      <span className="rounded-full bg-gold-400/25 px-2 py-px text-[0.66rem] font-semibold text-gold-800">Edited</span>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.72rem] font-medium text-ink-500 transition hover:bg-sand-100 hover:text-ink-900"
      >
        <UndoIcon className="size-3" />
        Reset
      </button>
    </span>
  );
}

function ScalarInput({
  id,
  field,
  value,
  onChange,
  compact = false,
}: {
  id: string;
  field: ScalarField;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  if (field.kind === "text") {
    return (
      <input
        id={id}
        value={value}
        dir="auto"
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
        inputMode={field.check === "digits" ? "numeric" : field.check === "email" ? "email" : field.check === "url" ? "url" : undefined}
      />
    );
  }
  return (
    <textarea
      id={id}
      value={value}
      dir="auto"
      rows={rowsFor(value, field.kind === "rich" ? (compact ? 3 : 5) : 2)}
      onChange={(event) => onChange(event.target.value)}
      className={cx(inputClass, "resize-y leading-relaxed")}
    />
  );
}

function ScalarEditor({ field, value, onChange }: { field: ScalarField; value: string; onChange: (value: string) => void }) {
  const id = useId();
  const edited = value !== field.default;
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2">
        <label htmlFor={id} className="text-[0.76rem] font-semibold text-ink-700">
          {field.label}
        </label>
        {edited ? <EditedBadge onReset={() => onChange(field.default)} /> : null}
      </div>
      <ScalarInput id={id} field={field} value={value} onChange={onChange} />
      {field.hint ? <p className="mt-1 text-[0.72rem] leading-relaxed text-ink-500">{field.hint}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------ lists */

function ListEditor({ field, value, onChange }: { field: ListField; value: Item[]; onChange: (value: Item[]) => void }) {
  const baseId = useId();
  const subFields = Object.entries(field.fields);
  /* Short entries (a name and a role, a state and its bus stop) sit side by side. */
  const sideBySide = subFields.every(([, sub]) => sub.kind === "text");
  const max = field.max ?? 50;
  const edited = !same(value, field.default);

  const update = (index: number, key: string, text: string) => onChange(value.map((item, i) => (i === index ? { ...item, [key]: text } : item)));
  const move = (index: number, by: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };
  const remove = (index: number) => {
    const name = value[index][field.titleKey]?.trim();
    if (name && !window.confirm(`Remove “${name.length > 60 ? `${name.slice(0, 60)}…` : name}”?`)) return;
    onChange(value.filter((_, i) => i !== index));
  };
  const add = () => onChange([...value, Object.fromEntries(subFields.map(([key]) => [key, ""]))]);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[0.76rem] font-semibold text-ink-700">
          {field.label} <span className="font-normal text-ink-500">({value.length})</span>
        </p>
        {edited ? <EditedBadge onReset={() => onChange(field.default)} /> : null}
      </div>
      {field.hint ? <p className="-mt-1 mb-3 text-[0.72rem] leading-relaxed text-ink-500">{field.hint}</p> : null}

      <ol className="space-y-3">
        {value.map((item, index) => (
          <li key={index} className="rounded-lg border border-sand-200 bg-sand-50/60 p-3.5">
            <div className="mb-2.5 flex items-center gap-1">
              <span className="mr-auto min-w-0 truncate text-[0.72rem] font-semibold tracking-wide text-ink-500 uppercase">
                {field.item} {index + 1}
              </span>
              <IconButton label={`Move ${field.item} ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUpIcon className="size-3.5" />
              </IconButton>
              <IconButton label={`Move ${field.item} ${index + 1} down`} disabled={index === value.length - 1} onClick={() => move(index, 1)}>
                <ArrowDownIcon className="size-3.5" />
              </IconButton>
              <IconButton label={`Remove ${field.item} ${index + 1}`} disabled={value.length <= 1} onClick={() => remove(index)} danger>
                <TrashIcon className="size-3.5" />
              </IconButton>
            </div>
            <div className={cx("grid gap-3", sideBySide && "sm:grid-cols-2")}>
              {subFields.map(([key, sub]) => {
                const id = `${baseId}-${index}-${key}`;
                return (
                  <div key={key} className="min-w-0">
                    <label htmlFor={id} className="mb-1 block text-[0.72rem] font-medium text-ink-600">
                      {sub.label}
                    </label>
                    <ScalarInput id={id} field={sub} value={item[key] ?? ""} onChange={(text) => update(index, key, text)} compact />
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <button type="button" onClick={add} disabled={value.length >= max} className={cx(adminButton({ variant: "secondary", size: "sm" }), "mt-3")}>
        <PlusIcon className="size-3.5" />
        Add {field.item}
      </button>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "grid size-8 place-items-center rounded-md text-ink-500 transition hover:bg-white disabled:pointer-events-none disabled:opacity-30",
        danger ? "hover:text-berry-600" : "hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}
