import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Choose delivery and pay securely with Paystack: card, bank transfer or USSD.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Final step"
        title="Checkout"
        description="Your details, a delivery option, then pay securely with Paystack by card, bank transfer or USSD."
        trail={[{ label: "Home", href: "/" }, { label: "Bag", href: "/cart" }, { label: "Checkout" }]}
      />
      <Container className="py-10 sm:py-12">
        <CheckoutForm />
      </Container>
    </>
  );
}
