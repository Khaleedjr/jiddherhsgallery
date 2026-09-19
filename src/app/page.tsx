import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { HeroOrnament } from "@/components/hero-ornament";
import { ProductRail } from "@/components/product-rail";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  HeartIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  StarKhatimIcon,
  TruckIcon,
  WhatsappIcon,
} from "@/components/icons";
import { ButtonLink, Container, Divider, Eyebrow, SectionHeading, buttonClass, cx } from "@/components/ui";
import {
  ageGroups,
  bestSellers,
  catalogMeta,
  departments,
  newArrivals,
  onSaleProducts,
  productsInCategory,
  productsInCollection,
  toCards,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import type { CardProduct } from "@/lib/types";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const sellers = toCards(bestSellers(8));
  const arrivals = toCards(newArrivals(8));
  const deals = toCards(onSaleProducts(4, 15));
  const quranPicks = productsInCategory("books/the-holy-quran")
    .filter((p) => p.inStock && p.images.length)
    .slice(0, 3);
  const ramadan = toCards(
    productsInCollection("ramadan-collection")
      .filter((p) => p.inStock && p.images.length)
      .slice(0, 4),
  );

  return (
    <>
      <Hero />
      <TrustStrip />
      <ShopByAge />
      <Departments />

      {sellers.length > 0 ? (
        <Container className="py-16 sm:py-20">
          <SectionHeading
            eyebrow="Loved by our customers"
            title="Best sellers this season"
            description="The books, toys and essentials our families come back for again and again."
            action={
              <ButtonLink href="/collections/best-seller" variant="outline" size="sm">
                View all
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            }
          />
          <ProductRail products={sellers} className="mt-9" priority />
        </Container>
      ) : null}

      <QuranFeature picks={quranPicks} />

      {arrivals.length > 0 ? (
        <Container className="py-16 sm:py-20">
          <SectionHeading
            eyebrow="Fresh on the shelves"
            title="New arrivals"
            description="Recently added to the gallery — while stock lasts."
            action={
              <ButtonLink href="/shop?sort=newest" variant="outline" size="sm">
                Shop new in
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            }
          />
          <ProductRail products={arrivals} className="mt-9" />
        </Container>
      ) : null}

      <ValueStory />

      {ramadan.length > 0 ? (
        <Container className="py-16 sm:py-20">
          <SectionHeading
            eyebrow="Seasonal"
            title="The Ramadan collection"
            description="Countdown calendars, trackers, lanterns and gifts to make the blessed month special."
            action={
              <ButtonLink href="/collections/ramadan-collection" variant="outline" size="sm">
                Explore
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
            }
          />
          <ProductRail products={ramadan} className="mt-9" />
        </Container>
      ) : null}

      {deals.length > 0 ? <Deals products={deals} /> : null}

      <Testimonials />
      <ContactCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-forest-950 text-sand-100">
      <div className="pattern-girih-light absolute inset-0 opacity-[0.28]" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_0%,rgba(21,75,58,0.85),transparent_60%)]"
        aria-hidden
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-arabic text-xl text-gold-300">
              <span dir="rtl" lang="ar">أهلاً وسهلاً</span>
            </p>

            <p className="mt-4 text-[0.72rem] font-semibold tracking-[0.28em] text-sand-300/80 uppercase">
              {site.welcome} — welcome to {site.name}
            </p>

            <h1 className="mt-4 font-display text-[2.7rem] leading-[1.04] font-semibold text-sand-50 sm:text-6xl lg:text-[4.2rem]">
              Nurturing
              <span className="block text-gold-300">towards Jannah.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-sand-200/90 sm:text-lg">
              A reliable spot to nurture every home towards Jannah — Islamic books, toys and
              accessories for all ages, chosen with purpose and delivered nationwide.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/collections/best-seller" variant="gold" size="lg">
                Explore our best sellers
                <ArrowRightIcon className="size-4" />
              </ButtonLink>
              <a
                href={whatsappLink(`As-salamu alaykum ${site.name}, I would like to place an order.`)}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  buttonClass({ size: "lg" }),
                  "border border-sand-100/25 bg-transparent text-sand-50 hover:bg-sand-50/10",
                )}
              >
                <WhatsappIcon className="size-4" />
                Order on WhatsApp
              </a>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-sand-100/15 pt-7">
              {[
                { value: `${catalogMeta.productCount}+`, label: "Products in store" },
                { value: `${departments.length}`, label: "Curated departments" },
                { value: "36", label: "States delivered" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl font-semibold text-gold-300">{stat.value}</dt>
                  <dd className="mt-1 text-[0.72rem] leading-snug tracking-wide text-sand-300/75 uppercase">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <HeroOrnament className="mx-auto w-full max-w-[17rem] text-gold-300 sm:max-w-[20rem] lg:max-w-[27rem]" />
          </div>
        </div>
      </Container>
    </section>
  );
}

function TrustStrip() {
  const items = [
    {
      Icon: ShieldIcon,
      title: "Secure payments",
      copy: "Shop with confidence knowing that your transactions are safeguarded.",
    },
    {
      Icon: TruckIcon,
      title: "Prompt delivery",
      copy: "All orders are shipped timely to every location within the nation.",
    },
    {
      Icon: SparkIcon,
      title: "Free delivery",
      copy: `On all orders from ${formatPrice(site.freeDeliveryThreshold)} to anywhere in Nigeria.`,
    },
    {
      Icon: HeartIcon,
      title: "Chosen with purpose",
      copy: "Islamic books, toys and accessories for every age in the home.",
    },
  ];

  return (
    <section className="border-b border-sand-200 bg-sand-100">
      <Container>
        <ul className="grid divide-y divide-sand-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {items.map(({ Icon, title, copy }, index) => (
            <li
              key={title}
              className={cx(
                "flex items-start gap-3.5 py-6 sm:py-7",
                index > 0 && "sm:border-l sm:border-sand-200 sm:pl-6",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-800 text-gold-300">
                <Icon className="size-[1.1rem]" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.85rem] font-semibold text-forest-900">{title}</p>
                <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-500">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function ShopByAge() {
  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="Find the right fit"
        title="Shop by age"
        description="From cloth books for tiny hands to tafsir for the whole family — start where your child is."
        align="center"
      />

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {ageGroups.map((age, index) => (
          <Link
            key={age.slug}
            href={`/age/${age.slug}`}
            className={cx(
              "group relative flex flex-col justify-between overflow-hidden rounded-lg border border-sand-200 bg-white p-5 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-forest-200 hover:shadow-[var(--shadow-lift)]",
              index === 4 && "col-span-2 lg:col-span-1",
            )}
          >
            <span
              className="pattern-girih absolute -top-6 -right-6 size-24 opacity-[0.12] transition duration-500 group-hover:opacity-25"
              aria-hidden
            />
            <span className="font-display text-2xl leading-none font-semibold text-forest-900 sm:text-[1.7rem]">
              {age.name}
            </span>
            <span className="mt-2 text-[0.75rem] leading-snug text-ink-500">{age.blurb}</span>
            <span className="mt-5 inline-flex items-center gap-1 text-[0.72rem] font-semibold tracking-wide text-gold-600 uppercase">
              {age.count} items
              <ChevronRightIcon className="size-3 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}

function Departments() {
  const [lead, ...rest] = departments;
  if (!lead) return null;

  return (
    <section className="bg-sand-100 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Browse the gallery"
          title="Everything under one roof"
          description="Four departments, carefully stocked — from board books to prayer mats."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:grid-rows-3">
          <CategoryTile department={lead} className="lg:row-span-3" tall />
          {rest.map((dept) => (
            <CategoryTile key={dept.slug} department={dept} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function CategoryTile({
  department,
  className,
  tall = false,
}: {
  department: (typeof departments)[number];
  className?: string;
  tall?: boolean;
}) {
  return (
    <Link
      href={`/collections/${department.slug}`}
      className={cx(
        "group relative overflow-hidden rounded-xl bg-forest-900",
        tall ? "aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[34rem]" : "aspect-[16/9] sm:aspect-[2.4/1] lg:aspect-auto lg:min-h-[10.5rem]",
        className,
      )}
    >
      {department.image ? (
        <Image
          src={department.image}
          alt={department.name}
          fill
          sizes="(min-width: 1024px) 40rem, 100vw"
          className="object-cover opacity-60 transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:opacity-70"
        />
      ) : (
        <span className="pattern-girih-light absolute inset-0" aria-hidden />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/55 to-transparent" aria-hidden />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <h3 className={cx("font-display font-semibold text-sand-50", tall ? "text-3xl sm:text-4xl" : "text-2xl")}>
          {department.name}
        </h3>
        <p className="mt-1.5 text-[0.78rem] text-sand-200/85">{department.count} products</p>

        {tall && department.children.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {department.children.slice(0, 5).map((child) => (
              <li
                key={child.slug}
                className="rounded-full border border-sand-100/25 px-2.5 py-1 text-[0.7rem] text-sand-100/90"
              >
                {child.name}
              </li>
            ))}
          </ul>
        ) : null}

        <span className="mt-5 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold tracking-[0.1em] text-gold-300 uppercase">
          Shop now
          <ArrowRightIcon className="size-3.5 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function QuranFeature({ picks }: { picks: Array<{ slug: string; name: string; images: string[] }> }) {
  if (picks.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-forest-900 py-16 text-sand-100 sm:py-20">
      <div className="pattern-girih-light absolute inset-0 opacity-20" aria-hidden />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow className="text-gold-300">The heart of the home</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-tight font-semibold text-sand-50 sm:text-5xl">
              Mushafs chosen with care
            </h2>
            <p className="mt-5 max-w-lg text-[0.95rem] leading-relaxed text-sand-200/90">
              Madinah print, colour-coded tajweed, pocket sizes and beautifully bound gift editions — each
              copy checked for print quality and clarity before it leaves our shelf.
            </p>
            <Divider className="mt-8 max-w-xs opacity-40" />
            <ButtonLink href="/collections/books/the-holy-quran" variant="gold" size="lg" className="mt-8">
              Browse the Qur&apos;an collection
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {picks.map((pick, index) => (
              <Link
                key={pick.slug}
                href={`/products/${pick.slug}`}
                className={cx(
                  "group relative overflow-hidden rounded-lg border border-sand-100/15",
                  index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
                )}
              >
                <Image
                  src={pick.images[0]}
                  alt={pick.name}
                  fill
                  sizes="(min-width: 1024px) 18rem, 33vw"
                  className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ValueStory() {
  const points = [
    {
      Icon: SparkIcon,
      title: "Chosen, not just stocked",
      copy: "Every book is read and every toy tested against sound aqeedah before we shelve it.",
    },
    {
      Icon: HeartIcon,
      title: "Built around your child",
      copy: "Age-graded shelves make it simple to buy something that will actually be used.",
    },
    {
      Icon: ShieldIcon,
      title: "Honest quality",
      copy: "Real photos, accurate descriptions and clear prices — what you see is what arrives.",
    },
  ];

  return (
    <Container className="py-16 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>Our promise</Eyebrow>
          <h2 className="mt-4 text-4xl leading-tight sm:text-[2.75rem]">
            A gallery, not just a shop
          </h2>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-600">
            We focus on turning the attention of the coming generation away from the harm of modern
            technology, and towards using that same technology to learn the deen. Today that shelf holds{" "}
            {catalogMeta.productCount} products across {departments.length} departments.
          </p>
          <ButtonLink href="/about" variant="outline" className="mt-8">
            Read our story
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
        </div>

        <ul className="grid gap-4 lg:col-span-7 sm:grid-cols-3 lg:gap-5">
          {points.map(({ Icon, title, copy }) => (
            <li
              key={title}
              className="rounded-lg border border-sand-200 bg-white p-6 transition duration-300 hover:border-forest-200 hover:shadow-[var(--shadow-card)]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-forest-50 text-forest-700">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg">{title}</h3>
              <p className="mt-2 text-[0.83rem] leading-relaxed text-ink-600">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}

function Deals({ products }: { products: CardProduct[] }) {
  return (
    <section className="bg-sand-100 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Reduced this week"
          title="Save on our current offers"
          description="Genuine markdowns on selected books, toys and essentials."
          action={
            <ButtonLink href="/shop?sale=1" variant="outline" size="sm">
              All offers
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          }
        />
        <ProductRail products={products} className="mt-9" />
      </Container>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      quote:
        "Jidderh's Gallery is my sanctuary! The curated collection effortlessly blends Islamic trends with timeless teaching, making every purchase a delightful discovery. What truly sets Jidderh's Gallery apart is their customer-centric approach.",
      name: "Abubakar ATK.",
      location: "Devoted Jidderh's Gallery fan",
    },
    {
      quote:
        "The seerah set for my 7-year-old was exactly as described. Packaging was neat and the waybill reached Jabi park on time.",
      name: "Ummu Khadijah",
      location: "Abuja",
    },
    {
      quote:
        "I ordered a Madinah mushaf and a prayer mat. The print quality is excellent, and they answered every question on WhatsApp.",
      name: "Abdulrahman Y.",
      location: "Lagos",
    },
  ];

  return (
    <Container className="py-16 sm:py-20">
      <SectionHeading
        eyebrow="From our customers"
        title="Trusted by families nationwide"
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-6">
        {reviews.map((review) => (
          <figure
            key={review.name}
            className="flex flex-col rounded-lg border border-sand-200 bg-white p-6 transition duration-300 hover:shadow-[var(--shadow-card)]"
          >
            <div className="flex gap-0.5 text-gold-400" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon key={index} className="size-4" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-[0.88rem] leading-relaxed text-ink-700">
              “{review.quote}”
            </blockquote>
            <figcaption className="mt-5 border-t border-sand-200 pt-4 text-[0.78rem]">
              <span className="font-semibold text-forest-900">{review.name}</span>
              <span className="text-ink-500"> — {review.location}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Container>
  );
}

function ContactCta() {
  return (
    <Container className="pb-4">
      <div className="relative overflow-hidden rounded-xl bg-forest-800 px-6 py-14 text-center sm:px-12 sm:py-16">
        <div className="pattern-girih-light absolute inset-0 opacity-25" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <StarKhatimIcon className="mx-auto size-7 text-gold-300" />
          <h2 className="mt-5 font-display text-3xl font-semibold text-sand-50 sm:text-4xl">
            Not sure what to choose?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[0.93rem] leading-relaxed text-sand-200/90">
            Tell us the age, the budget and the occasion — we will put together a gift bundle and send you
            photos before you pay. Elevate your knowledge, embrace timeless content.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink(
                `As-salamu alaykum ${site.name}, please help me choose a gift. Age: __ , Budget: __`,
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonClass({ variant: "whatsapp", size: "lg" })}
            >
              <WhatsappIcon className="size-4" />
              Ask on WhatsApp
            </a>
            <ButtonLink href="/contact" variant="light" size="lg">
              Contact the store
            </ButtonLink>
          </div>
        </div>
      </div>
    </Container>
  );
}
