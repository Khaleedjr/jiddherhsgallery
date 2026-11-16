import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ShopBrowser } from "@/components/shop-browser";
import { Container } from "@/components/ui";
import { getCatalog, toShopItem } from "@/lib/catalog";
import { fill } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const [{ catalogMeta }, { pages }] = await Promise.all([getCatalog(), getSiteText()]);
  return {
  title: pages.shopTitle,
  description: `Browse all ${catalogMeta.productCount} Islamic books, toys, ibadah essentials and modest wear at Jidderh's Gallery. Filter by age, category and price.`,
  alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage() {
  const [{ ageGroups, catalogMeta, collections, departments, products }, { pages: t }] = await Promise.all([getCatalog(), getSiteText()]);
  /* The four departments, then the two shelves people come looking for by name. */
  const shelves: Shelf[] = [
    ...departments.map(({ slug, name, image, count }) => ({ slug, name, image, count })),
    ...["ramadan-collection", "our-production"].flatMap((slug) => {
      const collection = collections.find((c) => c.slug === slug);
      return collection && collection.count ? [{ slug, name: collection.name, image: collection.image ?? null, count: collection.count }] : [];
    }),
  ];
  const items = products.map(toShopItem);

  return (
    <>
      <PageHeader
        eyebrow={t.shopEyebrow}
        title={t.shopTitle}
        description={fill(t.shopIntro, { productCount: catalogMeta.productCount })}
        trail={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      >
        <ShelfTiles shelves={shelves} />
      </PageHeader>

      <Container className="py-10 sm:py-12">
        <Suspense fallback={<BrowserSkeleton />}>
          <ShopBrowser products={items} departments={departments} ageGroups={ageGroups} />
        </Suspense>
      </Container>
    </>
  );
}

type Shelf = { slug: string; name: string; image: string | null; count: number };

/**
 * The departments plus the Ramadan Collection and Our Production, in sight
 * before any product: outlined pills with a round photo, drawn like the
 * category buttons on the department pages so the two read as one family.
 * Two by two on a phone, three across on tablets, one row on wide screens.
 */
function ShelfTiles({ shelves }: { shelves: Shelf[] }) {
  return (
    <nav aria-label="Departments and collections" className="mt-7 sm:mt-9">
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        {shelves.map((dept) => (
          <li key={dept.slug}>
            <Link
              href={`/collections/${dept.slug}`}
              className="group flex h-full items-center gap-3 rounded-full border-[1.5px] border-coal-900/35 p-1.5 pr-4 text-ink-900 transition duration-200 hover:border-coal-900 hover:bg-coal-900/10 active:scale-[0.97] sm:gap-3.5 sm:p-2 sm:pr-5"
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-sand-200 sm:size-12">
                {dept.image ? (
                  <Image
                    src={dept.image}
                    alt=""
                    fill
                    sizes="3.5rem"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.9rem] leading-tight font-semibold sm:text-[0.95rem]">{dept.name}</span>
                <span className="mt-0.5 block text-xs font-medium text-ink-900/60 tabular-nums">{dept.count} products</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BrowserSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div className="hidden h-96 animate-pulse rounded-lg bg-sand-200 lg:block" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-square rounded-lg bg-sand-200" />
            <div className="mt-3 h-3 w-4/5 rounded bg-sand-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-sand-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
