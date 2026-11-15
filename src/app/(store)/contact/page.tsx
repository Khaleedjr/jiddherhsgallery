import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import {
  ClockIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TruckIcon,
  WhatsappIcon,
} from "@/components/icons";
import { Container } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & delivery",
  description: `Reach ${site.name} on WhatsApp, phone or email. Based in ${site.address.state}, delivering nationwide across Nigeria with weekend pickup available.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const channels = [
    {
      Icon: WhatsappIcon,
      label: "WhatsApp",
      value: site.phoneDisplay,
      hint: "Fastest way to reach us — orders, questions and bundles",
      href: whatsappLink(`As-salamu alaykum ${site.name}, I have a question.`),
      external: true,
    },
    {
      Icon: PhoneIcon,
      label: "Phone",
      value: site.phoneLocal,
      hint: "9:00am - 6:00pm",
      href: `tel:+${site.whatsapp}`,
      external: false,
    },
    {
      Icon: MailIcon,
      label: "Email",
      value: site.email,
      hint: "For bulk orders, schools and partnerships",
      href: `mailto:${site.email}`,
      external: false,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={site.welcome}
        title="Contact & delivery"
        description="To the number one home of Islamic items of your choice that will nurture you towards Jannah, in shaa Allah. Send a message and a real person will reply."
        trail={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        tone="ink"
      />

      <Container className="py-14 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map(({ Icon, label, value, hint, href, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="group rounded-xl border border-sand-200 bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-coal-200 hover:shadow-[var(--shadow-card)]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-coal-50 text-coal-700 transition group-hover:bg-coal-800 group-hover:text-gold-300">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 text-lg">{label}</h2>
              <p className="mt-1 text-[0.88rem] font-medium break-words text-coal-800">{value}</p>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-500">{hint}</p>
            </a>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="rounded-xl border border-sand-200 bg-white p-7">
            <h2 className="flex items-center gap-2.5 text-xl">
              <PinIcon className="size-5 text-coal-600" />
              Where we are
            </h2>
            <address className="mt-4 text-[0.9rem] leading-relaxed text-ink-700 not-italic">
              {site.address.state}
              <br />
              {site.address.country}
            </address>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-ink-500">{site.address.note}</p>

            <h3 className="mt-8 flex items-center gap-2.5 text-[0.9rem] font-semibold text-coal-900">
              <ClockIcon className="size-4 text-coal-600" />
              Pickup
            </h3>
            <dl className="mt-3 space-y-2 text-[0.84rem]">
              <div className="flex justify-between gap-4 border-b border-sand-200 pb-2">
                <dt className="text-ink-600">Days</dt>
                <dd className="text-right font-medium text-ink-800">{site.pickup.days}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-sand-200 pb-2">
                <dt className="text-ink-600">Time</dt>
                <dd className="text-right font-medium text-ink-800">{site.pickup.time}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-ink-500">{site.pickup.note}</p>

            <div className="mt-8 flex items-center gap-3">
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-sand-300 px-4 py-2 text-[0.82rem] font-medium text-ink-700 transition hover:border-coal-500 hover:text-coal-800"
              >
                <InstagramIcon className="size-4" />
                {site.socials.instagramHandle}
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-sand-200 bg-sand-100 p-7">
            <h2 className="flex items-center gap-2.5 text-xl">
              <TruckIcon className="size-5 text-coal-600" />
              Delivery at a glance
            </h2>
            <ul className="mt-5 space-y-4 text-[0.86rem] leading-relaxed text-ink-700">
              {[
                {
                  title: "Within Kaduna",
                  copy: `${formatPrice(site.delivery.kadunaFee)} flat for website orders. ${site.delivery.kadunaNote}`,
                },
                {
                  title: "Dispatch time",
                  copy: `We dispatch within ${site.delivery.dispatchHours} hours of payment. If it will take longer, we tell you.`,
                },
                {
                  title: "Interstate parks",
                  copy: `Regular dispatch days are ${site.delivery.interstateDays}. Waybill fees must be added at checkout.`,
                },
                {
                  title: "Free delivery",
                  copy: `On all orders from ${formatPrice(site.freeDeliveryThreshold)} to anywhere in Nigeria.`,
                },
              ].map((item) => (
                <li key={item.title} className="border-b border-sand-300/70 pb-4 last:border-0 last:pb-0">
                  <p className="font-semibold text-coal-900">{item.title}</p>
                  <p className="mt-1 text-ink-600">{item.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </>
  );
}
