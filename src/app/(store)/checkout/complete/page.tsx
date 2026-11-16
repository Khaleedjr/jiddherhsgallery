import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ClearBagOnce, RetryPayment } from "@/components/checkout-complete";
import { CheckIcon, ClockIcon, StarKhatimIcon, WhatsappIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ButtonLink, Container, buttonClass, cx } from "@/components/ui";
import { Inline } from "@/components/rich-text";
import { fill, whatsappHref } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { getOrder } from "@/lib/store/orders";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

/**
 * Where the customer lands after Paystack (via /api/paystack/callback, which
 * has already checked and recorded the payment). Whether the order is paid
 * comes from the store; the `status` parameter only picks the wording while
 * it isn't.
 */
export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; reference?: string; status?: string }>;
}) {
  const { order: orderRef = "", reference = "", status = "" } = await searchParams;
  const { shopping: t, store } = await getSiteText();
  const order = orderRef ? await getOrder(orderRef.slice(0, 20)) : null;
  const paid = order?.payment?.status === "paid";
  // Order refs run in sequence, so a ref alone proves nothing. Only the customer's own return link
  // carries the payment reference; without it, show nothing of the order (name, email, items).
  const isTheirs = Boolean(order && reference && order.payment?.reference === reference);

  if (!order || !isTheirs) {
    return (
      <>
        <PageHeader title="Order confirmation" trail={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
        <Container className="py-12">
          <Panel>
            <StarKhatimIcon className="mx-auto size-8 text-gold-600" />
            <h2 className="mt-4 text-2xl">We couldn&apos;t find that order</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-600">
              If you paid and this page looks wrong, message us with your Paystack receipt and we will sort it out quickly.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={whatsappHref(store.whatsapp, `As-salamu alaykum ${site.name}, I need help with my order${orderRef ? ` ${orderRef}` : ""}.`)} target="_blank" rel="noreferrer" className={buttonClass({ size: "lg" })}>
                <WhatsappIcon className="size-4" />
                Message us
              </a>
              <ButtonLink href="/shop" variant="outline" size="lg">
                Back to the shop
              </ButtonLink>
            </div>
          </Panel>
        </Container>
      </>
    );
  }

  const summary = (
    <div className="mt-8 rounded-[1.25rem] bg-sand-100 p-5 text-left">
      <ul className="space-y-3">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.variantId ?? ""}`} className="flex items-center gap-3">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand-200">
              {item.image ? <Image src={item.image} alt="" fill sizes="48px" className="object-cover" /> : null}
            </span>
            <span className="min-w-0 flex-1 text-[0.88rem] leading-snug">
              <span className="line-clamp-2 font-medium text-ink-900">{item.name}</span>
              {item.variantLabel ? <span className="text-[0.78rem] text-ink-500">{item.variantLabel}</span> : null}
            </span>
            <span className="shrink-0 text-[0.85rem] text-ink-600 tabular-nums">
              {item.quantity} × {formatPrice(item.price)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1.5 border-t border-ink-900/10 pt-4 text-[0.88rem]">
        <div className="flex justify-between">
          <dt className="text-ink-600">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-600">{order.shipping.method ?? (order.fulfilment === "pickup" ? "Pickup" : "Delivery")}</dt>
          <dd className="tabular-nums">{order.deliveryFee ? formatPrice(order.deliveryFee) : "Free"}</dd>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold">
          <dt>{paid ? "Paid" : "Total"}</dt>
          <dd className="tabular-nums">{formatPrice(order.total)}</dd>
        </div>
      </dl>
    </div>
  );

  if (paid) {
    const pickup = order.fulfilment === "pickup";
    return (
      <>
        <ClearBagOnce />
        <PageHeader eyebrow={t.paidEyebrow} title={t.paidTitle} trail={[{ label: "Home", href: "/" }, { label: "Order confirmed" }]} />
        <Container className="py-12">
          <Panel>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-coal-900 text-gold-500">
              <CheckIcon className="size-7" strokeWidth={2.4} />
            </span>
            <h2 className="mt-5 text-3xl">{fill(t.paidHeading, { ref: order.ref })}</h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-600">
              <Inline
                text={fill(t.paidThanks, { name: order.customer.name.split(" ")[0], customerEmail: order.customer.email })}
                strongClassName="text-ink-900"
              />{" "}
              {pickup ? fill(t.paidPickup, { ref: order.ref }) : fill(t.paidDelivery, { customerPhone: order.customer.phone })}
            </p>
            {summary}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/shop" size="lg">
                {t.paidContinue}
              </ButtonLink>
              <a href={whatsappHref(store.whatsapp, `As-salamu alaykum ${site.name}, a question about my order ${order.ref}.`)} target="_blank" rel="noreferrer" className={buttonClass({ variant: "outline", size: "lg" })}>
                <WhatsappIcon className="size-4" />
                {t.paidQuestions}
              </a>
            </div>
          </Panel>
        </Container>
      </>
    );
  }

  const processing = status === "processing";
  const mismatch = status === "mismatch";
  return (
    <>
      <PageHeader
        eyebrow={`Order ${order.ref}`}
        title={processing ? "Confirming your payment" : mismatch ? "We need to check your payment" : "Payment not completed"}
        trail={[{ label: "Home", href: "/" }, { label: "Checkout", href: "/checkout" }, { label: "Payment" }]}
      />
      <Container className="py-12">
        <Panel>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-sand-200 text-ink-900">
            {processing ? <ClockIcon className="size-7" /> : <StarKhatimIcon className="size-7" />}
          </span>
          <h2 className="mt-5 text-2xl">
            {processing ? "Paystack is still confirming it" : mismatch ? "The amount didn't match" : "Your payment didn't go through"}
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-600">
            {processing
              ? "Bank transfers and USSD can take a minute. This page updates when you check again, and we confirm the order as soon as Paystack does. You don't need to pay twice."
              : mismatch
                ? "Paystack received a payment for a different amount than this order. Please message us with your receipt and we will put it right."
                : "No money was taken for this order. Your bag is still saved, so you can try again now."}
          </p>
          {summary}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {processing ? (
              <a href={`/checkout/complete?order=${order.ref}&reference=${encodeURIComponent(reference)}&status=processing`} className={cx(buttonClass({ size: "lg" }), "w-full sm:w-auto")}>
                Check again
              </a>
            ) : mismatch ? null : (
              <RetryPayment orderRef={order.ref} reference={reference} label={`Pay ${formatPrice(order.total)} with Paystack`} />
            )}
            {mismatch ? (
              <a
                href={whatsappHref(store.whatsapp, `As-salamu alaykum ${site.name}, about the payment for order ${order.ref}.`)}
                target="_blank"
                rel="noreferrer"
                className={cx(buttonClass({ size: "lg" }), "w-full sm:w-auto")}
              >
                <WhatsappIcon className="size-4" />
                Message us
              </a>
            ) : (
              <Link href="/cart" className={cx(buttonClass({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
                Back to my bag
              </Link>
            )}
          </div>
        </Panel>
      </Container>
    </>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl rounded-[1.5rem] bg-sand-50 p-6 text-center ring-1 ring-ink-900/10 sm:p-10">{children}</div>;
}
