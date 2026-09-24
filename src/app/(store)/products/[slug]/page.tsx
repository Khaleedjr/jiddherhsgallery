import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { ProductRail } from "@/components/product-rail";
import { Breadcrumbs, Container, SectionHeading } from "@/components/ui";
import { getCatalog, toCards } from "@/lib/catalog";
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

  const related = toCards(relatedProducts(product, 8));
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
        <ProductDetail product={product} />
      </Container>

      {related.length > 0 ? (
        <section className="border-t border-sand-200 bg-sand-100 py-16">
          <Container>
            <SectionHeading
              eyebrow="You may also like"
              title="Goes well with this"
              description="Chosen from the same shelf and age range."
            />
            <ProductRail products={related} className="mt-9" />
          </Container>
        </section>
      ) : null}
    </>
  );
}
