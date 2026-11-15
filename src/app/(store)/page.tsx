import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlayScene, ReadScene, WorshipScene } from "@/components/home/hero-art";
import { ArrowRightIcon, ClockIcon, ShieldIcon, TruckIcon, WhatsappIcon } from "@/components/icons";
import { Container, cx } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { ageFigure, getHomeData, type HomeData } from "@/lib/home";
import { site, whatsappLink } from "@/lib/site";
import type { CardProduct } from "@/lib/types";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * The homepage, design 4 ("Arches"). Phone first: every row fits on screen
 * at once, with nothing to swipe. Gold, white and black bands alternate down
 * the page: the arches, the ages, the departments, the Qur'an card, the
 * store's promises, and the offer to help choose.
 */
export default async function HomePage() {
  const data = await getHomeData();
  return (
    <div data-flush-footer>
      <Hero data={data} />
      <Ages data={data} />
      <Departments data={data} />
      <Quran products={data.quran} />
      <Promises />
      <Help />
    </div>
  );
}

const caps = "text-[0.72rem] font-semibold tracking-[0.2em] uppercase";
const btnInk =
  "inline-flex h-13 items-center justify-center gap-2 rounded-full bg-coal-900 px-8 text-[0.95rem] font-semibold text-gold-500 transition duration-200 hover:bg-black active:scale-[0.97]";
const btnLine =
  "inline-flex h-13 items-center justify-center gap-2 rounded-full border-[1.5px] border-coal-900 px-8 text-[0.95rem] font-semibold text-coal-900 transition duration-200 hover:bg-coal-900 hover:text-gold-500 active:scale-[0.97]";

/** A product or department photo that fills its (relative, sized) parent. */
function Photo({ src, alt = "", sizes, className }: { src: string | null | undefined; alt?: string; sizes: string; className?: string }) {
  if (!src) return <span className="absolute inset-0 bg-sand-200" aria-hidden />;
  return <Image src={src} alt={alt} fill sizes={sizes} className={cx("object-cover", className)} />;
}

function Hero({ data }: { data: HomeData }) {
  const [books, toys, ibadah] = data.departments;
  /* Three black windows on the gold wall, each showing one thing the store is for. */
  const arch = (dept: HomeData["departments"][number] | undefined, word: string, scene: ReactNode, className: string) =>
    dept ? (
      <Link href={`/collections/${dept.slug}`} className="group block" aria-label={`${word}: shop ${dept.name}`}>
        <span className={cx("arch block bg-coal-900 p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5", className)}>
          <span className="arch relative block h-full border border-sand-50/35">{scene}</span>
        </span>
        <span className={cx(caps, "mt-4 block pb-1 text-center")}>{word}</span>
      </Link>
    ) : null;
  const scene = "absolute top-[16%] left-[8%] h-[82%] w-[84%]";

  /* Phones and tablets stack everything on the centre line. From laptops up the
     words and the arches sit side by side, so the whole hero fits in the first screen. */
  return (
    <section className="relative overflow-hidden bg-gold-500">
      <div className="lattice absolute inset-0 opacity-[0.07]" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_32%,var(--color-gold-500)_35%,transparent)] lg:bg-[radial-gradient(45%_70%_at_27%_50%,var(--color-gold-500)_40%,transparent)]"
        aria-hidden
      />
      <Container className="relative grid items-center pt-6 pb-12 text-center sm:pt-12 sm:pb-20 lg:grid-cols-2 lg:gap-12 lg:py-16 lg:text-left xl:gap-20">
        <div>
          <p className="font-arabic text-3xl" dir="rtl" lang="ar">
            أهلاً وسهلاً
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-[clamp(2.7rem,6.200vw,5.250rem)] leading-[0.98] font-[750] tracking-[-0.035em] text-balance lg:mx-0 lg:text-[clamp(3rem,4.600vw,4.600rem)]">
            Nurturing towards Jannah
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-900/85 lg:mx-0 lg:max-w-md">
            Islamic books, toys and ibadah essentials for every age, chosen with purpose and delivered nationwide.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/collections/best-seller" className={cx(btnInk, "max-sm:w-full")}>
              Explore best sellers
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link href="/shop" className={cx(btnLine, "max-sm:w-full")}>
              Shop all products
            </Link>
          </div>
        </div>

        {/* A triptych: the centre arch stands a step taller than its neighbours. */}
        <div className="mx-auto mt-10 grid w-full max-w-3xl grid-cols-[1fr_1.200fr_1fr] items-end gap-3 sm:mt-14 sm:gap-7 lg:mt-0 lg:max-w-xl lg:gap-5 xl:gap-6">
          {arch(toys, "Play", <PlayScene className={scene} />, "aspect-[3/4.300]")}
          {arch(books, "Read", <ReadScene className={scene} />, "aspect-[3/4.700]")}
          {arch(ibadah, "Worship", <WorshipScene className={scene} />, "aspect-[3/4.300]")}
        </div>
      </Container>
    </section>
  );
}

