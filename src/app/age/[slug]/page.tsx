import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ShopBrowser } from "@/components/shop-browser";
import { Container, cx } from "@/components/ui";
import { ageGroups, departments, findAgeGroup, productsInAge, toShopItem } from "@/lib/catalog";
import { site } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return ageGroups.map((age) => ({ slug: age.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const age = findAgeGroup(slug);
  if (!age) return { title: "Age group not found" };

  const description = `Islamic books, toys and gifts for ${age.name} — ${age.blurb.toLowerCase()}. Shop ${age.count} age-appropriate products at ${site.name}.`;
  return {
    title: `Ages ${age.name}`,
    description,
    alternates: { canonical: `/age/${age.slug}` },
  };
}

export default async function AgePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const age = findAgeGroup(slug);
  if (!age) notFound();

  const items = productsInAge(age.value).map(toShopItem);

  return (
    <>
      <PageHeader
        eyebrow="Shop by age"
        title={`For ${age.name}`}
        description={`${age.blurb}. ${items.length} products chosen to suit this stage.`}
        trail={[{ label: "Home", href: "/" }, { label: "Shop by age" }, { label: age.name }]}
        tone="forest"
      >
        <div className="no-scrollbar mt-7 -mb-1 flex gap-2 overflow-x-auto pb-1">
          {ageGroups.map((group) => (
            <Link
              key={group.slug}
              href={`/age/${group.slug}`}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-medium whitespace-nowrap transition",
                group.slug === age.slug
                  ? "border-gold-400 bg-gold-400 text-forest-950"
                  : "border-sand-100/25 text-sand-100 hover:border-gold-400/60 hover:text-gold-300",
              )}
            >
              {group.name}
              <span className={cx("text-[0.68rem]", group.slug === age.slug ? "text-forest-800" : "text-sand-300/60")}>
                {group.count}
              </span>
            </Link>
          ))}
        </div>
      </PageHeader>

      <Container className="py-10 sm:py-12">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-sand-100" />}>
          <ShopBrowser
            products={items}
            departments={departments}
            ageGroups={ageGroups}
            scope={{ age: age.value }}
            hideAgeFilter
          />
        </Suspense>
      </Container>
    </>
  );
}
