import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AgeStacks } from "@/components/home/age-stacks";
import { PlayScene, ReadScene, WorshipScene } from "@/components/home/hero-art";
import { ArrowRightIcon, ClockIcon, SearchIcon, ShieldIcon, TruckIcon, WhatsappIcon } from "@/components/icons";
import { Container, cx } from "@/components/ui";
import { fill, whatsappHref } from "@/lib/content/format";
import type { SiteText } from "@/lib/content/schema";
import { getSiteText } from "@/lib/content/text";
import { getHomeData, type HomeData } from "@/lib/home";
import { site } from "@/lib/site";
import type { CardProduct } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { store } = await getSiteText();
  return { title: { absolute: `${site.name} — ${store.tagline}` }, description: store.description, alternates: { canonical: "/" } };
}

type HomeText = SiteText["home"];

/**
 * The homepage, design 4 ("Arches"). Phone first: every row fits on screen
 * at once, with nothing to swipe. Gold, white and black bands alternate down
 * the page: the arches, the ages, the departments, the Qur'an card, the
 * store's promises, and the offer to help choose.
 */
export default async function HomePage() {
  const [data, text] = await Promise.all([getHomeData(), getSiteText()]);
  const t = text.home;
  return (
    <div data-flush-footer>
      <Hero data={data} t={t} />
      <Ages data={data} t={t} />
      <Departments data={data} t={t} />
      <Quran products={data.quran} t={t} />
      <Promises t={t} />
      <Help t={t} whatsapp={text.store.whatsapp} />
    </div>
  );
}

const caps = "text-[0.72rem] font-semibold tracking-[0.2em] uppercase";
const btnInk =
  "tone-ink inline-flex h-13 items-center justify-center gap-2 rounded-full bg-coal-900 px-8 text-[0.95rem] font-semibold text-gold-500 transition duration-200 hover:bg-black active:scale-[0.97]";
const btnLine =
  "inline-flex h-13 items-center justify-center gap-2 rounded-full border-[1.5px] border-coal-900 px-8 text-[0.95rem] font-semibold text-coal-900 transition duration-200 hover:bg-coal-900 hover:text-gold-500 active:scale-[0.97]";

/** A product or department photo that fills its (relative, sized) parent. */
function Photo({ src, alt = "", sizes, className }: { src: string | null | undefined; alt?: string; sizes: string; className?: string }) {
  if (!src) return <span className="absolute inset-0 bg-sand-200" aria-hidden />;
  return <Image src={src} alt={alt} fill sizes={sizes} className={cx("object-cover", className)} />;
}

