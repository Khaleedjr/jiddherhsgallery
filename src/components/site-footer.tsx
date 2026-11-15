import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, StarKhatimIcon, WhatsappIcon } from "@/components/icons";
import { Container } from "@/components/ui";
import { site, whatsappLink } from "@/lib/site";
import type { AgeGroup, Department } from "@/lib/types";

/** Design 4's footer: the black band that closes every page, with gold headings. */
export function SiteFooter({
  departments,
  ageGroups,
}: {
  departments: Department[];
  ageGroups: AgeGroup[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-coal-900 text-coal-300">
      <Container className="py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label={`${site.name} home`} className="inline-block rounded-full">
              <Image src="/logo.png" alt="" width={72} height={72} className="size-[4.5rem] rounded-full" />
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              An online Islamic store for books, toys and ibadah essentials for every age, sent from Kaduna to all of Nigeria.
            </p>

            <p className="mt-5 font-arabic text-lg text-gold-500">
              <span dir="rtl" lang="ar">
                بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </span>
            </p>

            <ul className="mt-6 flex gap-2">
              {[
                { href: site.socials.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: whatsappLink(`As-salamu alaykum ${site.name}.`), label: "WhatsApp", Icon: WhatsappIcon },
                { href: `mailto:${site.email}`, label: "Email", Icon: MailIcon },
                { href: `tel:+${site.whatsapp}`, label: "Call", Icon: PhoneIcon },
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
              title="Shop"
              links={[
                { href: "/shop", label: "All products" },
                ...departments.map((dept) => ({ href: `/collections/${dept.slug}`, label: dept.name })),
              ]}
            />
            <FooterColumn title="By age" links={ageGroups.map((age) => ({ href: `/age/${age.slug}`, label: age.name }))} />
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

        <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          <FooterDetail Icon={PhoneIcon} label="Call or WhatsApp" value={site.phoneDisplay} href={`tel:+${site.whatsapp}`} />
          <FooterDetail Icon={MailIcon} label="Email" value={site.email} href={`mailto:${site.email}`} />
          <FooterDetail Icon={PinIcon} label="Based in" value={`${site.address.state}, ${site.address.country}`} />
        </div>
      </Container>

      {/* Extra room at the bottom on phones so the floating WhatsApp button never covers the last line. */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 pt-5 pb-24 text-xs text-coal-400 sm:flex-row sm:pb-5">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <StarKhatimIcon className="size-3 text-gold-500" />
            {site.tagline}
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
