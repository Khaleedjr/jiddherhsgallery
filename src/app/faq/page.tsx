import type { Metadata } from "next";
import { Accordion } from "@/components/accordion";
import { PageHeader } from "@/components/page-header";
import { WhatsappIcon } from "@/components/icons";
import { Container, buttonClass, cx } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: `Answers about ordering, payment, delivery and returns at ${site.name}.`,
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    question: "How do I place an order?",
    answer:
      "Add what you want to your bag and go to checkout. Fill in your details and tap ‘Send my order on WhatsApp’ — the message arrives with us already filled in. We confirm stock and the delivery fee, you pay by transfer, and we dispatch.",
  },
  {
    question: "Why does checkout go to WhatsApp instead of taking my card?",
    answer:
      "Because delivery fees in Nigeria depend on weight and destination, and because we would rather confirm that everything in your bag is genuinely in stock before taking your money. It also means you can ask questions while you order.",
  },
  {
    question: "How do I pay?",
    answer:
      "By bank transfer once we have confirmed your order and the total including delivery. We send the account details on WhatsApp and dispatch as soon as payment reflects.",
  },
  {
    question: "How long does delivery take?",
    answer:
      `Orders within ${site.address.city} usually arrive the same or next working day. Elsewhere in Nigeria, courier delivery typically takes two to five working days depending on your state.`,
  },
  {
    question: "Do you deliver outside my state?",
    answer:
      "Yes — we dispatch to all 36 states and the FCT. Orders above ₦50,000 ship free anywhere in Nigeria.",
  },
  {
    question: "Can I collect my order instead?",
    answer:
      `Of course. Choose ‘Pick up in store’ at checkout and we will set your order aside at our ${site.address.city} store.`,
  },
  {
    question: "Something arrived damaged or wrong. What now?",
    answer:
      "Send us photographs on WhatsApp within 48 hours of delivery and we will replace the item or refund you. We would rather fix it than argue about it.",
  },
  {
    question: "Are the books suitable for my child's age?",
    answer:
      "Every product is filed under one or more age brackets, and you can browse by age from the main menu. If you are still unsure, message us with your child's age and we will recommend something honestly — including telling you when something is not worth it.",
  },
  {
    question: "Do you supply schools and madaaris?",
    answer:
      `Yes. Email ${site.email} or message us on WhatsApp with your list and we will quote bulk pricing.`,
  },
  {
    question: "How do you choose what to stock?",
    answer:
      "Every book is read and checked against sound aqeedah before it reaches the shelf, and toys are tested for durability. If we would not give it to our own children, it does not go in the gallery.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        eyebrow="Help centre"
        title="Frequently asked questions"
        description="Ordering, payment, delivery and returns — answered plainly."
        trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion items={FAQS} />

          <div className="mt-10 rounded-xl border border-sand-200 bg-sand-100 p-7 text-center">
            <h2 className="text-xl">Still have a question?</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.86rem] leading-relaxed text-ink-600">
              Message us on WhatsApp — we usually reply within the hour during store days.
            </p>
            <a
              href={whatsappLink(`As-salamu alaykum ${site.name}, I have a question.`)}
              target="_blank"
              rel="noreferrer"
              className={cx(buttonClass({ variant: "whatsapp", size: "lg" }), "mt-6")}
            >
              <WhatsappIcon className="size-4" />
              Chat with us
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
