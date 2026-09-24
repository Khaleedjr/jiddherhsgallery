import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ShopBrowser } from "@/components/shop-browser";
import { Container } from "@/components/ui";
import { getCatalog, toShopItem } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { catalogMeta } = await getCatalog();
  return {
  title: "Shop all products",
  description: `Browse all ${catalogMeta.productCount} Islamic books, toys, ibadah essentials and modest wear at Jidderh's Gallery. Filter by age, category and price.`,
  alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage() {
  const { ageGroups, catalogMeta, departments, products } = await getCatalog();
  const items = products.map(toShopItem);

  return (
    <>
      <PageHeader
        eyebrow="The full shelf"
        title="Shop all products"
        description={`Every title, toy and essential in the gallery — ${catalogMeta.productCount} products in total. Use the filters to narrow by age, category, topic or price.`}
        trail={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />

      <Container className="py-10 sm:py-12">
        <Suspense fallback={<BrowserSkeleton />}>
          <ShopBrowser products={items} departments={departments} ageGroups={ageGroups} />
        </Suspense>
      </Container>
    </>
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
