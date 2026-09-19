import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery & returns",
  description: `How ${site.name} ships orders across Nigeria, and what to do if something is wrong with your order.`,
  alternates: { canonical: "/delivery-returns" },
};

export default function DeliveryReturnsPage() {
  return (
    <LegalPage
      title="Delivery & returns"
      intro="How your order reaches you, what it costs, and what happens if something is not right."
      updated="September 2026"
      sections={[
        {
          heading: "Where we deliver",
          paragraphs: [
            "We dispatch to all 36 states and the Federal Capital Territory through trusted courier partners.",
          ],
          bullets: [
            `Within ${site.address.city}: same or next working day in most cases.`,
            "Elsewhere in Nigeria: typically two to five working days depending on your state and the courier.",
            "Store pickup: choose it at checkout and we will set your order aside for collection.",
          ],
        },
        {
          heading: "Delivery charges",
          paragraphs: [
            "Courier fees in Nigeria depend on the weight of the parcel and the destination, so we confirm the exact amount on WhatsApp before you pay. We never add a fee you have not agreed to.",
            "Orders above ₦50,000 are delivered free anywhere in Nigeria.",
          ],
        },
        {
          heading: "Order confirmation",
          paragraphs: [
            "Every order is confirmed by a person. Once you send your bag through WhatsApp we check that each item is genuinely in stock, tell you the total including delivery, and share account details for transfer. Your order is dispatched once payment reflects.",
          ],
        },
        {
          heading: "If something is wrong",
          paragraphs: [
            "Send photographs on WhatsApp within 48 hours of delivery and we will put it right — a replacement where we have stock, or a refund.",
          ],
          bullets: [
            "Damaged in transit: we replace or refund in full, including delivery.",
            "Wrong item sent: we arrange collection at our cost and send the correct item.",
            "Printing or manufacturing fault: replaced or refunded.",
          ],
        },
        {
          heading: "Returns we cannot accept",
          bullets: [
            "Items returned after 7 days from delivery.",
            "Items that have been used, written in, or are no longer in resellable condition.",
            "Sealed digital or downloadable products once opened.",
            "Items damaged after delivery through normal wear or accident.",
          ],
        },
        {
          heading: "Refunds",
          paragraphs: [
            "Approved refunds are sent back to the account you paid from, usually within five working days of us receiving the returned item or confirming the fault from your photographs.",
          ],
        },
        {
          heading: "Questions",
          paragraphs: [
            `Message us on WhatsApp at ${site.phoneDisplay} or email ${site.email} and a real person will reply.`,
          ],
        },
      ]}
    />
  );
}
