import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms that apply when you order from ${site.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="The plain terms that apply when you shop with us."
      updated="September 2026"
      sections={[
        {
          heading: "About these terms",
          paragraphs: [
            `These terms apply to orders placed with ${site.name} through this website, WhatsApp, or in store. By placing an order you accept them.`,
          ],
        },
        {
          heading: "Products and prices",
          paragraphs: [
            "We describe and photograph every product as accurately as we can. Print runs and dye lots vary, so colours may differ slightly from the photographs.",
            "Prices are in Nigerian naira and exclude delivery. We may change prices at any time, but never after we have confirmed your order.",
          ],
        },
        {
          heading: "Stock and order confirmation",
          paragraphs: [
            "An order placed on this website is complete once your payment has gone through on Paystack. In the rare case that an item sells out before we can send it, we will tell you straight away and offer an alternative or a refund for that item.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Website orders are paid at checkout through Paystack, by card, bank transfer or USSD. Payment is taken on Paystack's own page, so card details never reach this website. Orders arranged with us directly (for example on WhatsApp or in person) may be paid by transfer, cash or POS.",
          ],
        },
        {
          heading: "Delivery",
          paragraphs: [
            "Delivery times quoted are estimates given in good faith and depend on the courier. Risk in the goods passes to you on delivery. Our delivery and returns policy forms part of these terms.",
          ],
        },
        {
          heading: "Cancellations",
          paragraphs: [
            "You may cancel any order before it is dispatched and we will refund you in full. Once a parcel is with the courier, the returns policy applies instead.",
          ],
        },
        {
          heading: "Use of this website",
          bullets: [
            "The text, photographs and design on this site belong to us and may not be copied for commercial use without permission.",
            "Do not attempt to disrupt the site or access it in a way that harms other users.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "Our responsibility for any order is limited to the value of that order. Nothing in these terms removes rights you have under Nigerian consumer law.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These terms are governed by the laws of the Federal Republic of Nigeria.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Questions about these terms: ${site.email} or ${site.phoneDisplay}.`],
        },
      ]}
    />
  );
}
