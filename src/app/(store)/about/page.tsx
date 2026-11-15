import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { ArrowRightIcon, HeartIcon, ShieldIcon, SparkIcon, StarKhatimIcon } from "@/components/icons";
import { ButtonLink, Container, Divider, Eyebrow, SectionHeading } from "@/components/ui";
import { getCatalog } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description: `How ${site.name} grew into a Nigerian Islamic store for books, toys, ibadah essentials and modest wear.`,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { bestSellers, catalogMeta, departments } = await getCatalog();
  const gallery = bestSellers(6).filter((product) => product.images.length);

  const values = [
    {
      Icon: ShieldIcon,
      title: "Best quality",
      copy:
        "Each product is meticulously selected to ensure durability, functionality and a seamless experience for the family using it.",
    },
    {
      Icon: HeartIcon,
      title: "Thoughtfully curated",
      copy:
        "A selection of Islamic products across every age — cartoons, lectures, books, toys, puzzles, prayer accessories and modest wear.",
    },
    {
      Icon: SparkIcon,
      title: "Nationwide shipping",
      copy:
        "We deliver to all states of the nation. Shipping is priced by location, and confirmed with you before you pay.",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Our story"
        title="Nurturing towards Jannah"
        description="We are your favourite Islamic online store — a thoughtfully curated selection of Islamic products for every age, from Kaduna to every state in Nigeria."
        trail={[{ label: "Home", href: "/" }, { label: "Our story" }]}
        tone="ink"
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="prose-store text-[0.95rem]">
              <p>
                Jidderh&apos;s Gallery is an online store that sells Islamic books, toys and other accessories
                across all ages. We focus on turning the attention of the coming generation away from the
                harm of modern technology, and towards using that same technology to learn the deen of Islam
                and worship Allah ﷻ according to His teachings from His Messenger ﷺ.
              </p>
              <p>
                Today that shelf holds <strong>{catalogMeta.productCount} products</strong> across{" "}
                {departments.length} departments — from cloth books for babies to tafsir for the whole
                family, from prayer mats and tasbeeh to flash cards, puzzles and modest wear.
              </p>
              <p>
                Most of our customers reach us on WhatsApp, and we like it that way. It means every order is
                a conversation — we can tell you honestly whether a book suits a six-year-old, suggest
                something better for the budget, or put a gift bundle together and send photographs before
                you pay.
              </p>
              <p>
                <strong>
                  Jazakumullahu bi khair. May Allah put barakah in every item you purchase from us.
                </strong>
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Our mission", copy: site.mission },
                { label: "Our vision", copy: site.vision },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-sand-200 bg-white p-6">
                  <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-gold-600 uppercase">
                    {item.label}
                  </p>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-700">{item.copy}</p>
                </div>
              ))}
            </div>

            <Divider className="mt-10 max-w-sm" />

            <ButtonLink href="/shop" size="lg" className="mt-10">
              Browse the gallery
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
                { value: `${catalogMeta.productCount}+`, label: "Products" },
                { value: `${departments.length}`, label: "Departments" },
                { value: "36", label: "States served" },
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
          <SectionHeading eyebrow="What sets us apart" title="What you can count on" align="center" />
          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {values.map(({ Icon, title, copy }) => (
              <div key={title} className="rounded-lg border border-sand-200 bg-white p-6">
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
        <SectionHeading eyebrow="The people behind it" title="Meet the team" align="center" />
        <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
          {site.team.map((person) => (
            <div key={person.name} className="rounded-lg border border-sand-200 bg-white p-6 text-center">
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
        <div className="relative overflow-hidden rounded-[1.5rem] bg-coal-900 px-6 py-14 text-center sm:px-12 lg:rounded-[2rem]">
          <div className="pattern-girih-light absolute inset-0 opacity-25" aria-hidden />
          <div className="relative mx-auto max-w-xl">
            <StarKhatimIcon className="mx-auto size-7 text-gold-500" />
            <Eyebrow tone="light" className="mt-5 justify-center">
              Come and see
            </Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-gold-500 sm:text-5xl">
              Come and shop with us
            </h2>
            <p className="mt-4 text-[0.92rem] leading-relaxed text-sand-200/90">
              Pickups run at weekends in Kaduna, and our WhatsApp is open for orders every day.
            </p>
            <ButtonLink href="/contact" variant="gold" size="lg" className="mt-8">
              Contact & delivery
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
