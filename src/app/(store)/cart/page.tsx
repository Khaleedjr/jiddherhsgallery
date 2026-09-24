import type { Metadata } from "next";
import { CartPageBody } from "@/components/cart-page";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the items in your bag before checking out.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Almost there"
        title="Your bag"
        trail={[{ label: "Home", href: "/" }, { label: "Bag" }]}
      />
      <Container className="py-10 sm:py-12">
        <CartPageBody />
      </Container>
    </>
  );
}
