import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { returns } = await getSiteText();
  return { title: returns.title, description: returns.seoDescription, alternates: { canonical: "/returns" } };
}

/** The exchange and return policy, as it read on the old website (editable under Website text). */
export default async function ReturnsPage() {
  const { returns: t } = await getSiteText();
  return <LegalPage title={t.title} intro={t.intro} updated={t.updated} sections={t.sections} />;
}
