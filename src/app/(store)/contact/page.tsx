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
import { whatsappHref } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { contact } = await getSiteText();
  return { title: contact.title, description: contact.seoDescription, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const { contact: t, store } = await getSiteText();
  const channels = [
    {
      Icon: WhatsappIcon,
      label: t.whatsappLabel,
      value: store.phoneDisplay,
      hint: t.whatsappHint,
      href: whatsappHref(store.whatsapp, t.whatsappMessage),
      external: true,
    },
    { Icon: PhoneIcon, label: t.phoneLabel, value: store.phoneLocal, hint: t.phoneHint, href: `tel:+${store.whatsapp}`, external: false },
    { Icon: MailIcon, label: t.emailLabel, value: store.email, hint: t.emailHint, href: `mailto:${store.email}`, external: false },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.intro}
        trail={[{ label: "Home", href: "/" }, { label: t.title }]}
        tone="ink"
      />

      <Container className="py-14 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map(({ Icon, label, value, hint, href, external }) => (
            <a
              key={href}
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
              {t.whereTitle}
            </h2>
            <address className="mt-4 text-[0.9rem] leading-relaxed text-ink-700 not-italic">
              {store.state}
              <br />
              {store.country}
            </address>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-ink-500">{store.addressNote}</p>

            <h3 className="mt-8 flex items-center gap-2.5 text-[0.9rem] font-semibold text-coal-900">
              <ClockIcon className="size-4 text-coal-600" />
              {t.pickupTitle}
            </h3>
            <dl className="mt-3 space-y-2 text-[0.84rem]">
              <div className="flex justify-between gap-4 border-b border-sand-200 pb-2">
                <dt className="text-ink-600">{t.daysLabel}</dt>
                <dd className="text-right font-medium text-ink-800">{store.pickupDays}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-sand-200 pb-2">
                <dt className="text-ink-600">{t.timeLabel}</dt>
                <dd className="text-right font-medium text-ink-800">{store.pickupTime}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-ink-500">{store.pickupNote}</p>

            <div className="mt-8 flex items-center gap-3">
              <a
                href={store.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-sand-300 px-4 py-2 text-[0.82rem] font-medium text-ink-700 transition hover:border-coal-500 hover:text-coal-800"
              >
                <InstagramIcon className="size-4" />
                {store.instagramHandle}
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-sand-200 bg-sand-100 p-7">
            <h2 className="flex items-center gap-2.5 text-xl">
              <TruckIcon className="size-5 text-coal-600" />
              {t.deliveryTitle}
            </h2>
            <ul className="mt-5 space-y-4 text-[0.86rem] leading-relaxed text-ink-700">
              {t.deliveryItems.map((item, index) => (
                <li key={index} className="border-b border-sand-300/70 pb-4 last:border-0 last:pb-0">
                  <p className="font-semibold text-coal-900">{item.title}</p>
                  <p className="mt-1 text-ink-600">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </>
  );
}
