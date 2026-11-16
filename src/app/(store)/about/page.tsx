import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { ArrowRightIcon, HeartIcon, ShieldIcon, SparkIcon, StarKhatimIcon } from "@/components/icons";
import { ButtonLink, Container, Divider, Eyebrow, SectionHeading } from "@/components/ui";
import { RichText } from "@/components/rich-text";
import { getCatalog } from "@/lib/catalog";
import { fill } from "@/lib/content/format";
import { getSiteText } from "@/lib/content/text";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSiteText();
  return { title: about.eyebrow, description: about.seoDescription, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const [{ bestSellers, catalogMeta, departments }, { about: t }] = await Promise.all([getCatalog(), getSiteText()]);
  const gallery = bestSellers(6).filter((product) => product.images.length);

  const values = [
    { Icon: ShieldIcon, title: t.value1Title, copy: t.value1Text },
    { Icon: HeartIcon, title: t.value2Title, copy: t.value2Text },
    { Icon: SparkIcon, title: t.value3Title, copy: t.value3Text },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.intro}
        trail={[{ label: "Home", href: "/" }, { label: t.eyebrow }]}
        tone="ink"
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="prose-store text-[0.95rem]">
              <RichText text={fill(t.story, { productCount: catalogMeta.productCount, departmentCount: departments.length })} />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { label: t.missionLabel, copy: t.mission },
                { label: t.visionLabel, copy: t.vision },
              ].map((item, index) => (
                <div key={index} className="rounded-lg border border-sand-200 bg-white p-6">
                  <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-gold-600 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-700">{item.copy}</p>
                </div>
              ))}
            </div>

            <Divider className="mt-10 max-w-sm" />

            <ButtonLink href="/shop" size="lg" className="mt-10">
              {t.storyButton}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              {gallery.slice(0, 4).map((product, index) => (
                <div
                  key={product.slug}
                  className={`relative overflow-hidden rounded-lg border border-sand-200 ${
                    index === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"
                  }`}
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 20rem, 45vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-sand-100 p-6">
              {[
                { value: `${catalogMeta.productCount}+`, label: t.statProducts },
                { value: `${departments.length}`, label: t.statDepartments },
                { value: t.statStatesValue, label: t.statStates },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-semibold text-coal-800">{stat.value}</dt>
                  <dd className="mt-1 text-[0.7rem] tracking-wide text-ink-500 uppercase">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>

      <section className="bg-sand-100 py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow={t.valuesEyebrow} title={t.valuesTitle} align="center" />
          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {values.map(({ Icon, title, copy }, index) => (
              <div key={index} className="rounded-lg border border-sand-200 bg-white p-6">
                <span className="grid size-11 place-items-center rounded-full bg-coal-50 text-coal-700">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg">{title}</h3>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-600">{copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <SectionHeading eyebrow={t.teamEyebrow} title={t.teamTitle} align="center" />
        <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
          {t.team.map((person, index) => (
            <div key={index} className="rounded-lg border border-sand-200 bg-white p-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-coal-50 text-coal-700">
                <StarKhatimIcon className="size-5" />
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-coal-900">{person.name}</p>
              <p className="mt-1 text-[0.8rem] tracking-wide text-gold-600 uppercase">{person.role}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="pb-16 sm:pb-20">
        <div className="tone-ink relative overflow-hidden rounded-[1.5rem] bg-coal-900 px-6 py-14 text-center sm:px-12 lg:rounded-[2rem]">
          <div className="pattern-girih-light absolute inset-0 opacity-25" aria-hidden />
          <div className="relative mx-auto max-w-xl">
            <StarKhatimIcon className="mx-auto size-7 text-gold-500" />
            <Eyebrow tone="light" className="mt-5 justify-center">
              {t.closingEyebrow}
            </Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-gold-500 sm:text-5xl">{t.closingTitle}</h2>
            <p className="mt-4 text-[0.92rem] leading-relaxed text-sand-200/90">{t.closingText}</p>
            <ButtonLink href="/contact" variant="gold" size="lg" className="mt-8">
              {t.closingButton}
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
