import type { Metadata } from "next";
import { CartPageBody } from "@/components/cart-page";
import { PageHeader } from "@/components/page-header";
import { Container } from "@/components/ui";
import { getSiteText } from "@/lib/content/text";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the items in your bag before checking out.",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const { shopping: t } = await getSiteText();
  return (
    <>
      <PageHeader
        eyebrow={t.bagEyebrow}
        title={t.bagTitle}
        trail={[{ label: "Home", href: "/" }, { label: t.bagTitle }]}
      />
      <Container className="py-10 sm:py-12">
        <CartPageBody />
      </Container>
    </>
  );
}
