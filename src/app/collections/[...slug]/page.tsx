import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ShopBrowser } from "@/components/shop-browser";
import { Container, cx } from "@/components/ui";
import {
  ageGroups,
  collections,
  departments,
  findCategory,
  findCollection,
  productsInCategory,
  productsInCollection,
  toShopItem,
} from "@/lib/catalog";
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
};

export function generateStaticParams(): Params[] {
  const categoryParams = departments.flatMap((dept) => [
    { slug: [dept.slug] },
    ...dept.children.map((child) => ({ slug: child.slug.split("/") })),
  ]);
  const collectionParams = collections.map((collection) => ({ slug: [collection.slug] }));
  return [...categoryParams, ...collectionParams];
}

const resolve = (slugParts: string[]) => {
  const slug = slugParts.join("/");
  const category = findCategory(slug);
  if (category) {
    return {
      kind: "category" as const,
      slug,
      title: category.node.name,
      department: category.department,
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
  const resolved = resolve(slug);
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
  const resolved = resolve(slug);
  if (!resolved || resolved.products.length === 0) notFound();

  const items = resolved.products.map(toShopItem);
  const department = resolved.department;

  const trail = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(department && !resolved.isDepartment
      ? [{ label: department.name, href: `/collections/${department.slug}` }]
      : []),
    { label: resolved.title },
  ];

  const siblings =
    department && !resolved.isDepartment
      ? department.children
      : resolved.isDepartment && department
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
        tone="forest"
      >
        {siblings.length > 0 ? (
          <div className="no-scrollbar mt-7 -mb-1 flex gap-2 overflow-x-auto pb-1">
            {department && !resolved.isDepartment ? (
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
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-medium whitespace-nowrap transition",
        active
          ? "border-gold-400 bg-gold-400 text-forest-950"
          : "border-sand-100/25 text-sand-100 hover:border-gold-400/60 hover:text-gold-300",
      )}
    >
      {label}
      {count !== undefined ? (
        <span className={cx("text-[0.68rem]", active ? "text-forest-800" : "text-sand-300/60")}>{count}</span>
      ) : null}
    </Link>
  );
}
