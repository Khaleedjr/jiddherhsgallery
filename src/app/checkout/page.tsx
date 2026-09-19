import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Send your order to Jidderh's Gallery on WhatsApp and we will confirm it right away.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Final step"
        title="Checkout"
        description="Fill in your details and send the order straight to our WhatsApp — we confirm stock and delivery before you pay a naira."
        trail={[{ label: "Home", href: "/" }, { label: "Bag", href: "/cart" }, { label: "Checkout" }]}
      />
      <Container className="py-10 sm:py-12">
        <CheckoutForm />
      </Container>
    </>
  );
}
