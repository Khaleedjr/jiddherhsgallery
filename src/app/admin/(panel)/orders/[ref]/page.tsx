import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/admin/controls";
import { ChargesForm, EditableCustomer, NoteForm, OrderStatusForm, PrintButton, ReceiptForm } from "@/components/admin/order-forms";
import { AdminPage, Card, OrderStatusBadge, Pill, Thumb, adminButton, cx } from "@/components/admin/ui";
import { WhatsappIcon } from "@/components/icons";
import { deleteOrderAction } from "@/lib/admin/actions/orders";
import { CHANNEL_LABEL, PAYMENT_LABEL, STATUS_META, formatDateTime, whatsappNumber } from "@/lib/admin/format";
import { formatPrice } from "@/lib/format";
import { phoneKey } from "@/lib/store/customers";
import { getOrder, listOrders } from "@/lib/store/orders";
import { site } from "@/lib/site";

type Params = { ref: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `Order ${(await params).ref.toUpperCase()}` };
}

export default async function OrderPage({ params }: { params: Promise<Params> }) {
  const { ref } = await params;
  const order = await getOrder(ref);
  if (!order) notFound();

  const key = phoneKey(order.customer.phone);
  const previous = (await listOrders()).filter((o) => phoneKey(o.customer.phone) === key && o.ref !== order.ref);
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const greeting = `As-salamu alaykum ${order.customer.name.split(" ")[0]}, this is ${site.name} about your order ${order.ref}.`;

  return (
    <AdminPage
      title={
        <span className="flex flex-wrap items-center gap-3">
          Order {order.ref}
          <OrderStatusBadge status={order.status} className="text-[0.75rem]" />
          {order.demo ? <Pill>Sample</Pill> : null}
        </span>
      }
      description={`${formatDateTime(order.createdAt)} · ${CHANNEL_LABEL[order.channel]} · ${units} ${units === 1 ? "item" : "items"}`}
      back={{ href: "/admin/orders", label: "All orders" }}
      actions={
        <>
          <a
            href={`https://wa.me/${whatsappNumber(order.customer.phone)}?text=${encodeURIComponent(greeting)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={adminButton({ variant: "secondary" })}
          >
            <WhatsappIcon className="size-4 text-[#1a9e4a]" />
            Message customer
          </a>
          <PrintButton />
        </>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Items" flush>
            <ul className="divide-y divide-sand-200/80">
              {order.items.map((item, index) => (
                <li key={`${item.productId}-${item.variantId}-${index}`} className="flex items-center gap-3 px-5 py-3.5">
                  <Thumb src={item.image} alt="" size={48} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.productId}`} className="line-clamp-2 text-[0.84rem] font-semibold text-ink-900 hover:text-coal-700">
                      {item.name}
                    </Link>
                    <p className="text-[0.74rem] text-ink-500">
                      {item.variantLabel ? `${item.variantLabel} · ` : ""}
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-[0.86rem] font-semibold text-ink-900 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-sand-200 bg-sand-50/50 px-5 py-4 text-[0.84rem]">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Delivery</dt>
                <dd className="tabular-nums">{order.deliveryFee ? formatPrice(order.deliveryFee) : order.fulfilment === "pickup" ? "Pickup" : "Not set"}</dd>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-coal-700">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-sand-200 pt-2.5">
                <dt className="font-semibold text-ink-900">Total</dt>
                <dd className="font-display text-2xl font-semibold text-coal-900 tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <div className="border-t border-sand-200 px-5 py-4 print:hidden">
              <ChargesForm order={order} />
            </div>
          </Card>

          <Card title="Timeline" description="Status changes and private notes">
            <ol className="relative space-y-4 border-l border-sand-300 pl-5">
              {[...order.history].reverse().map((event, index) => (
                <li key={`${event.at}-${index}`} className="relative">
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-1 -left-[1.62rem] size-3 rounded-full border-2 border-white",
                      event.status ? "bg-coal-600" : "bg-gold-400",
                    )}
                  />
                  <p className="text-[0.8rem] font-semibold text-ink-900">
                    {event.status ? STATUS_META[event.status].label : "Note"}
                    <span className="ml-2 text-[0.72rem] font-normal text-ink-500">
                      {formatDateTime(event.at)} · {event.by === "customer" ? "Customer" : event.by === "admin" ? "You" : "System"}
                    </span>
                  </p>
                  {event.note ? <p className="mt-0.5 text-[0.8rem] whitespace-pre-line text-ink-600">{event.note}</p> : null}
                </li>
              ))}
            </ol>
            <div className="mt-5 border-t border-sand-200 pt-4 print:hidden">
              <NoteForm refCode={order.ref} />
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Status" description={STATUS_META[order.status].hint} className="print:hidden">
            <OrderStatusForm order={order} />
            <p className="mt-4 rounded-lg bg-sand-50 px-3 py-2 text-[0.74rem] leading-relaxed text-ink-600">
              {order.demo
                ? "Sample order — status changes never touch real stock."
                : order.stockDeducted
                  ? "The items have been taken out of stock. Cancelling puts them back."
                  : "Stock is taken out when you confirm the order."}
            </p>
          </Card>

          <Card
            title="Customer"
            action={
              <Link href={`/admin/customers/${phoneKey(order.customer.phone)}`} className="text-[0.76rem] font-semibold text-coal-700 hover:underline">
                Profile
              </Link>
            }
          >
            <EditableCustomer order={order}>
              <div className="space-y-3 text-[0.82rem]">
                <div>
                  <p className="font-semibold text-ink-900">{order.customer.name}</p>
                  <a href={`tel:${order.customer.phone.replace(/\s/g, "")}`} className="block text-coal-700 hover:underline">
                    {order.customer.phone}
                  </a>
                  {order.customer.email ? (
                    <a href={`mailto:${order.customer.email}`} className="block break-all text-coal-700 hover:underline">
                      {order.customer.email}
                    </a>
                  ) : null}
                  <p className="mt-1 text-[0.74rem] text-ink-500">
                    {previous.length ? `${previous.length} other ${previous.length === 1 ? "order" : "orders"}` : "First order"}
                  </p>
                </div>
                <div className="border-t border-sand-200 pt-3">
                  <p className="text-[0.7rem] font-semibold tracking-wide text-ink-500 uppercase">
                    {order.fulfilment === "pickup" ? "Pickup" : "Deliver to"}
                  </p>
                  {order.fulfilment === "pickup" ? (
                    <p className="mt-1 text-ink-700">Weekend pickup in Kaduna · {site.pickup.days}</p>
                  ) : (
                    <p className="mt-1 text-ink-700">
                      {order.shipping.address}
                      {order.shipping.address ? <br /> : null}
                      {[order.shipping.city, order.shipping.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {order.shipping.method ? (
                    <p className="mt-1 text-[0.76rem] text-ink-500">
                      Option: <span className="font-medium text-ink-700">{order.shipping.method}</span>
                      {order.deliveryFee ? ` · ${formatPrice(order.deliveryFee)}` : " · free"}
                    </p>
                  ) : null}
                </div>
                {order.customerNote ? (
                  <div className="rounded-lg bg-gold-100 px-3 py-2 text-[0.78rem] text-gold-700">
                    <strong className="font-semibold">Customer note:</strong> {order.customerNote}
                  </div>
                ) : null}
              </div>
            </EditableCustomer>
          </Card>

          <Card title="Payment">
            <dl className="space-y-2 text-[0.82rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Method</dt>
                <dd className="font-medium text-ink-800">{order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : "Not recorded"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Paid</dt>
                <dd className="font-medium text-ink-800">{order.paidAt ? formatDateTime(order.paidAt) : "Not yet"}</dd>
              </div>
              {order.payment ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Paystack</dt>
                    <dd className={order.payment.status === "paid" ? "font-semibold text-gold-700" : "font-medium text-ink-600"}>
                      {order.payment.status === "paid" ? "Paid online" : "Awaiting payment"}
                    </dd>
                  </div>
                  {order.payment.status === "paid" ? (
                    <>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-500">Received</dt>
                        <dd className="font-medium text-ink-800 tabular-nums">
                          {order.payment.amount !== null ? formatPrice(order.payment.amount) : "—"}
                          {order.payment.channel ? ` · ${order.payment.channel.replace(/_/g, " ")}` : ""}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <p className="text-[0.74rem] leading-relaxed text-ink-500">
                      The customer was sent to Paystack but hasn&apos;t paid. It confirms itself if they do; otherwise cancel or delete it.
                    </p>
                  )}
                  {order.payment.reference ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Reference</dt>
                      <dd className="font-mono text-[0.74rem] break-all text-ink-700">{order.payment.reference}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
              {order.paidAt ? (
                <div className="flex justify-between gap-3 border-t border-sand-200 pt-2">
                  <dt className="text-ink-500">Receipt</dt>
                  <dd className="text-right font-medium text-ink-800">
                    {!order.customer.email
                      ? "No email on this order"
                      : order.receiptSentAt
                        ? `Emailed ${formatDateTime(order.receiptSentAt)}`
                        : "Not emailed yet"}
                  </dd>
                </div>
              ) : null}
            </dl>
            {order.paidAt && order.customer.email ? (
              <div className="mt-2 print:hidden">
                <ReceiptForm refCode={order.ref} sent={Boolean(order.receiptSentAt)} />
              </div>
            ) : null}
          </Card>

          <form action={deleteOrderAction} className="print:hidden">
            <input type="hidden" name="ref" value={order.ref} />
            <ConfirmSubmit
              message={`Delete ${order.ref} permanently? Use Cancel instead if you want to keep a record.`}
              className="w-full text-center text-[0.76rem] font-semibold text-berry-600 hover:underline"
              pendingLabel="Deleting…"
            >
              Delete this order
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </AdminPage>
  );
}
