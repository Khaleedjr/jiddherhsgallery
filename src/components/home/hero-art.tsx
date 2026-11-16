import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * The homepage's three arched windows: what the store is for (play, read,
 * worship), in the logo's colours.
 *
 * Each window is one drawing: a gently pointed mihrab arch on a stone base,
 * a gold keyline inside it with an eight-point star at the crown, a warm glow
 * low in the window, and the scene. The frame follows the arch-tone swap
 * (black in light mode, white in dark mode); the scene sits in an `.art`
 * layer that keeps its own colours. All motion is CSS (the art-* classes in
 * globals.css), stops for visitors who ask for reduced motion, and every
 * drawing is complete when still.
 */

const i = (index: number) => ({ "--i": index }) as CSSProperties;

const CRESCENT = "M31 7.5a17 17 0 1 0 9.5 30.5A16 16 0 0 1 31 7.500Z";
const SPARK = "M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z";
const KHATIM =
  "m12 1 2.2 4.6L19 3.6l-1.900 4.500L22 12l-4.900 3.900 1.900 4.500-4.800-2L12 23l-2.200-4.600-4.800 2 1.900-4.500L2 12l4.900-3.900L5 3.600l4.800 2L12 1Z";

/* ------------------------------------------------------------- the arch */

const W = 320; // drawing width; the arch itself is 300 wide, the base overhangs it
const PLINTH = 16;
const TOP = 6;
const RADIUS = 180; // each side of the point is an arc this size: a little taller than a half-circle
const SPRING = TOP + Math.sqrt(RADIUS ** 2 - (RADIUS - 150) ** 2); // where the curve meets the straight sides

/** A pointed arch over straight sides, inset by `inset` from the 300-wide outline. */
function archPath(inset: number, bottom: number) {
  const left = 10 + inset;
  const right = 310 - inset;
  const r = RADIUS - inset;
  const crown = SPRING - Math.sqrt(r ** 2 - (RADIUS - 150) ** 2);
  const f = (n: number) => n.toFixed(2);
  return `M${left} ${bottom}V${f(SPRING)}A${r} ${r} 0 0 1 160 ${f(crown)}A${r} ${r} 0 0 1 ${right} ${f(SPRING)}V${bottom}Z`;
}

/**
 * One arched window with a scene in it. `tall` is the middle window, which
 * stands a step higher than its neighbours; the extra height is sky.
 */
export function ArchWindow({ id, tall = false, children }: { id: string; tall?: boolean; children: ReactNode }) {
  const height = tall ? 486 : 446;
  const body = height - PLINTH;
  const glow = `arch-glow-${id}`;
  const sceneW = 272;
  const sceneH = (sceneW / 200) * 260;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} aria-hidden className="block h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={glow} cx="50%" cy="82%" r="62%">
          <stop offset="0" style={{ stopColor: "var(--color-gold-500)", stopOpacity: 0.3 }} />
          <stop offset="0.55" style={{ stopColor: "var(--color-gold-500)", stopOpacity: 0.08 }} />
          <stop offset="1" style={{ stopColor: "var(--color-gold-500)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* The window, and the warm light low inside it (brighter under the pointer). */}
      <path d={archPath(0, body)} className="fill-coal-900" />
      <path d={archPath(0, body)} fill={`url(#${glow})`} className="opacity-75 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Gold keyline, a fainter second line inside it, and the star at the crown. */}
      <path d={archPath(13, body - 13)} fill="none" className="stroke-gold-500" strokeWidth="2.25" />
      <path d={archPath(20, body - 20)} fill="none" className="stroke-sand-50" strokeOpacity="0.14" strokeWidth="1.25" />
      <path d={KHATIM} transform={`translate(${160 - 9} ${SPRING - Math.sqrt((RADIUS - 20) ** 2 - (RADIUS - 150) ** 2) + 16}) scale(0.75)`} className="fill-gold-500" />

      {/* The scene, standing on the window's floor. */}
      <svg x={(W - sceneW) / 2} y={body - 22 - sceneH} width={sceneW} height={sceneH} viewBox="0 0 200 260" className="art overflow-visible">
        {children}
      </svg>

      {/* Stone base: wider than the arch, with a gold edge. */}
      <rect x="0" y={body} width={W} height={PLINTH} rx="3" className="fill-coal-900" />
      <rect x="0" y={body} width={W} height="3" className="fill-gold-500" />
    </svg>
  );
}

