import Image from "next/image";
import Link from "next/link";
import {
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  StarKhatimIcon,
  WhatsappIcon,
} from "@/components/icons";
import { Container } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";
import type { AgeGroup, Department } from "@/lib/types";

export function SiteFooter({
  departments,
  ageGroups,
}: {
  departments: Department[];
  ageGroups: AgeGroup[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-forest-950 text-sand-200">
      <div className="pattern-girih-light h-1.5 w-full opacity-60" aria-hidden />

      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={48} height={48} className="size-12 rounded-full" />
              <span className="leading-none">
                <span className="block font-display text-xl font-semibold text-sand-50">Jidderh&apos;s</span>
                <span className="mt-0.5 block text-[0.58rem] font-semibold tracking-[0.3em] text-gold-300 uppercase">
                  Gallery
                </span>
              </span>
            </Link>

            <p className="mt-4 text-[0.72rem] font-semibold tracking-[0.24em] text-gold-300 uppercase">
              {site.tagline}
            </p>

            <p className="mt-4 max-w-sm text-[0.85rem] leading-relaxed text-sand-300/85">
              An online Islamic store for books, toys and accessories across all ages — helping every home
              use today&apos;s tools to learn the deen.
            </p>

            <p className="mt-6 font-arabic text-lg text-gold-300">
              <span dir="rtl" lang="ar">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[
                { href: site.socials.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: whatsappLink(`As-salamu alaykum ${site.name}.`), label: "WhatsApp", Icon: WhatsappIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-sand-200/20 text-sand-200 transition hover:border-gold-400/60 hover:bg-forest-900 hover:text-gold-300"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            <FooterColumn
              title="Shop"
              links={[
                { href: "/shop", label: "All products" },
                ...departments.map((dept) => ({
                  href: `/collections/${dept.slug}`,
                  label: dept.name,
                })),
              ]}
            />
            <FooterColumn
              title="Shop by age"
              links={ageGroups.map((age) => ({ href: `/age/${age.slug}`, label: age.name }))}
            />
            <FooterColumn
              title="Help"
              links={[
                { href: "/about", label: "Our story" },
                { href: "/contact", label: "Contact us" },
                { href: "/faq", label: "FAQ" },
                { href: "/delivery-returns", label: "Delivery & returns" },
                { href: "/privacy", label: "Privacy policy" },
                { href: "/terms", label: "Terms of service" },
              ]}
            />
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-t border-sand-200/12 pt-8 sm:grid-cols-3">
          <FooterDetail
            Icon={PhoneIcon}
            label="Call or WhatsApp"
            value={site.phoneDisplay}
            href={`tel:+${site.whatsapp}`}
          />
          <FooterDetail Icon={MailIcon} label="Email" value={site.email} href={`mailto:${site.email}`} />
          <FooterDetail
            Icon={PinIcon}
            label="Based in"
            value={`${site.address.state}, ${site.address.country}`}
          />
        </div>
      </Container>

      <div className="border-t border-sand-200/12">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-[0.75rem] text-sand-300/70 sm:flex-row">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <StarKhatimIcon className="size-3 text-gold-400/70" />
            {site.tagline}
          </p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h3 className="text-[0.68rem] font-semibold tracking-[0.2em] text-gold-300 uppercase">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[0.82rem] text-sand-300/85 transition hover:text-sand-50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterDetail({
  Icon,
  label,
  value,
  href,
}: {
  Icon: typeof PhoneIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-900 text-gold-300">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.68rem] tracking-[0.14em] text-sand-300/60 uppercase">{label}</span>
        <span className="block truncate text-[0.85rem] text-sand-100">{value}</span>
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