function Hero({ data, t }: { data: HomeData; t: HomeText }) {
  const [books, toys, ibadah] = data.departments;
  /* Three black windows on the gold wall, each showing one thing the store is for. */
  const arch = (dept: HomeData["departments"][number] | undefined, word: string, scene: ReactNode, className: string) =>
    dept ? (
      <Link href={`/collections/${dept.slug}`} className="group block" aria-label={`${word}: shop ${dept.name}`}>
        <span className={cx("arch-tone arch block bg-coal-900 p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5", className)}>
          <span className="arch relative block h-full border border-sand-50/35">{scene}</span>
        </span>
        <span className={cx(caps, "mt-4 block pb-1 text-center")}>{word}</span>
      </Link>
    ) : null;
  const scene = "absolute top-[16%] left-[8%] h-[82%] w-[84%]";
  /* The live count of products on sale, so the button also says how big the shelf is. */
  const shopLabel = fill(t.shopButton, { productCount: data.productCount.toLocaleString("en-NG") });

  /* Phones and tablets stack everything on the centre line. From laptops up the
     words and the arches sit side by side, so the whole hero fits in the first screen. */
  return (
    <section className="tone-gold relative overflow-hidden bg-gold-500">
      <div className="rosette absolute inset-0 opacity-[0.07]" aria-hidden />
      <Container className="relative grid items-center pt-6 pb-12 text-center sm:pt-12 sm:pb-20 lg:grid-cols-2 lg:gap-12 lg:py-16 lg:text-left xl:gap-20">
        <div>
          <p className="font-arabic text-3xl" dir="auto">
            {t.greeting}
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-[clamp(2.7rem,6.200vw,5.250rem)] leading-[0.98] font-[750] tracking-[-0.035em] text-balance lg:mx-0 lg:text-[clamp(3rem,4.600vw,4.600rem)] text-white">
            {t.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-900/85 lg:mx-0 lg:max-w-md">
            <span className="block">{t.welcomeLine}</span> {t.welcomeText}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:mx-auto sm:max-w-xl sm:flex-row lg:mx-0 lg:max-w-none">
            <HeroSearch t={t} />
            <Link href="/shop" className={cx(btnLine, "shrink-0 lg:hidden")}>
              {shopLabel}
            </Link>
            {/* Laptops search from the header, so here the hero leads with one solid button. */}
            <Link href="/shop" className={cx(btnInk, "max-lg:hidden")}>
              {shopLabel}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>

        {/* A triptych: the centre arch stands a step taller than its neighbours. */}
        <div className="mx-auto mt-10 grid w-full max-w-3xl grid-cols-[1fr_1.200fr_1fr] items-end gap-3 sm:mt-14 sm:gap-7 lg:mt-0 lg:max-w-xl lg:gap-5 xl:gap-6">
          {arch(toys, t.archPlay, <PlayScene className={scene} />, "aspect-[3/4.300]")}
          {arch(books, t.archRead, <ReadScene className={scene} />, "aspect-[3/4.700]")}
          {arch(ibadah, t.archWorship, <WorshipScene className={scene} />, "aspect-[3/4.300]")}
        </div>
      </Container>
    </section>
  );
}

/**
 * The hero's search on phones and tablets (laptops have it in the header): a
 * black pill like the buttons, with the field inside it. A plain GET form to
 * /search (next/form adds client-side navigation), so it works before any
 * JavaScript has loaded.
 */
function HeroSearch({ t }: { t: HomeText }) {
  return (
    <Form
      action="/search"
      role="search"
      className="tone-ink flex h-13 min-w-0 items-center gap-2 rounded-full bg-coal-900 py-1.5 pr-1.5 pl-5 text-sand-50 transition-shadow focus-within:ring-2 focus-within:ring-sand-50/70 sm:flex-1 lg:hidden"
    >
      <SearchIcon className="size-5 shrink-0 text-gold-500" />
      <label htmlFor="hero-search" className="sr-only">
        Search the store
      </label>
      <input
        id="hero-search"
        name="q"
        type="search"
        required
        enterKeyHint="search"
        autoComplete="off"
        placeholder={t.searchPlaceholder}
        className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] text-sand-50 outline-none placeholder:text-sand-50/55 focus-visible:shadow-none focus-visible:outline-none"
      />
      <button
        type="submit"
        className="h-full shrink-0 rounded-full bg-gold-500 px-5 text-sm font-semibold text-coal-900 transition hover:bg-gold-400 active:scale-[0.97]"
      >
        {t.searchButton}
      </button>
    </Form>
  );
}

/**
 * The ages as stacks of books climbing like steps, one book more for each age
 * (see AgeStacks). All five sit in one row at every width, so there is nothing
 * to swipe: tap a stack.
 */
