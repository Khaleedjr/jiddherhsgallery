import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProductGrid } from "@/components/product-card";
import { ButtonLink, Container, EmptyState } from "@/components/ui";
import { getCatalog, toCards } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Jidderh's Gallery catalogue for books, toys and ibadah essentials.",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = ["Qur'an", "seerah", "prayer mat", "flash cards", "activity book", "tasbeeh", "posters"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const { departments, searchProducts } = await getCatalog();
  const results = query ? toCards(searchProducts(query)) : [];

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search the gallery"}
        description={
          query
            ? `${results.length} ${results.length === 1 ? "product matches" : "products match"} your search.`
            : "Type in the search bar above, or start from one of these popular searches."
        }
        trail={[{ label: "Home", href: "/" }, { label: "Search" }]}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <Link
              key={suggestion}
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-[0.78rem] text-ink-700 transition hover:border-forest-500 hover:text-forest-800"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      </PageHeader>

      <Container className="py-10 sm:py-12">
        {query && results.length === 0 ? (
          <EmptyState
            title="No matches for that search"
            description="Try a shorter word, check the spelling, or browse a department instead — we may still have what you need."
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
            title="What are you looking for?"
            description="Search by title, topic or age — for example “bedtime stories”, “tajweed” or “prayer mat”."
            action={
              <ButtonLink href="/shop" size="lg">
                Browse everything
              </ButtonLink>
            }
          />
        ) : null}
      </Container>
    </>
  );
}
