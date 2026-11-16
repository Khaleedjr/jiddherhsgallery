import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { delivery } = await getSiteText();
  return { title: delivery.title, description: delivery.seoDescription, alternates: { canonical: "/delivery-returns" } };
}

export default async function DeliveryReturnsPage() {
  const { delivery: t } = await getSiteText();
  return (
    <>
      <LegalPage title={t.title} intro={t.intro} updated={t.updated} sections={t.sections} />

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl sm:text-2xl">{t.busStopsTitle}</h2>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-600">{t.busStopsText}</p>
            <dl className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {t.busStops.map(({ state, stop }, index) => (
                <div key={index} className="flex items-baseline justify-between gap-4 border-b border-sand-200 pb-2.5">
                  <dt className="text-[0.8rem] font-semibold tracking-wide text-coal-900 uppercase">{state}</dt>
                  <dd className="text-right text-[0.86rem] text-ink-600">{stop}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
