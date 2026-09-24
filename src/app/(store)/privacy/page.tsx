import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} handles the personal information you share when you shop with us.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What we collect, why we collect it, and what we will never do with it."
      updated="September 2026"
      sections={[
        {
          heading: "What we collect",
          paragraphs: [
            "We only ask for what an order needs. When you check out you give us your name, phone number, delivery address and — if you choose — an email address.",
          ],
          bullets: [
            "Order details: the items in your bag, quantities and the total.",
            "Contact details: name, phone number and optional email address.",
            "Delivery details: state, city and street address, plus any note you add.",
          ],
        },
        {
          heading: "What stays on your device",
          paragraphs: [
            "Your shopping bag is stored in your own browser, not on our servers. It stays there until you clear it or clear your browser data, and we cannot read it until you choose to send us your order.",
          ],
        },
        {
          heading: "How we use it",
          bullets: [
            "To confirm your order, quote delivery and arrange dispatch.",
            "To contact you about that order, including if something is out of stock.",
            "To answer questions you send us.",
          ],
        },
        {
          heading: "What we do not do",
          bullets: [
            "We do not sell, rent or trade your details to anybody.",
            "We do not send marketing messages to people who have not asked for them.",
            "We do not collect card or bank details on this website — payment is arranged directly with you by bank transfer.",
          ],
        },
        {
          heading: "Who else sees your details",
          paragraphs: [
            "Only the courier handling your parcel, and only the details needed to deliver it. Orders sent through WhatsApp are also subject to WhatsApp's own privacy terms.",
          ],
        },
        {
          heading: "Keeping your information",
          paragraphs: [
            "We keep order records for as long as we need them for accounting and to help with any later question about your order. You can ask us to delete your details at any time.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `Write to ${site.email} to ask what we hold about you, to correct it, or to have it deleted. We will respond within a reasonable time.`,
          ],
        },
      ]}
    />
  );
}
