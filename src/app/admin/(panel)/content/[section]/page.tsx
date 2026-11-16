import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextEditor } from "@/components/admin/text-editor";
import { SECTIONS, isSectionKey } from "@/lib/content/schema";
import { getSiteText, getTextOverrides, globalVars, sectionValues } from "@/lib/content/text";
import { getDeliverySettings } from "@/lib/delivery";

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: isSectionKey(section) ? `${SECTIONS[section].title} · Website text` : "Website text" };
}

export default async function ContentSectionPage({ params }: Props) {
  const { section } = await params;
  if (!isSectionKey(section)) notFound();
  const [overrides, text, delivery] = await Promise.all([getTextOverrides(), getSiteText(), getDeliverySettings()]);
  const meta = SECTIONS[section];

  return (
    <>
      <div className="mb-5">
        <h2 className="font-display text-2xl leading-tight font-semibold">{meta.title}</h2>
        <p className="mt-1 text-[0.84rem] text-ink-500">{meta.description}</p>
      </div>
      {/* Keyed by page so moving between pages starts each editor fresh. */}
      <TextEditor key={section} section={section} initial={sectionValues(section, overrides)} vars={globalVars(text.store, delivery)} />
    </>
  );
}