/* ------------------------------------------------------------- scenes */

const ground = <path d="M24 248h152" className="stroke-sand-50" strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round" />;

/** A block drawn in three faces, so it reads as solid: front, a lit top and a shaded side. */
function Block({ x, y, front, letter, letterClass, outline = false }: { x: number; y: number; front: string; letter: string; letterClass: string; outline?: boolean }) {
  const s = 56;
  const d = 9;
  const top = `M${x} ${y}l${d} ${-d}h${s}l${-d} ${d}Z`;
  const side = `M${x + s} ${y}l${d} ${-d}v${s}l${-d} ${d}Z`;
  return (
    <g>
      <path d={top} className={front} />
      <path d={top} className="fill-sand-50" fillOpacity="0.34" />
      <path d={side} className={front} />
      <path d={side} className="fill-coal-900" fillOpacity="0.3" />
      <rect x={x} y={y} width={s} height={s} rx="5" className={cx(front, outline && "stroke-sand-50")} strokeWidth={outline ? 2.25 : 0} />
      <text x={x + s / 2} y={y + 41} textAnchor="middle" className={letterClass} style={{ fontFamily: "var(--font-amiri), serif", fontSize: 38 }}>
        {letter}
      </text>
    </g>
  );
}

/** Play: alphabet blocks; the top one keeps being set in place. */
export function PlayScene() {
  return (
    <>
      <g className="art-spin fill-gold-500">
        <path d={KHATIM} transform="translate(138 44) scale(1.400)" />
      </g>
      <circle cx="46" cy="76" r="2.600" className="art-twinkle fill-sand-50" style={i(0)} />
      <circle cx="86" cy="46" r="2" className="art-twinkle fill-sand-50" style={i(2)} />
      <circle cx="172" cy="122" r="1.800" className="art-twinkle fill-sand-50" style={i(3)} />
      {ground}
      <Block x={34} y={192} front="fill-gold-500" letter="ا" letterClass="fill-coal-900" />
      <Block x={100} y={192} front="fill-sand-50" letter="ب" letterClass="fill-coal-900" />
      <g className="art-drop">
        <Block x={67} y={127} front="fill-coal-900" letter="ت" letterClass="fill-gold-500" outline />
      </g>
    </>
  );
}

/** Read: an open Qur'an on its stand under the crescent, with light rising from the page. */
export function ReadScene() {
  return (
    <>
      <path d={CRESCENT} transform="translate(62 6) scale(1.500)" className="fill-gold-500" />
      <circle cx="40" cy="86" r="2.400" className="art-twinkle fill-sand-50" style={i(1)} />
      <circle cx="162" cy="48" r="2.800" className="art-twinkle fill-sand-50" style={i(3)} />
      <circle cx="154" cy="112" r="2" className="art-twinkle fill-sand-50" style={i(4)} />
      <circle cx="30" cy="140" r="1.600" className="art-twinkle fill-sand-50" style={i(2)} />
      {ground}

      {/* Light rising from the open book. */}
      <g className="stroke-gold-500" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="2">
        <path d="M100 160V112M84 162 72 122M116 162l12-40M70 168 50 138M130 168l20-30" />
      </g>

      {/* Rehal: two crossed boards with carved ends. */}
      <path d="M60 210 134 246M140 210 66 246" className="stroke-gold-500" strokeWidth="9" strokeLinecap="round" />
      <path d="M60 210 134 246M140 210 66 246" className="stroke-coal-900" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />

      {/* The open book: gold page edges under two curved pages. */}
      <path d="M100 186C80 172 58 168 36 170v46c22-2 44 2 64 16Z" className="fill-gold-500" />
      <path d="M100 186c20-14 42-18 64-16v46c-22-2-44 2-64 16Z" className="fill-gold-500" />
      <path d="M100 180C80 166 58 162 38 164v46c20-2 42 2 62 16Z" className="fill-sand-50" />
      <path d="M100 180c20-14 42-18 62-16v46c-20-2-42 2-62 16Z" className="fill-sand-200" />
      <path
        d="M48 176c14-1 28 2 42 9M48 186c14-1 28 2 42 9M48 196c14-1 28 2 42 9M152 176c-14-1-28 2-42 9M152 186c-14-1-28 2-42 9M152 196c-14-1-28 2-42 9"
        fill="none"
        className="stroke-coal-900"
        strokeOpacity="0.3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M100 180v46" className="stroke-gold-500" strokeWidth="3" strokeLinecap="round" />

      {[
        [100, 150],
        [80, 146],
        [121, 142],
      ].map(([x, y], n) => (
        <g key={n} transform={`translate(${x} ${y})`}>
          <path d={SPARK} className={cx("art-rise", n === 0 ? "fill-gold-500" : "fill-sand-50")} style={i(n)} />
        </g>
      ))}
    </>
  );
}

