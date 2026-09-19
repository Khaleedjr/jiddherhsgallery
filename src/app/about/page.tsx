import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { ArrowRightIcon, HeartIcon, ShieldIcon, SparkIcon, StarKhatimIcon } from "@/components/icons";
import { ButtonLink, Container, Divider, Eyebrow, SectionHeading } from "@/components/ui";
import { bestSellers, catalogMeta, departments } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description: `How ${site.name} grew into a Nigerian Islamic store for books, toys, ibadah essentials and modest wear.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const gallery = bestSellers(6).filter((product) => product.images.length);

  const values = [
    {
      Icon: ShieldIcon,
      title: "Sound before stylish",
      copy:
        "Every book is read and checked against sound aqeedah before it earns a place on the shelf. A beautiful cover is never enough.",
    },
    {
      Icon: HeartIcon,
      title: "Built around the child",
      copy:
        "Our shelves are graded by age so a parent can walk in knowing nothing, and walk out with something their child will actually use.",
    },
    {
      Icon: SparkIcon,
      title: "Honest, always",
      copy:
        "Real photographs, accurate descriptions and clear prices. If something is out of stock we say so rather than keep you waiting.",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Our story"
        title="A gallery built on beneficial knowledge"
        description="Jidderh's Gallery began with a simple frustration — how hard it was to find beautiful, trustworthy Islamic resources for children in Nigeria without second-guessing what was inside."
        trail={[{ label: "Home", href: "/" }, { label: "Our story" }]}
        tone="forest"
      />

      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="prose-store text-[0.95rem]">
              <p>
                What started as a small shelf of carefully chosen books has grown into a full gallery of{" "}
                <strong>{catalogMeta.productCount} products</strong> across {departments.length} departments —
                from cloth books for babies to tafsir for the whole family, from prayer mats and tasbeeh to
                flash cards, puzzles and modest wear.
              </p>
              <p>
                We are not a warehouse. Everything here is chosen the way we would choose it for our own
                children: read first, checked for quality of print and binding, and priced so that a family
                can build a library over time rather than all at once.
              </p>
              <p>
                Most of our customers reach us on WhatsApp, and we like it that way. It means every order is
                a conversation — we can tell you honestly whether a book suits a six-year-old, suggest
                something better for the budget, or put a gift bundle together and send photographs before
                you pay.
              </p>
              <p>
                <strong>
                  May Allah make what leaves our shelves a means of benefit for every home it reaches.
                </strong>
              </p>
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
                  <dt className="font-display text-2xl font-semibold text-forest-800">{stat.value}</dt>
                  <dd className="mt-1 text-[0.7rem] tracking-wide text-ink-500 uppercase">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>

      <section className="bg-sand-100 py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="What guides us" title="Three things we will not compromise" align="center" />
          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
            {values.map(({ Icon, title, copy }) => (
              <div key={title} className="rounded-lg border border-sand-200 bg-white p-6">
                <span className="grid size-11 place-items-center rounded-full bg-forest-50 text-forest-700">
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
        <div className="relative overflow-hidden rounded-xl bg-forest-900 px-6 py-14 text-center sm:px-12">
          <div className="pattern-girih-light absolute inset-0 opacity-25" aria-hidden />
          <div className="relative mx-auto max-w-xl">
            <StarKhatimIcon className="mx-auto size-7 text-gold-300" />
            <Eyebrow className="mt-5 justify-center text-gold-300">Come and see</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-sand-50 sm:text-4xl">
              Visit us in {site.address.city}
            </h2>
            <p className="mt-4 text-[0.92rem] leading-relaxed text-sand-200/90">
              Our doors are open six days a week, and our WhatsApp is open even longer.
            </p>
            <ButtonLink href="/contact" variant="gold" size="lg" className="mt-8">
              Get directions & contact
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
