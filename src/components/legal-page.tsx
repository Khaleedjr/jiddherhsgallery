import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
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
  return (
    <>
      <PageHeader
        eyebrow="Store policy"
        title={title}
        description={intro}
        trail={[{ label: "Home", href: "/" }, { label: title }]}
      />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.76rem] tracking-wide text-ink-500 uppercase">Last updated {updated}</p>

          <div className="mt-8 space-y-9">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl sm:text-2xl">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-[0.9rem] leading-relaxed text-ink-600">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="relative pl-5 text-[0.9rem] leading-relaxed text-ink-600 before:absolute before:top-[0.6em] before:left-0 before:size-1.5 before:rotate-45 before:bg-gold-400 before:content-['']"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
