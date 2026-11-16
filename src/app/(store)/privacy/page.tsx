import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { privacy } = await getSiteText();
  return { title: privacy.title, description: privacy.seoDescription, alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const { privacy: t } = await getSiteText();
  return <LegalPage title={t.title} intro={t.intro} updated={t.updated} sections={t.sections} />;
}