/**
 * Ages strung on one thread, like beads on a tasbih. All five sit in one row
 * at every width, so there is nothing to swipe: tap a bead.
 */
function Ages({ data }: { data: HomeData }) {
  return (
    <section className="bg-sand-50 py-12 sm:py-24">
      <Container className="text-center">
        <h2 className="text-3xl sm:text-5xl">Begin where your child is</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-600 sm:mt-4">Tap an age to see what suits it.</p>
      </Container>
      {/* Held to a narrower measure on wide screens so the beads stay close on their thread. */}
      <Container className="relative mt-8 sm:mt-12 lg:max-w-5xl">
        <span className="absolute top-7 right-[12%] left-[12%] h-px bg-coal-900 sm:top-10 lg:top-12" aria-hidden />
        <ul className="relative grid grid-cols-5 gap-1 sm:gap-4 lg:gap-6">
          {data.ageGroups.map((age) => (
            <li key={age.slug}>
              <Link href={`/age/${age.slug}`} aria-label={`${age.name}, ${age.count} items`} className="group block text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-500 ring-4 ring-sand-50 transition-colors duration-300 group-hover:bg-coal-900 group-hover:text-gold-500 group-active:bg-coal-900 group-active:text-gold-500 sm:size-20 sm:ring-[6px] lg:size-24">
                  <span className="font-display text-[1.050rem] leading-none font-[750] tracking-tight tabular-nums sm:text-2xl lg:text-[1.700rem]">
                    {ageFigure(age.name)}
                  </span>
                </span>
                <span className={cx(caps, "mt-3 block max-sm:text-[0.600rem] max-sm:tracking-[0.160em] sm:mt-5")}>years</span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-600 max-lg:hidden">{age.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Black cards with a round photo, two by two on a phone so all four fit on one screen. */
function Departments({ data }: { data: HomeData }) {
  return (
    <section className="bg-gold-500 py-12 sm:py-24">
      <Container>
        <h2 className="text-center text-3xl sm:text-5xl">Shop by department</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:gap-6">
          {data.departments.map((dept) => (
            <li key={dept.slug}>
              <Link
                href={`/collections/${dept.slug}`}
                className="group flex h-full flex-col-reverse justify-end gap-4 rounded-[1.5rem] bg-coal-900 p-4 text-sand-50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 active:scale-[0.98] sm:p-6 lg:flex-row lg:items-center lg:justify-start lg:gap-8 lg:rounded-[2rem] lg:p-8"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl leading-tight font-[750] tracking-tight text-gold-500 sm:text-3xl lg:text-4xl lg:leading-none">
                    {dept.name}
                  </span>
                  <span className="mt-1 block text-sm text-coal-300 tabular-nums lg:mt-3">{dept.count} products</span>
                  <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-coal-300 max-lg:hidden">
                    {dept.children.slice(0, 4).map((child) => child.name).join(", ")}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold max-lg:hidden">
                    Shop {dept.name.toLowerCase()}
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
                <span className="relative size-16 shrink-0 overflow-hidden rounded-full sm:size-24 lg:size-40">
                  <Photo
                    src={dept.image}
                    sizes="(min-width: 1024px) 10rem, 6rem"
                    className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * The Qur'an card: mushafs as overlapping discs on cream, and the button that
 * opens the shelf. Three on phones and tablets; laptops have the room for a
 * fourth and larger discs, so the card does not sit half empty.
 */
function Quran({ products }: { products: CardProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-label="The Qur'an shelf" className="bg-sand-50 py-10 sm:py-20">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-[1.5rem] bg-sand-200 p-6 sm:gap-8 sm:p-10 lg:rounded-[2rem] lg:p-14">
          <ul className="flex w-full max-w-lg items-center justify-center lg:max-w-3xl">
            {products.map((pick, index) => (
              <li
                key={pick.slug}
                className={cx("w-[38%] shrink-0 lg:w-[29%]", index > 0 && "-ml-[7%] lg:-ml-[5.300%]", index === 3 && "max-lg:hidden")}
              >
                <Link
                  href={`/products/${pick.slug}`}
                  aria-label={pick.name}
                  className="relative block aspect-square overflow-hidden rounded-full border-[6px] border-sand-200 bg-gold-500 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 sm:border-[8px]"
                >
                  <Photo src={pick.image} sizes="(min-width: 1024px) 14rem, (min-width: 640px) 12rem, 36vw" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/collections/books/the-holy-quran" className={cx(btnInk, "max-sm:w-full")}>
            Browse the Qur&apos;an shelf
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/** The store's three promises: a black band, one line each on a phone, three columns on wide screens. */
function Promises() {
  const items = [
    { Icon: TruckIcon, title: `Free delivery from ${formatPrice(site.freeDeliveryThreshold)}`, copy: "To anywhere in Nigeria." },
    { Icon: ClockIcon, title: `Dispatched within ${site.delivery.dispatchHours} hours`, copy: `Interstate parcels leave on ${site.delivery.interstateDays}.` },
    { Icon: ShieldIcon, title: "Secure payments", copy: "Your transactions are safeguarded at checkout." },
  ];
  return (
    <section className="bg-coal-900 text-sand-50">
      <Container>
        <ul className="grid divide-y divide-white/10 py-3 md:grid-cols-3 md:divide-x md:divide-y-0 md:py-0">
          {items.map(({ Icon, title, copy }) => (
            <li key={title} className="flex gap-4 py-5 md:block md:px-8 md:py-12 md:first:pl-0 md:last:pr-0">
              <Icon className="mt-0.5 size-6 shrink-0 text-gold-500" />
              <div>
                <p className="font-display text-lg leading-tight font-[750] tracking-tight text-gold-500 md:mt-4 md:text-2xl">{title}</p>
                <p className="mt-1 text-sm text-coal-300 md:mt-2">{copy}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** A line of the logo's white script, the question, and two ways to reach the store. */
function Help() {
  return (
    <section className="bg-gold-500 py-14 text-center sm:py-28">
      <Container className="max-w-3xl">
        <p className="font-script text-5xl leading-none text-white sm:text-6xl" aria-hidden>
          Gifts, made easy
        </p>
        <h2 className="mt-3 text-[2rem] leading-none font-[750] tracking-[-0.035em] sm:text-5xl lg:text-6xl">Not sure what to choose?</h2>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-ink-900/85 sm:mt-5">
          Tell us the age, the budget and the occasion. We will put a bundle together and send you photos before you pay.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 sm:mt-8">
          <a
            href={whatsappLink(`As-salamu alaykum ${site.name}, please help me choose a gift. Age: __ , Budget: __`)}
            target="_blank"
            rel="noreferrer"
            className={cx(btnInk, "max-sm:w-full")}
          >
            <WhatsappIcon className="size-4" />
            Ask on WhatsApp
          </a>
          <Link href="/contact" className={cx(btnLine, "max-sm:w-full")}>
            Contact the store
          </Link>
        </div>
      </Container>
    </section>
  );
}
