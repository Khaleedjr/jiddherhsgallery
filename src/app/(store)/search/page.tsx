import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProductGrid } from "@/components/product-card";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { getCatalog, toCards } from "@/lib/catalog";
import { fill } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Jidderh's Gallery catalogue for books, toys and ibadah essentials.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const [{ departments, searchProducts }, { pages: t }] = await Promise.all([getCatalog(), getSiteText()]);
  const results = query ? toCards(searchProducts(query)) : [];
  const suggestions = t.suggestions.split(",").map((word) => word.trim()).filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow={t.searchEyebrow}
        title={query ? fill(t.searchResultsTitle, { query }) : t.searchTitle}
        description={query ? (results.length === 1 ? t.searchCountOne : fill(t.searchCount, { count: results.length })) : t.searchIntro}
        trail={[{ label: "Home", href: "/" }, { label: "Search" }]}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion}
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-[0.78rem] text-ink-700 transition hover:border-coal-500 hover:text-coal-800"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      </PageHeader>

      <Container className="py-10 sm:py-12">
        {query && results.length === 0 ? (
          <EmptyState
            title={t.noMatchTitle}
            description={t.noMatchText}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {departments.map((dept) => (
                  <ButtonLink
                    key={dept.slug}
                    href={`/collections/${dept.slug}`}
                    variant="outline"
                    size="sm"
                  >
                    {dept.name}
                  </ButtonLink>
                ))}
              </div>
            }
          />
        ) : null}

        {results.length > 0 ? <ProductGrid products={results} priorityCount={4} /> : null}

        {!query ? (
          <EmptyState
            title={t.searchEmptyTitle}
            description={t.searchEmptyText}
            action={
              <ButtonLink href="/shop" size="lg">
                {t.searchEmptyButton}
              </ButtonLink>
            }
          />
        ) : null}
      </Container>
    </>
  );
}