function Ages({ data, t }: { data: HomeData; t: HomeText }) {
  return (
    <section className="bg-sand-50 py-12 sm:py-24">
      <Container className="text-center">
        <h2 className="text-3xl sm:text-5xl">{t.agesTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-600 sm:mt-4">{t.agesText}</p>
      </Container>
      <Container>
        <AgeStacks ages={data.ageGroups} unit={t.agesUnit} />
      </Container>
    </section>
  );
}

/**
 * Black cards with a round photo, two by two on a phone so all four fit on one
 * screen. On laptops the grid is held narrower than the page, so the cards stay
 * compact instead of stretching into wide, near-empty slabs.
 */
function Departments({ data, t }: { data: HomeData; t: HomeText }) {
  return (
    <section className="tone-gold bg-gold-500 py-12 sm:py-24 lg:py-20">
      <Container>
        <h2 className="text-center text-3xl sm:text-5xl">{t.departmentsTitle}</h2>
        {/* The size of the whole shelf, under the heading of the section that opens it. */}
        <p className="mt-3 text-center text-[0.72rem] font-semibold tracking-[0.2em] text-ink-900/75 uppercase sm:mt-4 sm:text-[0.8rem]">
          {fill(t.departmentsCount, {
            productCount: data.productCount.toLocaleString("en-NG"),
            departmentCount: data.departments.length,
          })}
        </p>
        <ul className="mt-7 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:mx-auto lg:mt-10 lg:max-w-5xl lg:gap-5">
          {data.departments.map((dept) => (
            <li key={dept.slug}>
              <Link
                href={`/collections/${dept.slug}`}
                className="tone-ink group flex h-full flex-col-reverse justify-end gap-4 rounded-[1.5rem] bg-coal-900 p-4 text-sand-50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 active:scale-[0.98] sm:p-6 lg:flex-row lg:items-center lg:justify-start lg:gap-6 lg:rounded-[1.75rem] lg:p-6 xl:p-7"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl leading-tight font-[750] tracking-tight text-gold-500 sm:text-3xl lg:text-[1.75rem] lg:leading-none">
                    {dept.name}
                  </span>
                  <span className="mt-1 block text-sm text-coal-300 tabular-nums lg:mt-2">{fill(t.departmentCount, { count: dept.count })}</span>
                  <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-coal-300 max-lg:hidden">
                    {dept.children.slice(0, 4).map((child) => child.name).join(", ")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold max-lg:hidden">
                    {fill(t.departmentLink, { department: dept.name.toLowerCase() })}
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
                <span className="relative size-16 shrink-0 overflow-hidden rounded-full sm:size-24 lg:size-28">
                  <Photo
                    src={dept.image}
                    sizes="(min-width: 1024px) 7rem, 6rem"
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
function Quran({ products, t }: { products: CardProduct[]; t: HomeText }) {
  if (products.length === 0) return null;
  return (
    <section aria-label="The Qur'an shelf" className="bg-sand-50 py-10 sm:py-20">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-[1.5rem] bg-sand-200 p-6 sm:gap-8 sm:p-10 lg:mx-auto lg:max-w-5xl lg:rounded-[1.75rem]">
          <ul className="flex w-full max-w-lg items-center justify-center lg:max-w-xl">
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
                  <Photo src={pick.image} sizes="(min-width: 640px) 12rem, 36vw" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/collections/books/the-holy-quran" className={cx(btnInk, "max-sm:w-full")}>
            {t.quranButton}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/** The store's three promises: a black band, one line each on a phone, three columns on wide screens. */
function Promises({ t }: { t: HomeText }) {
  const items = [
    { Icon: TruckIcon, title: t.promise1Title, copy: t.promise1Text },
    { Icon: ClockIcon, title: t.promise2Title, copy: t.promise2Text },
    { Icon: ShieldIcon, title: t.promise3Title, copy: t.promise3Text },
  ];
  return (
    <section className="tone-band bg-coal-900 text-sand-50">
      <Container>
        <ul className="grid divide-y divide-white/10 py-3 md:grid-cols-3 md:divide-x md:divide-y-0 md:py-0">
          {items.map(({ Icon, title, copy }, index) => (
            <li key={index} className="flex gap-4 py-5 md:block md:px-8 md:py-10 md:first:pl-0 md:last:pr-0">
              <Icon className="mt-0.5 size-6 shrink-0 text-gold-500 md:size-5" />
              <div>
                <p className="font-display text-lg leading-tight font-[750] tracking-tight text-gold-500 md:mt-3 md:text-xl">{title}</p>
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
function Help({ t, whatsapp }: { t: HomeText; whatsapp: string }) {
  return (
    <section className="tone-gold bg-gold-500 py-14 text-center sm:py-28">
      <Container className="max-w-3xl">
        <p className="font-script text-5xl leading-none text-white sm:text-6xl" aria-hidden>
          {t.helpScript}
        </p>
        <h2 className="mt-3 text-[2rem] leading-none font-[750] tracking-[-0.035em] sm:text-5xl lg:text-6xl">{t.helpTitle}</h2>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-ink-900/85 sm:mt-5">{t.helpText}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 sm:mt-8">
          <a
            href={whatsappHref(whatsapp, t.helpWhatsappMessage)}
            target="_blank"
            rel="noreferrer"
            className={cx(btnInk, "max-sm:w-full")}
          >
            <WhatsappIcon className="size-4" />
            {t.helpWhatsapp}
          </a>
          <Link href="/contact" className={cx(btnLine, "max-sm:w-full")}>
            {t.helpContact}
          </Link>
        </div>
      </Container>
    </section>
  );
}
