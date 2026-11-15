import type { CSSProperties } from "react";
import { cx } from "@/components/ui";

/**
 * The three drawings inside the homepage arches: what the store is for, in the
 * logo's three colours. All motion is CSS (the art-* classes in globals.css)
 * and stops for visitors who ask for reduced motion; every drawing is
 * complete when still.
 */

const i = (index: number) => ({ "--i": index }) as CSSProperties;

const CRESCENT = "M31 7.5a17 17 0 1 0 9.5 30.5A16 16 0 0 1 31 7.500Z";
const SPARK = "M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z";
const KHATIM =
  "m12 1 2.2 4.6L19 3.6l-1.900 4.500L22 12l-4.900 3.900 1.900 4.500-4.800-2L12 23l-2.200-4.600-4.800 2 1.900-4.500L2 12l4.900-3.900L5 3.600l4.800 2L12 1Z";

const ground = <path d="M24 248h152" className="stroke-sand-50" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />;

/** Play: alphabet blocks, and the top one keeps being set in place. */
export function PlayScene({ className }: { className?: string }) {
  const letter = { fontFamily: "var(--font-amiri), serif", fontSize: 40 } as const;
  return (
    <svg viewBox="0 0 200 260" aria-hidden className={cx("art", className)}>
      <g className="art-spin fill-gold-500">
        <path d={KHATIM} transform="translate(134 40) scale(1.500)" />
      </g>
      <circle cx="52" cy="70" r="2.600" className="art-twinkle fill-sand-50" style={i(0)} />
      <circle cx="84" cy="36" r="2" className="art-twinkle fill-sand-50" style={i(2)} />
      {ground}
      <rect x="38" y="188" width="60" height="60" rx="9" className="fill-gold-500" />
      <text x="68" y="232" textAnchor="middle" className="fill-coal-900" style={letter}>
        ا
      </text>
      <rect x="102" y="188" width="60" height="60" rx="9" className="fill-sand-50" />
      <text x="132" y="228" textAnchor="middle" className="fill-coal-900" style={letter}>
        ب
      </text>
      <g className="art-drop">
        <rect x="71" y="127" width="58" height="58" rx="9" className="fill-coal-900 stroke-sand-50" strokeWidth="2.500" />
        <text x="100" y="166" textAnchor="middle" className="fill-gold-500" style={letter}>
          ت
        </text>
      </g>
    </svg>
  );
}

/** Read: an open Qur'an on its stand under the crescent, with light rising from the page. */
export function ReadScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 260" aria-hidden className={cx("art", className)}>
      <path d={CRESCENT} transform="translate(64 26) scale(1.450)" className="fill-gold-500" />
      <circle cx="44" cy="96" r="2.400" className="art-twinkle fill-sand-50" style={i(1)} />
      <circle cx="160" cy="62" r="2.800" className="art-twinkle fill-sand-50" style={i(3)} />
      <circle cx="150" cy="120" r="2" className="art-twinkle fill-sand-50" style={i(4)} />
      {ground}
      {/* Rehal: two crossed boards. */}
      <path d="M62 214 132 246M138 214 68 246" className="stroke-gold-500" strokeWidth="9" strokeLinecap="round" />
      <path d="M100 178 40 158v44l60 22Z" className="fill-sand-50" />
      <path d="M100 178l60-20v44l-60 22Z" className="fill-sand-200" />
      <path
        d="M51 172l39 13m-39-2 39 13m-39-2 39 13M149 172l-39 13m39-2-39 13m39-2-39 13"
        className="stroke-coal-900"
        strokeOpacity="0.32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M100 178v46" className="stroke-gold-500" strokeWidth="3" strokeLinecap="round" />
      {[
        [100, 150],
        [80, 146],
        [121, 142],
      ].map(([x, y], n) => (
        <g key={n} transform={`translate(${x} ${y})`}>
          <path d={SPARK} className={cx("art-rise", n === 0 ? "fill-gold-500" : "fill-sand-50")} style={i(n)} />
        </g>
      ))}
    </svg>
  );
}

/** Worship: a tasbih on its peg; the beads light one after another, as they are counted. */
export function WorshipScene({ className }: { className?: string }) {
  const beads = Array.from({ length: 20 }, (_, k) => {
    const a = ((-90 + k * 18) * Math.PI) / 180;
    return { k, x: 100 + 46 * Math.cos(a), y: 110 + 74 * Math.sin(a) };
  }).filter((bead) => bead.k !== 0 && bead.k !== 10);
  return (
    <svg viewBox="0 0 200 260" aria-hidden className={cx("art", className)}>
      <circle cx="40" cy="58" r="2.400" className="art-twinkle fill-sand-50" style={i(2)} />
      <circle cx="164" cy="92" r="2.600" className="art-twinkle fill-sand-50" style={i(0)} />
      {ground}
      <g className="art-sway">
        <ellipse cx="100" cy="110" rx="46" ry="74" fill="none" className="stroke-sand-50" strokeOpacity="0.35" strokeWidth="1.500" />
        {beads.map((bead, n) => (
          <circle
            key={bead.k}
            cx={bead.x.toFixed(2)}
            cy={bead.y.toFixed(2)}
            r="6.500"
            className={cx("art-bead", n % 4 === 3 ? "fill-sand-50" : "fill-gold-500")}
            style={i(n)}
          />
        ))}
        <circle cx="100" cy="184" r="10" className="fill-sand-50" />
        <path d="M100 194v12" className="stroke-sand-50" strokeWidth="2.500" strokeLinecap="round" />
        <path d="M92 206h16l5 30H87Z" className="fill-gold-500" />
        <path d="M96 214v20m8-20v20" className="stroke-coal-900" strokeOpacity="0.35" strokeWidth="1.500" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="34" r="5" className="fill-sand-50" />
    </svg>
  );
}
