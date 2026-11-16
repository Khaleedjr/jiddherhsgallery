import Link from "next/link";
import { ArrowRightIcon, StarKhatimIcon } from "@/components/icons";
import { ButtonLink, Container } from "@/components/ui";
import { taxonomy } from "@/lib/catalog";
import { getSiteText } from "@/lib/content/text";

/**
 * The "this shelf is empty" message. It carries no header or footer of its
 * own: inside the store (an unknown product, collection or age) the store's
 * layout already supplies them, and the site-wide 404 wraps it in the shell.
 */
export async function NotFoundContent() {
  const { departments } = taxonomy;
  const { pages: t } = await getSiteText();
  return (
    <section className="tone-band relative overflow-hidden bg-coal-950 text-sand-100">
      <div className="pattern-girih-light absolute inset-0 opacity-25" aria-hidden />
      <Container className="relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <StarKhatimIcon className="size-10 text-gold-300" />
        <p className="mt-8 font-display text-6xl font-semibold text-gold-300 sm:text-7xl">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-sand-50 sm:text-4xl">{t.notFoundTitle}</h1>
        <p className="mt-4 max-w-md text-[0.93rem] leading-relaxed text-sand-200/85">{t.notFoundText}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" variant="gold" size="lg">
            {t.notFoundShop}
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
          <ButtonLink href="/" variant="light" size="lg">
            {t.notFoundHome}
          </ButtonLink>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {departments.map((dept) => (
            <Link
              key={dept.slug}
              href={`/collections/${dept.slug}`}
              className="rounded-full border border-sand-100/25 px-3.5 py-1.5 text-[0.78rem] text-sand-200 transition hover:border-gold-400/60 hover:text-gold-300"
            >
              {dept.name}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
