import type { Metadata } from "next";
import { Accordion } from "@/components/accordion";
import { PageHeader } from "@/components/page-header";
import { WhatsappIcon } from "@/components/icons";
import { Container, buttonClass, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
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
      "Because delivery fees in Nigeria depend on weight and destination, and because we would rather confirm everything in your bag is genuinely in stock before taking your money. It also means you can ask questions while you order.",
  },
  {
    question: "How do I pay?",
    answer:
      "By bank transfer once we have confirmed your order and the total including delivery. We send the account details on WhatsApp and dispatch as soon as payment reflects.",
  },
  {
    question: "How much is delivery?",
    answer:
      `Within Kaduna metropolis and Zaria it is ${formatPrice(site.delivery.kadunaFee)} for small-sized items; larger Zaria packages may attract an extra park fee. Interstate orders go through the parks and need a waybill fee added at checkout. Orders from ${formatPrice(site.freeDeliveryThreshold)} ship free anywhere in Nigeria.`,
  },
  {
    question: "How quickly do you dispatch?",
    answer:
      `Kaduna orders are dispatched within ${site.delivery.dispatchHours} hours of payment. Interstate park dispatches run on ${site.delivery.interstateDays}. If dispatch happens on any other day, we let you know.`,
  },
  {
    question: "Which states do you deliver to?",
    answer:
      "All of them. We dispatch through interstate parks with a listed bus stop for each state — Abuja, Adamawa, Bauchi, Borno, Gombe, Jigawa, Kano, Katsina, Kebbi, Kwara, Lagos, Nasarawa, Niger, Oyo, Plateau, Rivers, Sokoto, Taraba and Zamfara. The full list is on our delivery page.",
  },
  {
    question: "Can I collect my order instead?",
    answer:
      `Yes. Pickups run at weekends only — ${site.pickup.days}, ${site.pickup.time}. The full address is shared privately once your order is confirmed. Kindly call at least an hour before coming and have your order reference ready.`,
  },
  {
    question: "Can I return something?",
    answer:
      "Items delivered in perfect and acceptable condition are final sales — this keeps every product new and untampered for the next family. If the wrong item arrives, or something is damaged in transit, message us within 48 hours with photographs and we will replace it or refund you in full.",
  },
  {
    question: "What if my parcel sits at the park?",
    answer:
      "Parks typically charge ₦300 to ₦1,000 storage if an item is not collected directly from the driver, and it rises the longer it stays. Those charges are not ours. Please collect park deliveries within 3 days of dispatch.",
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
        description="Ordering, payment, delivery, pickup and returns — answered plainly."
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
