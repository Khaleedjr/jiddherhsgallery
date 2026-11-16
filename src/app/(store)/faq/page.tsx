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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.intro}
        trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion items={t.items} />

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
