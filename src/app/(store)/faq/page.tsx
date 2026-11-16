import type { Metadata } from "next";
import { Accordion } from "@/components/accordion";
import { PageHeader } from "@/components/page-header";
import { WhatsappIcon } from "@/components/icons";
import { Container, buttonClass, cx } from "@/components/ui";
import { plainText, whatsappHref } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { faq } = await getSiteText();
  return { title: faq.title, description: faq.seoDescription, alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  const { faq: t, store } = await getSiteText();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: plainText(faq.answer) },
    })),
  };

  /* Questions gathered under their topics, in the order the topics first appear. */
  const topics: Array<{ name: string; id: string; items: typeof t.items }> = [];
  for (const item of t.items) {
    const name = item.topic?.trim() || "Questions";
    const group = topics.find((topic) => topic.name === name);
    if (group) group.items.push(item);
    else topics.push({ name, id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "questions", items: [item] });
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.intro}
        trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      >
        {topics.length > 1 ? (
          <nav aria-label="FAQ topics" className="mt-7 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <a
                key={topic.id}
                href={`#${topic.id}`}
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-coal-900 px-4 py-2 text-[0.82rem] font-semibold text-coal-900 transition hover:bg-coal-900 hover:text-gold-500"
              >
                {topic.name}
                <span className="text-[0.72rem] font-medium opacity-70 tabular-nums">{topic.items.length}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </PageHeader>

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-12">
            {topics.map((topic, index) => (
              <section key={topic.id} id={topic.id} aria-labelledby={`${topic.id}-title`} className="scroll-mt-[calc(var(--header-h)+1.5rem)]">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h2 id={`${topic.id}-title`} className="text-2xl sm:text-3xl">
                    {topic.name}
                  </h2>
                  <span className="text-[0.72rem] font-semibold tracking-[0.18em] text-ink-500 uppercase tabular-nums">
                    {topic.items.length} {topic.items.length === 1 ? "question" : "questions"}
                  </span>
                </div>
                <Accordion items={topic.items} defaultOpen={index === 0 ? 0 : null} />
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-sand-200 bg-sand-100 p-7 text-center">
            <h2 className="text-xl">{t.askTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.86rem] leading-relaxed text-ink-600">{t.askText}</p>
            <a
              href={whatsappHref(store.whatsapp, t.askMessage)}
              target="_blank"
              rel="noreferrer"
              className={cx(buttonClass({ variant: "whatsapp", size: "lg" }), "mt-6")}
            >
              <WhatsappIcon className="size-4" />
              {t.askButton}
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
