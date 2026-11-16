import Link from "next/link";
import { SECTIONS, SECTION_KEYS } from "@/lib/content/schema";
import { getSiteFonts } from "@/lib/content/style";
import { getTextOverrides } from "@/lib/content/text";
import { fontById } from "@/lib/fonts";

/** Every page's text at a glance, with how many fields have been changed on each. */
export default async function ContentOverviewPage() {
  const [overrides, fonts] = await Promise.all([getTextOverrides(), getSiteFonts()]);
  const cards = [
    ...SECTION_KEYS.map((key) => {
      const edited = Object.keys(overrides[key] ?? {}).length;
      return {
        href: `/admin/content/${key}`,
        title: SECTIONS[key].title,
        description: SECTIONS[key].description,
        status: edited ? `${edited} ${edited === 1 ? "field" : "fields"} changed` : "Original wording",
        edited: edited > 0,
      };
    }),
    {
      href: "/admin/content/fonts",
      title: "Fonts",
      description: "The typefaces for headings and for the rest of the text.",
      status: `${fontById(fonts.heading).name} and ${fontById(fonts.body).name}`,
      edited: fonts.heading !== "bricolage" || fonts.body !== "instrument",
    },
  ];

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <li key={card.href}>
          <Link
            href={card.href}
            className="flex h-full flex-col rounded-xl border border-sand-200 bg-white p-5 shadow-[0_1px_2px_rgb(22_19_15/0.04)] transition hover:border-sand-300 hover:shadow-[0_8px_24px_-16px_rgb(20_17_10/0.35)]"
          >
            <span className="font-display text-lg leading-tight font-semibold text-ink-900">{card.title}</span>
            <span className="mt-1.5 flex-1 text-[0.8rem] leading-relaxed text-ink-500">{card.description}</span>
            <span className={card.edited ? "mt-4 text-[0.74rem] font-semibold text-gold-700" : "mt-4 text-[0.74rem] text-ink-400"}>{card.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
