import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui";
import { getSiteText } from "@/lib/content/text";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Choose delivery and pay securely with Paystack: card, bank transfer or USSD.",
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  const { shopping: t } = await getSiteText();
  return (
    <>
      <PageHeader
        eyebrow={t.checkoutEyebrow}
        title={t.checkoutTitle}
        description={t.checkoutIntro}
        trail={[{ label: "Home", href: "/" }, { label: "Bag", href: "/cart" }, { label: "Checkout" }]}
      />
      <Container className="py-10 sm:py-12">
        <CheckoutForm />
      </Container>
    </>
  );
}
