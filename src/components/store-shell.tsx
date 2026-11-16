import { Suspense, type ReactNode } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteTextProvider } from "@/components/site-text-provider";
import { VisitTracker } from "@/components/visit-tracker";
import { WhatsappFab } from "@/components/whatsapp-fab";
import { taxonomy } from "@/lib/catalog";
import type { SiteText } from "@/lib/content/schema";
import { getSiteText } from "@/lib/content/text";
import { getDeliverySettings } from "@/lib/delivery";
import { site } from "@/lib/site";

const organisationJsonLd = (store: SiteText["store"]) => ({
  "@context": "https://schema.org",
  "@type": "Store",
  name: site.name,
  description: store.description,
  url: site.url,
  telephone: store.phoneDisplay,
  email: store.email,
  currenciesAccepted: site.currency,
  slogan: store.tagline,
  address: {
    "@type": "PostalAddress",
    addressLocality: site.address.city,
    addressRegion: store.state,
    addressCountry: "NG",
  },
  sameAs: [store.instagram],
  potentialAction: {
    "@type": "SearchAction",
    target: `${site.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

/** Header, footer, cart and WhatsApp button around every storefront page, with the dashboard's text for them. */
export async function StoreShell({ children }: { children: ReactNode }) {
  const { departments, ageGroups } = taxonomy;
  const [text, delivery] = await Promise.all([getSiteText(), getDeliverySettings()]);
  return (
    <SiteTextProvider value={{ layout: text.layout, shopping: text.shopping, store: text.store, delivery }}>
    <CartProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd(text.store)) }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-coal-900 focus:px-4 focus:py-2 focus:text-sm focus:text-gold-500"
      >
        Skip to content
      </a>
      <SiteHeader departments={departments} ageGroups={ageGroups} />
      {/* Pages end on paper with room before the footer; the homepage ends on its own coloured band, so it opts out. */}
      <main id="main" className="flex-1 pb-20 has-[[data-flush-footer]]:pb-0">
        {children}
      </main>
      <SiteFooter departments={departments} ageGroups={ageGroups} />
      <CartDrawer />
      <WhatsappFab />
      {/* Reads the URL's query, so it renders on its own in the browser and never holds back the static page. */}
      <Suspense fallback={null}>
        <VisitTracker />
      </Suspense>
    </CartProvider>
    </SiteTextProvider>
  );
}
