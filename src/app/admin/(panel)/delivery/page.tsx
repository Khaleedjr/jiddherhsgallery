import type { Metadata } from "next";
import { DeliveryEditor } from "@/components/admin/delivery-editor";
import { AdminPage } from "@/components/admin/ui";
import { getSiteText } from "@/lib/content/text";
import { deliveryVars, getDeliverySettings } from "@/lib/delivery";

export const metadata: Metadata = { title: "Delivery" };

export default async function DeliveryPage() {
  const [settings, { store }] = await Promise.all([getDeliverySettings(), getSiteText()]);
  return (
    <AdminPage
      title="Delivery"
      description="Shipping zones and fees, free delivery and pickup. Checkout offers exactly these, and every order is priced from them."
    >
      <DeliveryEditor initial={settings} vars={deliveryVars(store)} />
    </AdminPage>
  );
}