/** Worship: a tasbih swaying on its peg over a prayer mat; the beads light one after another, as they are counted. */
export function WorshipScene() {
  const beads = Array.from({ length: 22 }, (_, k) => {
    const a = ((-90 + k * (360 / 22)) * Math.PI) / 180;
    return { k, x: 100 + 40 * Math.cos(a), y: 98 + 62 * Math.sin(a) };
  }).filter((bead) => bead.k !== 0 && bead.k !== 11);
  return (
    <>
      <circle cx="36" cy="54" r="2.400" className="art-twinkle fill-sand-50" style={i(2)} />
      <circle cx="166" cy="84" r="2.600" className="art-twinkle fill-sand-50" style={i(0)} />
      <circle cx="160" cy="166" r="1.800" className="art-twinkle fill-sand-50" style={i(4)} />

      {/* The prayer mat, lying towards the qiblah: a border, a small mihrab, and fringes at the near end. */}
      <path d="M50 212h100l20 36H30Z" className="fill-gold-500" />
      <path d="M56 217h88l14 26H42Z" fill="none" className="stroke-coal-900" strokeOpacity="0.35" strokeWidth="1.500" />
      <path d="M90 230v-6c0-6 10-10 10-10s10 4 10 10v6Z" className="fill-coal-900" fillOpacity="0.32" />
      <path d="M36 249v6M48 249v6M60 249v6M72 249v6M84 249v6M96 249v6M108 249v6M120 249v6M132 249v6M144 249v6M156 249v6M168 249v6" className="stroke-gold-500" strokeWidth="2" strokeLinecap="round" />

      <circle cx="100" cy="24" r="5" className="fill-sand-50" />
      <g className="art-sway">
        <path d="M100 24v12" className="stroke-sand-50" strokeOpacity="0.5" strokeWidth="1.500" />
        <ellipse cx="100" cy="98" rx="40" ry="62" fill="none" className="stroke-sand-50" strokeOpacity="0.32" strokeWidth="1.500" />
        {beads.map((bead, n) => (
          <circle
            key={bead.k}
            cx={bead.x.toFixed(2)}
            cy={bead.y.toFixed(2)}
            r="6"
            className={cx("art-bead", n % 5 === 4 ? "fill-sand-50" : "fill-gold-500")}
            style={i(n)}
          />
        ))}
        {/* The imam bead and the tassel. */}
        <circle cx="100" cy="162" r="9.500" className="fill-sand-50" />
        <circle cx="100" cy="36" r="5.500" className="fill-sand-50" />
        <path d="M100 171v10" className="stroke-sand-50" strokeWidth="2.500" strokeLinecap="round" />
        <path d="M93 181h14l5 26H88Z" className="fill-gold-500" />
        <path d="M96 188v17m4-17v17m4-17v17" className="stroke-coal-900" strokeOpacity="0.35" strokeWidth="1.300" strokeLinecap="round" />
      </g>
    </>
  );
}
