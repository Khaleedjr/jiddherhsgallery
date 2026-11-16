import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { ageGroups, collections, departments, products } = await getCatalog();
  const now = new Date();
  const url = (path: string) => `${site.url}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: url("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: url("/faq"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: url("/pickup-delivery"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("/returns"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = departments.flatMap((dept) => [
    { url: url(`/collections/${dept.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    ...dept.children.flatMap((child) => [child, ...(child.children ?? [])]).map((node) => ({
      url: url(`/collections/${node.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);

  const collectionPages: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: url(`/collections/${collection.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const agePages: MetadataRoute.Sitemap = ageGroups.map((age) => ({
    url: url(`/age/${age.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: url(`/products/${product.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...collectionPages, ...agePages, ...productPages];
}
