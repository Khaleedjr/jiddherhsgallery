import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { ProductRail } from "@/components/product-rail";
import { Breadcrumbs, Container, SectionHeading } from "@/components/ui";
import { getCatalog, toCards } from "@/lib/catalog";
import { getSiteText } from "@/lib/content/text";
import { getPairings } from "@/lib/pairs";
import { site } from "@/lib/site";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const { products } = await getCatalog();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { getProduct } = await getCatalog();
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.descriptionText || product.summary || `${product.name} — available at ${site.name}.`;

  return {
    title: product.name,
    description: description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | ${site.name}`,
      description: description.slice(0, 200),
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { departments, getProduct, relatedProducts } = await getCatalog();
  const product = getProduct(slug);
  if (!product) notFound();

  const [pairings, { shopping: t }] = await Promise.all([getPairings(product, 2), getSiteText()]);
  const companions = pairings.map(({ product: p, together }) => {
    const options = p.variants
      .filter((variant) => variant.inStock)
      .map((variant) => ({ id: variant.id, label: variant.label, price: variant.price ?? p.price, image: variant.image }));
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: options[0]?.price ?? p.price,
      image: p.images[0] ?? null,
      together,
      ...(options.length ? { optionName: p.variants[0].optionName, options } : {}),
    };
  });
  /* The rail below shows similar things; anything already offered in the set stays out of it. */
  const paired = new Set(companions.map((c) => c.id));
  const related = toCards(relatedProducts(product, 10).filter((p) => !paired.has(p.id)).slice(0, 8));
  const department = departments.find((dept) => product.categories.includes(dept.slug));
  const subCategory = department?.children.find((child) => product.categories.includes(child.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.descriptionText || product.summary,
    image: product.images.slice(0, 6),
    sku: product.sku ?? product.id,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: `${site.url}/products/${product.slug}`,
      priceCurrency: site.currency,
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="pt-6 pb-4 sm:pt-8">
        <Breadcrumbs
          trail={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            ...(department ? [{ label: department.name, href: `/collections/${department.slug}` }] : []),
            ...(subCategory ? [{ label: subCategory.name, href: `/collections/${subCategory.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </Container>

      <Container className="pb-16">
        <ProductDetail product={product} companions={companions} />
      </Container>

      {related.length > 0 ? (
        <section className="border-t border-sand-200 bg-sand-100 py-16">
          <Container>
            <SectionHeading
              eyebrow={t.relatedEyebrow}
              title={t.relatedTitle}
              description={t.relatedText}
            />
            <ProductRail products={related} className="mt-9" />
          </Container>
        </section>
      ) : null}
    </>
  );
}
