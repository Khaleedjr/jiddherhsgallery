import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, StarKhatimIcon, WhatsappIcon } from "@/components/icons";
import { Container } from "@/components/ui";
import { fill, whatsappHref } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";
import { site } from "@/lib/site";
import type { AgeGroup, Department } from "@/lib/types";

/** Design 4's footer: the black band that closes every page, with gold headings. */
export async function SiteFooter({
  departments,
  ageGroups,
}: {
  departments: Department[];
  ageGroups: AgeGroup[];
}) {
  const year = new Date().getFullYear();
  const { layout: t, store } = await getSiteText();

  return (
    <footer className="tone-band bg-coal-900 text-coal-300">
      <Container className="py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label={`${site.name} home`} className="inline-block rounded-full">
              <Image src="/logo.png" alt="" width={72} height={72} className="size-[4.5rem] rounded-full" />
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-relaxed">{t.footerBlurb}</p>

            <p className="mt-5 font-arabic text-lg text-gold-500">
              <span dir="auto">{t.footerArabic}</span>
            </p>

            <ul className="mt-6 flex gap-2">
              {[
                { href: store.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: whatsappHref(store.whatsapp, t.footerWhatsappMessage), label: "WhatsApp", Icon: WhatsappIcon },
                { href: `mailto:${store.email}`, label: "Email", Icon: MailIcon },
                { href: `tel:+${store.whatsapp}`, label: "Call", Icon: PhoneIcon },
              ].map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    aria-label={label}
                    className="grid size-11 place-items-center rounded-full border border-white/15 transition hover:border-gold-500 hover:text-gold-500 active:scale-95"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            <FooterColumn
              title={t.shopHeading}
              links={[
                { href: "/shop", label: t.allProducts },
                ...departments.map((dept) => ({ href: `/collections/${dept.slug}`, label: dept.name })),
              ]}
            />
            <FooterColumn title={t.ageHeading} links={ageGroups.map((age) => ({ href: `/age/${age.slug}`, label: age.name }))} />
            <FooterColumn
              title={t.helpHeading}
              links={[
                { href: "/about", label: t.linkStory },
                { href: "/contact", label: t.linkContact },
                { href: "/faq", label: t.linkFaq },
                { href: "/pickup-delivery", label: t.linkDelivery },
                { href: "/returns", label: t.linkReturns },
                { href: "/privacy", label: t.linkPrivacy },
                { href: "/terms", label: t.linkTerms },
              ]}
            />
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          <FooterDetail Icon={PhoneIcon} label={t.callLabel} value={store.phoneDisplay} href={`tel:+${store.whatsapp}`} />
          <FooterDetail Icon={MailIcon} label={t.emailLabel} value={store.email} href={`mailto:${store.email}`} />
          <FooterDetail Icon={PinIcon} label={t.basedLabel} value={`${store.state}, ${store.country}`} />
        </div>
      </Container>

      {/* Extra room at the bottom on phones so the floating WhatsApp button never covers the last line. */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 pt-5 pb-24 text-xs text-coal-400 sm:flex-row sm:pb-5">
          <p>{fill(t.copyright, { year })}</p>
          <p className="flex items-center gap-2">
            <StarKhatimIcon className="size-3 text-gold-500" />
            {store.tagline}
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <h3 className="font-sans text-sm font-semibold tracking-normal text-gold-500">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors hover:text-gold-500">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterDetail({ Icon, label, value, href }: { Icon: typeof PhoneIcon; label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-gold-500">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.7rem] tracking-[0.14em] text-coal-400 uppercase">{label}</span>
        <span className="block truncate text-sm text-sand-50">{value}</span>
      </span>
    </>
  );

  return href ? (
    <a href={href} className="flex items-center gap-3 transition hover:opacity-80">
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-3">{content}</div>
  );
}
