import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ShopBrowser } from "@/components/shop-browser";
import { Container, cx } from "@/components/ui";
import { getCatalog, taxonomy, toShopItem } from "@/lib/catalog";
import { site } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return taxonomy.ageGroups.map((age) => ({ slug: age.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { findAgeGroup } = await getCatalog();
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
  const { ageGroups, departments, findAgeGroup, productsInAge } = await getCatalog();
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
      >
        {/* Chips wrap onto a second line rather than scroll sideways: every age is on screen at once. */}
        <div className="mt-7 flex flex-wrap gap-2">
          {ageGroups.map((group) => (
            <Link
              key={group.slug}
              href={`/age/${group.slug}`}
              className={cx(
                "flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-1.5 text-[0.82rem] font-semibold whitespace-nowrap transition active:scale-[0.97]",
                group.slug === age.slug
                  ? "border-coal-900 bg-coal-900 text-gold-500"
                  : "border-coal-900/35 text-ink-900 hover:border-coal-900 hover:bg-coal-900/10",
              )}
            >
              {group.name}
              <span className={cx("text-[0.72rem] font-medium tabular-nums", group.slug === age.slug ? "text-gold-300" : "text-ink-900/60")}>
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
