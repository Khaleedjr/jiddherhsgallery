import Link from "next/link";
import { cx } from "@/components/ui";
import { ageFigure } from "@/lib/home";
import type { AgeGroup } from "@/lib/types";

const KHATIM =
  "m12 1 2.2 4.6L19 3.6l-1.900 4.500L22 12l-4.900 3.900 1.900 4.500-4.800-2L12 23l-2.200-4.600-4.800 2 1.900-4.500L2 12l4.900-3.900L5 3.600l4.800 2L12 1Z";

/* The logo's colours that read on the cream page, turn and turn about, each with a spine in a contrasting tone. */
const BOOKS = [
  { fill: "bg-coal-900", spine: "bg-gold-500/70" },
  { fill: "bg-gold-500", spine: "bg-coal-900/25" },
  { fill: "bg-gold-700", spine: "bg-sand-50/35" },
];
/* Slightly uneven widths so a stack looks hand-piled. */
const WIDTHS = ["w-full", "w-[86%]", "w-[95%]", "w-[82%]", "w-full", "w-[90%]"];

/**
 * The ages as stacks of books standing on one gold shelf, one book more for
 * each age, so they climb like steps from the youngest to adults (from
 * homepage version 1). It sits straight on the page, with no panel behind
 * it. Each stack is a link to its age's shelf and lifts under the pointer;
 * the star over the last stack turns slowly unless reduced motion is asked for.
 */
export function AgeStacks({ ages, unit }: { ages: AgeGroup[]; unit: string }) {
  const last = ages.length - 1;
  return (
    // Three shared rows (stacks, shelf, labels), so every stack stands on the same shelf whatever its label's length.
    <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-5 grid-rows-[auto_auto_auto] sm:mt-14">
      {ages.map((age, stack) => (
        <li key={age.slug} className="grid grid-rows-subgrid" style={{ gridColumn: stack + 1, gridRow: "1 / span 3" }}>
          <Link
            href={`/age/${age.slug}`}
            aria-label={`${age.name}, ${age.count} items`}
            className="group row-span-3 grid grid-rows-subgrid rounded-xl focus-visible:outline-offset-4"
          >
            <span
              aria-hidden
              className="art flex flex-col-reverse items-center self-end gap-[3px] px-1.5 pb-[3px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-active:-translate-y-1 sm:gap-1 sm:px-3 sm:pb-1 lg:px-6"
            >
              {Array.from({ length: stack + 1 }, (_, level) => {
                const book = BOOKS[(stack + level) % BOOKS.length];
                return (
                  <span
                    key={level}
                    className={cx(
                      "relative block h-[1.15rem] overflow-hidden rounded-[4px] shadow-[inset_0_-2px_0_rgb(20_17_10/0.12)] sm:h-7 sm:rounded-md lg:h-8",
                      book.fill,
                      WIDTHS[(stack + level) % WIDTHS.length],
                    )}
                  >
                    <span className={cx("absolute inset-y-0 left-[13%] w-[7%]", book.spine)} />
                  </span>
                );
              })}
              {/* The top of the climb: the logo's eight-point star over the last stack. */}
              {stack === last ? (
                <svg viewBox="0 0 24 24" className="art-spin mb-1.5 size-5 fill-gold-500 sm:mb-2.5 sm:size-8">
                  <path d={KHATIM} />
                </svg>
              ) : null}
            </span>

            {/* The shelf runs under this stack; it is drawn once, below the list items. */}
            <span aria-hidden />

            <span className="block self-start pt-3 text-center sm:pt-4">
              <span className="block font-display text-[0.95rem] leading-none font-[750] tracking-tight text-ink-900 tabular-nums transition-colors group-hover:text-gold-700 sm:text-2xl lg:text-[1.7rem]">
                {ageFigure(age.name)}
              </span>
              <span className="mt-1.5 block text-[0.56rem] font-semibold tracking-[0.18em] text-ink-500 uppercase sm:mt-2 sm:text-[0.7rem] sm:tracking-[0.2em]">
                {unit}
              </span>
              <span className="mt-2 block px-2 text-[0.8rem] leading-snug text-ink-600 max-lg:hidden">{age.blurb}</span>
            </span>
          </Link>
        </li>
      ))}
      {/* The shelf: one gold plank across every stack, in the middle row. */}
      <li
        aria-hidden
        role="presentation"
        className="pointer-events-none h-2.5 rounded-full border-b-[3px] border-gold-700 bg-gold-500 shadow-[0_12px_16px_-12px_rgb(20_17_10/0.55)] sm:h-3.5 sm:border-b-4"
        style={{ gridColumn: "1 / -1", gridRow: 2 }}
      />
    </ul>
  );
}
