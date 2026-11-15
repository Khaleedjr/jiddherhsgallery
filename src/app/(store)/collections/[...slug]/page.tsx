import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ShopBrowser } from "@/components/shop-browser";
import { Container, cx } from "@/components/ui";
import { getCatalog, toShopItem, type Catalog } from "@/lib/catalog";
import { site } from "@/lib/site";

type Params = { slug: string[] };

const BLURBS: Record<string, string> = {
  books:
    "Board books, seerah, sahaba stories, activity books and adult study titles — every one read before it reaches the shelf.",
  "toys-learning":
    "Screen-free toys, puzzles, flash cards and posters that turn learning the deen into play.",
  "ibadah-essentials":
    "Prayer mats, tasbeeh, Qur'an stands, speakers and trackers to support the daily ibadah of the whole family.",
  "modest-wear": "Simple, well-made modest clothing for children, women and men.",
  "best-seller": "The products our customers return for — restocked as fast as they leave.",
  "new-arrivals": "The newest additions to the gallery, fresh off the shelf.",
  "ramadan-collection":
    "Calendars, lanterns, trackers and gifts to make the blessed month memorable for every age.",
  "our-production":
    "Made by Jidderh's Gallery: our own Qur'an for Kids and Juz Amma Traceable Qur'an, adhkar flexes and stickers, and ibadah trackers.",
  "books/special-categories": "Our story-book series, gathered into collections you can read straight through.",
};

export async function generateStaticParams(): Promise<Params[]> {
  const { collections, departments } = await getCatalog();
  const categoryParams = departments.flatMap((dept) => [
    { slug: [dept.slug] },
    ...dept.children.flatMap((child) => [child, ...(child.children ?? [])]).map((node) => ({ slug: node.slug.split("/") })),
  ]);
  const collectionParams = collections.map((collection) => ({ slug: [collection.slug] }));
  return [...categoryParams, ...collectionParams];
}

const resolve = (
  { findCategory, findCollection, productsInCategory, productsInCollection }: Catalog,
  slugParts: string[],
) => {
  const slug = slugParts.join("/");
  const category = findCategory(slug);
  if (category) {
    return {
      kind: "category" as const,
      slug,
      title: category.node.name,
      department: category.department,
      /** Set when this is a sub-category's own section, e.g. Special Categories > Collection 1. */
      parent: category.parent,
      node: category.node,
      isDepartment: category.isDepartment,
      products: productsInCategory(slug),
    };
  }

  if (slugParts.length === 1) {
    const collection = findCollection(slugParts[0]);
    if (collection) {
      return {
        kind: "collection" as const,
        slug,
        title: collection.name,
        department: null,
        parent: null,
        node: null,
        isDepartment: false,
        products: productsInCollection(collection.slug),
      };
    }
  }

  return null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolve(await getCatalog(), slug);
  if (!resolved) return { title: "Collection not found" };

  const description =
    BLURBS[resolved.slug] ??
    `Shop ${resolved.products.length} ${resolved.title.toLowerCase()} products at ${site.name}, delivered across Nigeria.`;

  return {
    title: resolved.title,
    description,
    alternates: { canonical: `/collections/${resolved.slug}` },
    openGraph: {
      title: `${resolved.title} | ${site.name}`,
      description,
      images: resolved.products.find((product) => product.images.length)?.images.slice(0, 1),
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const { ageGroups, departments } = catalog;
  const resolved = resolve(catalog, slug);
  if (!resolved || resolved.products.length === 0) notFound();

  const items = resolved.products.map(toShopItem);
  const department = resolved.department;

  const trail = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(department && !resolved.isDepartment
      ? [{ label: department.name, href: `/collections/${department.slug}` }]
      : []),
    ...(resolved.parent ? [{ label: resolved.parent.name, href: `/collections/${resolved.parent.slug}` }] : []),
    { label: resolved.title },
  ];

  /* Which buttons the banner shows: a sub-category with its own sections (Special Categories)
     shows those sections; a section shows its neighbours; anything else shows the department's sub-categories. */
  const ownSections = resolved.node && "children" in resolved.node ? (resolved.node.children ?? []) : [];
  const sectionParent = resolved.parent ?? (ownSections.length ? resolved.node : null);
  const siblings = sectionParent
    ? (sectionParent.children ?? [])
    : department
      ? department.children
      : [];

  return (
    <>
      <PageHeader
        eyebrow={resolved.kind === "collection" ? "Collection" : department ? department.name : "Category"}
        title={resolved.title}
        description={
          BLURBS[resolved.slug] ??
          `${resolved.products.length} ${resolved.products.length === 1 ? "product" : "products"} in this collection.`
        }
        trail={trail}
      >
        {siblings.length > 0 ? (
          /* Chips wrap onto a second line rather than scroll sideways: every option is on screen at once. */
          <div className="mt-7 flex flex-wrap gap-2">
            {sectionParent ? (
              <CategoryChip
                href={`/collections/${sectionParent.slug}`}
                label={`All ${sectionParent.name}`}
                active={sectionParent.slug === resolved.slug}
              />
            ) : department && !resolved.isDepartment ? (
              <CategoryChip href={`/collections/${department.slug}`} label={`All ${department.name}`} />
            ) : null}
            {siblings.map((child) => (
              <CategoryChip
                key={child.slug}
                href={`/collections/${child.slug}`}
                label={child.name}
                count={child.count}
                active={child.slug === resolved.slug}
              />
            ))}
          </div>
        ) : null}
      </PageHeader>

      <Container className="py-10 sm:py-12">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-sand-100" />}>
          <ShopBrowser
            products={items}
            departments={departments}
            ageGroups={ageGroups}
            scope={{ category: resolved.kind === "category" ? resolved.slug : undefined }}
            hideCategoryFilter={resolved.kind === "category" && !resolved.isDepartment}
          />
        </Suspense>
      </Container>
    </>
  );
}

function CategoryChip({
  href,
  label,
  count,
  active = false,
}: {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-1.5 text-[0.82rem] font-semibold whitespace-nowrap transition active:scale-[0.97]",
        active ? "border-coal-900 bg-coal-900 text-gold-500" : "border-coal-900/35 text-ink-900 hover:border-coal-900 hover:bg-coal-900/10",
      )}
    >
      {label}
      {count !== undefined ? (
        <span className={cx("text-[0.72rem] font-medium tabular-nums", active ? "text-gold-300" : "text-ink-900/60")}>{count}</span>
      ) : null}
    </Link>
  );
}
