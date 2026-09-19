import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TiktokIcon,
  TruckIcon,
  WhatsappIcon,
} from "@/components/icons";
import { Container, buttonClass, cx } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & delivery",
  description: `Reach ${site.name} on WhatsApp, phone or email. Nationwide delivery across Nigeria with in-store pickup available.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const channels = [
    {
      Icon: WhatsappIcon,
      label: "WhatsApp",
      value: site.phoneDisplay,
      hint: "Fastest way to reach us — orders, questions, bundles",
      href: whatsappLink(`As-salamu alaykum ${site.name}, I have a question.`),
      external: true,
    },
    {
      Icon: PhoneIcon,
      label: "Phone",
      value: site.phoneDisplay,
      hint: "During store hours",
      href: `tel:${site.phoneDisplay.replace(/\s/g, "")}`,
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
        eyebrow="We would love to hear from you"
        title="Contact & delivery"
        description="Questions about a title, an age recommendation, a bulk order for your school or madrasah — send a message and a real person will reply."
        trail={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        tone="forest"
      />

      <Container className="py-14 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map(({ Icon, label, value, hint, href, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="group rounded-xl border border-sand-200 bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:border-forest-200 hover:shadow-[var(--shadow-card)]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-forest-50 text-forest-700 transition group-hover:bg-forest-800 group-hover:text-gold-300">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 text-lg">{label}</h2>
              <p className="mt-1 text-[0.88rem] font-medium break-words text-forest-800">{value}</p>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-500">{hint}</p>
            </a>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="rounded-xl border border-sand-200 bg-white p-7">
            <h2 className="flex items-center gap-2.5 text-xl">
              <PinIcon className="size-5 text-forest-600" />
              Visit the store
            </h2>
            <address className="mt-4 text-[0.9rem] leading-relaxed text-ink-700 not-italic">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.state}
              <br />
              {site.address.country}
            </address>

            <h3 className="mt-8 flex items-center gap-2.5 text-[0.9rem] font-semibold text-forest-900">
              <ClockIcon className="size-4 text-forest-600" />
              Opening hours
            </h3>
            <dl className="mt-3 space-y-2 text-[0.84rem]">
              {site.hours.map((entry) => (
                <div key={entry.days} className="flex justify-between gap-4 border-b border-sand-200 pb-2 last:border-0">
                  <dt className="text-ink-600">{entry.days}</dt>
                  <dd className="text-right font-medium text-ink-800">{entry.time}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex items-center gap-2">
              {[
                { href: site.socials.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: site.socials.facebook, label: "Facebook", Icon: FacebookIcon },
                { href: site.socials.tiktok, label: "TikTok", Icon: TiktokIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-sand-300 text-ink-600 transition hover:border-forest-500 hover:text-forest-800"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-sand-200 bg-sand-100 p-7">
            <h2 className="flex items-center gap-2.5 text-xl">
              <TruckIcon className="size-5 text-forest-600" />
              Delivery across Nigeria
            </h2>
            <ul className="mt-5 space-y-4 text-[0.86rem] leading-relaxed text-ink-700">
              {[
                {
                  title: "Nationwide courier",
                  copy: "We dispatch to all 36 states and the FCT. Fees depend on weight and destination, and we confirm the exact amount before you pay.",
                },
                {
                  title: "Same-city delivery",
                  copy: `Orders within ${site.address.city} usually arrive the same or next working day.`,
                },
                {
                  title: "Free delivery",
                  copy: "Orders above ₦50,000 ship free anywhere in Nigeria.",
                },
                {
                  title: "Store pickup",
                  copy: "Prefer to collect? Choose pickup at checkout and we will set your order aside.",
                },
              ].map((item) => (
                <li key={item.title} className="border-b border-sand-300/70 pb-4 last:border-0 last:pb-0">
                  <p className="font-semibold text-forest-900">{item.title}</p>
                  <p className="mt-1 text-ink-600">{item.copy}</p>
                </li>
              ))}
            </ul>

            <a
              href={whatsappLink(`As-salamu alaykum ${site.name}, I would like to ask about delivery.`)}
              target="_blank"
              rel="noreferrer"
              className={cx(buttonClass({ variant: "whatsapp", size: "lg" }), "mt-7 w-full")}
            >
              <WhatsappIcon className="size-4" />
              Ask about delivery
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
