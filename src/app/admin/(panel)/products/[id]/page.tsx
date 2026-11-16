import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";
import { AdminPage, Card, OrderStatusBadge, Pill, td, th, cx } from "@/components/admin/ui";
import { REASON_LABEL, formatDate, formatDateTime, formatNumber } from "@/lib/admin/format";
import { editorOptions } from "@/lib/admin/editor-data";
import { formatPrice } from "@/lib/format";
import { automaticPairings } from "@/lib/pairs";
import { listMovements } from "@/lib/store/inventory";
import { PAID_STATUSES, listOrders } from "@/lib/store/orders";
import { getStoredProduct } from "@/lib/store/products";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const product = await getStoredProduct((await params).id);
  return { title: product ? product.name : "Product not found" };
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ created?: string; duplicated?: string }>;
}) {
  const { id } = await params;
  const flags = await searchParams;
  const product = await getStoredProduct(id);
  if (!product) notFound();

  const [options, orders, movements, automatic] = await Promise.all([editorOptions(), listOrders(), listMovements(), automaticPairings(product)]);
  const withProduct = orders.filter((order) => order.items.some((item) => item.productId === id));
  const paid = withProduct.filter((order) => PAID_STATUSES.includes(order.status));
  const units = paid.reduce((n, o) => n + o.items.filter((i) => i.productId === id).reduce((s, i) => s + i.quantity, 0), 0);
  const revenue = paid.reduce((n, o) => n + o.items.filter((i) => i.productId === id).reduce((s, i) => s + i.price * i.quantity, 0), 0);
  const history = movements.filter((m) => m.productId === id).slice(0, 8);

  return (
    <AdminPage
      title={product.name}
      description={
        <>
          Product #{product.id} ·{" "}
          {product.createdAt ? `added ${formatDate(product.createdAt)}` : "imported from WooCommerce"}
          {product.updatedAt ? ` · last edited ${formatDateTime(product.updatedAt)}` : ""}
        </>
      }
      back={{ href: "/admin/products", label: "All products" }}
      actions={product.status === "draft" ? <Pill>Draft — hidden from the store</Pill> : <Pill tone="good">Live on the store</Pill>}
    >
      {flags.created || flags.duplicated ? (
        <p role="status" className="rounded-lg border border-coal-200 bg-coal-50 px-4 py-2.5 text-[0.8rem] font-medium text-coal-700">
          {flags.created ? "Product created." : "Copy created as a draft — edit it, then publish."}
        </p>
      ) : null}

      <ProductEditor product={product} {...options} automaticPairs={automatic.map(({ product: p }) => p.name)}>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Sales" description="From confirmed, dispatched and delivered orders">
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Units sold", value: formatNumber(units) },
                { label: "Revenue", value: formatPrice(revenue) },
                { label: "Orders", value: formatNumber(paid.length) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-sand-50 px-2 py-3">
                  <dt className="text-[0.68rem] font-semibold tracking-wide text-ink-500 uppercase">{stat.label}</dt>
                  <dd className="mt-1 text-[1rem] font-semibold text-ink-900 tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
            {withProduct.length ? (
              <ul className="mt-4 divide-y divide-sand-200/80 text-[0.8rem]">
                {withProduct.slice(0, 5).map((order) => (
                  <li key={order.ref} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/admin/orders/${order.ref}`} className="font-semibold text-coal-700 hover:underline">
                      {order.ref}
                    </Link>
                    <span className="truncate text-ink-600">{order.customer.name}</span>
                    <OrderStatusBadge status={order.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-center text-[0.78rem] text-ink-500">No orders for this product yet.</p>
            )}
          </Card>

          <Card
            title="Stock history"
            flush
            action={
              <Link href={`/admin/inventory/log?product=${product.id}`} className="text-[0.76rem] font-semibold text-coal-700 hover:underline">
                Full log
              </Link>
            }
          >
            {history.length ? (
              <table className="w-full">
                <thead className="bg-sand-50/60">
                  <tr>
                    <th className={th}>When</th>
                    <th className={th}>Reason</th>
                    <th className={cx(th, "text-right")}>Change</th>
                    <th className={cx(th, "text-right")}>After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/70">
                  {history.map((m) => (
                    <tr key={m.id}>
                      <td className={cx(td, "text-[0.74rem] text-ink-500")}>{formatDate(m.at)}</td>
                      <td className={td}>
                        {REASON_LABEL[m.reason]}
                        {m.variantLabel ? <span className="text-ink-500"> · {m.variantLabel}</span> : null}
                      </td>
                      <td className={cx(td, "text-right font-semibold tabular-nums", m.change > 0 ? "text-coal-700" : "text-berry-600")}>
                        {m.change > 0 ? `+${m.change}` : m.change}
                      </td>
                      <td className={cx(td, "text-right tabular-nums")}>{m.after ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-8 text-center text-[0.78rem] text-ink-500">No stock movements recorded yet.</p>
            )}
          </Card>
        </div>
      </ProductEditor>
    </AdminPage>
  );
}
