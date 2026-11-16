import { PageHeader } from "@/components/page-header";
import { RichText } from "@/components/rich-text";
import { Container } from "@/components/ui";
import { getSiteText } from "@/lib/content/text";

export type LegalSection = { heading: string; body: string };

/** A policy page: its sections come from the dashboard, as paragraphs and bullet points. */
export async function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  const { pages } = await getSiteText();
  return (
    <>
      <PageHeader eyebrow={pages.policyEyebrow} title={title} description={intro} trail={[{ label: "Home", href: "/" }, { label: title }]} />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.76rem] tracking-wide text-ink-500 uppercase">
            {pages.updatedLabel} {updated}
          </p>

          <div className="mt-8 space-y-9">
            {sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-xl sm:text-2xl">{section.heading}</h2>
                <RichText
                  text={section.body}
                  paragraphClassName="mt-3 text-[0.9rem] leading-relaxed text-ink-600"
                  listClassName="mt-3 space-y-2"
                  itemClassName="relative pl-5 text-[0.9rem] leading-relaxed text-ink-600 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rotate-45 before:bg-gold-400 before:content-['']"
                />
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
