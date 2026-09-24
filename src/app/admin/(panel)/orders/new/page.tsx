import type { Metadata } from "next";
import { ManualOrderForm, type KnownCustomer, type PickerProduct } from "@/components/admin/manual-order-form";
import { AdminPage } from "@/components/admin/ui";
import { buildCustomers } from "@/lib/store/customers";
import { listOrders } from "@/lib/store/orders";
import { listProducts } from "@/lib/store/products";

export const metadata: Metadata = { title: "Record an order" };

export default async function NewOrderPage() {
  const [products, orders] = await Promise.all([listProducts(), listOrders()]);
  const picker: PickerProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.images[0] ?? null,
    price: p.price,
    stock: p.stock,
    inStock: p.inStock,
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, stock: v.stock, inStock: v.inStock })),
  }));
  const customers: KnownCustomer[] = buildCustomers(orders.filter((o) => !o.demo))
    .slice(0, 300)
    .map(({ key, name, phone, email, state, city }) => ({ key, name, phone, email, state, city }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AdminPage
      title="Record an order"
      description="For orders that came in on WhatsApp, Instagram or in person, so they count in your stock and reports."
      back={{ href: "/admin/orders", label: "All orders" }}
    >
      <ManualOrderForm products={picker} customers={customers} />
    </AdminPage>
  );
}
