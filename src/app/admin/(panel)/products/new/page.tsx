import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/product-editor";
import { AdminPage } from "@/components/admin/ui";
import { editorOptions } from "@/lib/admin/editor-data";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const options = await editorOptions();
  return (
    <AdminPage title="Add product" back={{ href: "/admin/products", label: "All products" }}>
      <ProductEditor product={null} {...options} />
    </AdminPage>
  );
}
