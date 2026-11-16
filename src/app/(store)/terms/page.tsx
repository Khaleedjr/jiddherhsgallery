import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { terms } = await getSiteText();
  return { title: terms.title, description: terms.seoDescription, alternates: { canonical: "/terms" } };
}

export default async function TermsPage() {
  const { terms: t } = await getSiteText();
  return <LegalPage title={t.title} intro={t.intro} updated={t.updated} sections={t.sections} />;
}
