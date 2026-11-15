import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery & returns",
  description: `How ${site.name} dispatches orders from ${site.address.state} across Nigeria, park bus stops by state, pickup times, and the exchange and return policy.`,
  alternates: { canonical: "/delivery-returns" },
};

/** Park bus stops the store dispatches to, as listed in its delivery policy. */
const BUS_STOPS = [
  ["Abuja", "Jabi or Zuba"],
  ["Adamawa", "Yola"],
  ["Bauchi", "Bauchi"],
  ["Borno", "Maiduguri"],
  ["Gombe", "Gombe"],
  ["Jigawa", "Dutse"],
  ["Kano", "Kanoline or Naibawa"],
  ["Katsina", "Katsina"],
  ["Kebbi", "Birnin Kebbi"],
  ["Kwara", "Ilorin"],
  ["Lagos", "Iddo"],
  ["Nasarawa", "Keffi or Lafia"],
  ["Niger", "Minna"],
  ["Oyo", "Ibadan"],
  ["Plateau", "Jos"],
  ["Rivers", "Port Harcourt"],
  ["Sokoto", "Sokoto"],
  ["Taraba", "Jalingo"],
  ["Zamfara", "Gusau"],
];

export default function DeliveryReturnsPage() {
  return (
    <>
      <LegalPage
        title="Delivery & returns"
        intro="Assalamu alaikum. These guidelines help us keep deliveries smooth, timely and stress-free for everyone, in shaa Allah."
        updated="September 2026"
        sections={[
          {
            heading: "Kaduna deliveries",
            bullets: [
              `Dispatch: within ${site.delivery.dispatchHours} hours of payment. If it will take longer, we tell you.`,
              `Delivery fee: ${formatPrice(site.delivery.kadunaFee)} flat for website orders within ${site.delivery.kadunaNote}`,
              "Waybill: please add your waybill fee at checkout. If you skip it, riders or drivers may charge their own fee, and that is not from us.",
              "Receiving on your behalf: use the recipient's full shipping address and phone number, and tell them straight after payment.",
              "We kindly do not accept rush orders, so that every order is packaged with care.",
            ],
          },
          {
            heading: "Interstate park deliveries",
            bullets: [
              `Regular dispatch days are ${site.delivery.interstateDays}. If we dispatch on another day, you will be notified.`,
              "All interstate park orders must include the waybill fee at checkout.",
              "Choosing Local Pickup means you are collecting personally or sending someone — no delivery is made on that option.",
              "Want the driver to drop your item before the park? State it clearly in your checkout note.",
              "Southern states: drivers' numbers are not always provided. If nobody contacts you within 48 hours of dispatch, tell us so we can follow up.",
              "If someone else collects for you, use their active phone number in the delivery details and tell them ahead of time.",
              "Parks typically charge ₦300 to ₦1,000 storage if items are not collected from the driver. These charges are not ours and we cannot control them.",
              "Collect park deliveries within 3 days of dispatch. Items left beyond that are no longer our responsibility.",
            ],
          },
          {
            heading: "Free delivery",
            paragraphs: [
              `Orders from ${formatPrice(site.freeDeliveryThreshold)} and above are delivered free to any location within Nigeria.`,
            ],
          },
          {
            heading: "Pickup",
            paragraphs: [
              `Pickups are strictly at weekends — ${site.pickup.days}, ${site.pickup.time}, in ${site.address.state}. ${site.address.note}`,
            ],
            bullets: [
              "Kindly call at least 1 hour before coming.",
              "Have your order details or order reference ID ready.",
              "All pickups must be done at the designated location only.",
            ],
          },
          {
            heading: "Items delivered in good condition are final sales",
            paragraphs: [
              "Once a product has been delivered in perfect and acceptable condition, it cannot be exchanged, returned or refunded.",
            ],
            bullets: [
              "It keeps every item original and safe.",
              "It prevents the circulation of products that have been opened, handled or exposed.",
              "It ensures every customer receives completely new, untampered items.",
            ],
          },
          {
            heading: "Wrong or damaged item on delivery",
            paragraphs: [
              "If your order arrives with the wrong item, or a product damaged in transit, tell us within 48 hours of receiving it so we can follow up quickly with the driver or logistics partner.",
              "Once we confirm the issue, a replacement is arranged immediately. If the item is no longer available, a full refund is issued. Please open and inspect your package as soon as it arrives.",
            ],
          },
          {
            heading: "Confirm the details before ordering",
            paragraphs: [
              "Every listing carries a clear description, live photographs of the actual item, and its features, sizes, colours and contents.",
              "If that is not enough, message us before you order and we will gladly guide you. Where a product matches its description and arrives in good condition, the no-return rule applies.",
            ],
          },
          {
            heading: "Need help?",
            paragraphs: [
              `Unsure about features, suitability for your child, colour differences, packaging or contents? Message us on WhatsApp at ${site.phoneDisplay} or email ${site.email} before placing your order. We are always willing to help you make the right choice.`,
            ],
          },
        ]}
      />

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl sm:text-2xl">Delivery bus stops by state</h2>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-600">
              Kindly include your preferred park or bus stop in your delivery details.
            </p>
            <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {BUS_STOPS.map(([state, stop]) => (
                <div
                  key={state}
                  className="flex items-baseline justify-between gap-4 border-b border-sand-200 pb-2.5"
                >
                  <dt className="text-[0.8rem] font-semibold tracking-wide text-coal-900 uppercase">
                    {state}
                  </dt>
                  <dd className="text-right text-[0.86rem] text-ink-600">{stop}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
