import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsappFab } from "@/components/whatsapp-fab";
import { taxonomy } from "@/lib/catalog";
import { site } from "@/lib/site";

const organisationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: site.name,
  description: site.description,
  url: site.url,
  telephone: site.phoneDisplay,
  email: site.email,
  currenciesAccepted: site.currency,
  slogan: site.tagline,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    addressCountry: "NG",
  },
  sameAs: [site.socials.instagram],
  potentialAction: {
    "@type": "SearchAction",
    target: `${site.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

/** Header, footer, cart and WhatsApp button around every storefront page. */
export function StoreShell({ children }: { children: ReactNode }) {
  const { departments, ageGroups } = taxonomy;
  return (
    <CartProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-forest-800 focus:px-4 focus:py-2 focus:text-sm focus:text-sand-50"
      >
        Skip to content
      </a>
      <SiteHeader departments={departments} ageGroups={ageGroups} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter departments={departments} ageGroups={ageGroups} />
      <CartDrawer />
      <WhatsappFab />
    </CartProvider>
  );
}
