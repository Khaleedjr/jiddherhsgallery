import Link from "next/link";

/**
 * The hero's centrepiece: a carved wooden bookcase — stepped cornice, panelled
 * stiles, bracket feet — holding two shelves of books under a row of lanterns.
 *
 * The viewBox is landscape (540×450) rather than the tall arch it replaces, so
 * the artwork uses the full width of a phone instead of tapering away from it.
 */

const FRAME = {
  left: 16,
  right: 524,
  top: 14,
  bottom: 444,
  /** inner opening */
  inLeft: 58,
  inRight: 482,
  inTop: 66,
  inBottom: 386,
};

/** [width, height, fill opacity] for each standing spine. */
const SHELF_UPPER: Array<[number, number, number]> = [
  [22, 108, 0.22],
  [16, 96, 0.12],
  [26, 118, 0.28],
  [19, 102, 0.16],
  [28, 112, 0.2],
  [15, 94, 0.1],
  [24, 106, 0.26],
  [18, 98, 0.14],
  [30, 120, 0.3],
  [17, 96, 0.12],
  [23, 104, 0.22],
  [20, 110, 0.18],
];

const SHELF_LOWER: Array<[number, number, number]> = [
  [20, 74, 0.18],
  [27, 82, 0.28],
  [15, 62, 0.1],
  [23, 78, 0.22],
  [18, 68, 0.14],
  [30, 80, 0.3],
  [16, 64, 0.12],
  [25, 76, 0.24],
  [19, 70, 0.16],
  [28, 78, 0.26],
  [17, 66, 0.12],
  [22, 74, 0.2],
];

function Books({
  books,
  startX,
  baseline,
}: {
  books: Array<[number, number, number]>;
  startX: number;
  baseline: number;
}) {
  let x = startX;
  return (
    <g>
      {books.map(([w, h, o], i) => {
        const bx = x;
        x += w + 4;
        return (
          <g key={i} className="jg-book">
            <rect
              x={bx}
              y={baseline - h}
              width={w}
              height={h}
              rx="2"
              fill="#e7cc8d"
              fillOpacity={o}
              stroke="#e7cc8d"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <path
              d={`M${bx + 4} ${baseline - h + 11}h${w - 8}`}
              stroke="#e7cc8d"
              strokeOpacity="0.42"
              strokeWidth="1.1"
            />
            <path
              d={`M${bx + 4} ${baseline - h + 17}h${w - 8}`}
              stroke="#e7cc8d"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </g>
  );
}

/** A small carved boss, used on the stiles and at the frame's corners. */
function Rosette({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="none" stroke="#e7cc8d" strokeOpacity="0.45" strokeWidth="1" />
      <path
        d={`M0 ${-r} ${r * 0.28} ${-r * 0.28} ${r} 0 ${r * 0.28} ${r * 0.28} 0 ${r} ${-r * 0.28} ${r * 0.28} ${-r} 0 ${-r * 0.28} ${-r * 0.28}Z`}
        fill="#e7cc8d"
        fillOpacity="0.5"
      />
    </g>
  );
}

export function HeroOrnament({ className }: { className?: string }) {
  const lanterns = [
    { x: 148, chain: 16, scale: 0.6, sway: "-1.2s", pulse: "0s" },
    { x: 270, chain: 18, scale: 0.72, sway: "-2.6s", pulse: "-0.9s" },
    { x: 392, chain: 20, scale: 0.56, sway: "-0.4s", pulse: "-1.7s" },
  ];

  // dentil teeth under the cornice
  const dentils = Array.from({ length: 30 }, (_, i) => 30 + i * 16);
  // cusped valance hanging inside the top of the opening
  const cusps = Array.from({ length: 8 }, (_, i) => FRAME.inLeft + 4 + i * 52.5);

  return (
    <svg
      viewBox="0 0 540 458"
      className={className}
      role="img"
      aria-label="A carved wooden bookcase holding shelves of Islamic books, lit by hanging lanterns"
    >
      <defs>
        <linearGradient id="jg-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7cc8d" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#cd9a32" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a87d27" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="jg-woodv" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cd9a32" stopOpacity="0.2" />
          <stop offset="40%" stopColor="#e7cc8d" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a87d27" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="jg-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06251c" />
          <stop offset="100%" stopColor="#0e4131" />
        </linearGradient>
        <radialGradient id="jg-lampglow" cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#f6e6bd" stopOpacity="0.72" />
          <stop offset="45%" stopColor="#e7cc8d" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#cd9a32" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jg-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e6bd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cd9a32" stopOpacity="0.16" />
        </linearGradient>

        <clipPath id="jg-inner">
          <rect
            x={FRAME.inLeft}
            y={FRAME.inTop}
            width={FRAME.inRight - FRAME.inLeft}
            height={FRAME.inBottom - FRAME.inTop}
          />
        </clipPath>

        <g id="jg-fanoos">
          <circle cx="0" cy="3" r="3" />
          <path d="M0 6v13" />
          <path d="M-4 19h8l5 9h-18Z" />
          <path d="M-9 28 -12 39v25l8 11h8l8-11V39l-3-11Z" fill="url(#jg-glass)" />
          <path d="M-12 42h24M-12 61h24" strokeOpacity="0.5" />
          <path d="M-6 30v42M0 29v45M6 30v42" strokeOpacity="0.32" />
          <path d="M0 75v6" />
          <path d="m0 81 3.5 5-3.5 6-3.5-6Z" />
        </g>
      </defs>

      {/* the dark back of the case */}
      <rect
        x={FRAME.inLeft}
        y={FRAME.inTop}
        width={FRAME.inRight - FRAME.inLeft}
        height={FRAME.inBottom - FRAME.inTop}
        fill="url(#jg-back)"
      />

      {/* ── carcase ─────────────────────────────────────────── */}
      <g stroke="#e7cc8d" strokeLinejoin="round">
        {/* crest finials */}
        {[150, 270, 390].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path
              d="M0 4c-4 5-7 9-7 13 0 4 3 7 7 7s7-3 7-7c0-4-3-8-7-13Z"
              fill="url(#jg-wood)"
              strokeOpacity="0.5"
              strokeWidth="1.1"
            />
          </g>
        ))}

        {/* cornice: projecting board, dentils, frieze */}
        <rect x={FRAME.left} y="24" width={FRAME.right - FRAME.left} height="16" rx="2" fill="url(#jg-wood)" strokeOpacity="0.55" strokeWidth="1.3" />
        <g fill="url(#jg-wood)" strokeOpacity="0.3" strokeWidth="0.8">
          {dentils.map((x) => (
            <rect key={x} x={x} y="40" width="8" height="10" />
          ))}
        </g>
        <rect x={FRAME.left + 8} y="50" width={FRAME.right - FRAME.left - 16} height="16" rx="2" fill="url(#jg-wood)" strokeOpacity="0.5" strokeWidth="1.2" />
        {/* carved lozenges on the frieze */}
        <g fill="#e7cc8d" fillOpacity="0.35" stroke="none">
          {Array.from({ length: 12 }, (_, i) => 60 + i * 36).map((x) => (
            <path key={x} d={`M${x} 52 ${x + 6} 58 ${x} 64 ${x - 6} 58Z`} />
          ))}
        </g>

        {/* side stiles, panelled */}
        {[
          [FRAME.left, FRAME.inLeft],
          [FRAME.inRight, FRAME.right],
        ].map(([x0, x1]) => (
          <g key={x0}>
            <rect x={x0} y={FRAME.inTop} width={x1 - x0} height={FRAME.inBottom + 9 - FRAME.inTop} fill="url(#jg-woodv)" strokeOpacity="0.5" strokeWidth="1.2" />
            <rect x={x0 + 9} y={FRAME.inTop + 16} width={x1 - x0 - 18} height={FRAME.inBottom - FRAME.inTop - 32} rx="3" fill="none" strokeOpacity="0.32" strokeWidth="1" />
            <Rosette x={(x0 + x1) / 2} y={FRAME.inTop + 46} />
            <Rosette x={(x0 + x1) / 2} y={FRAME.inBottom - 46} />
            <path d={`M${(x0 + x1) / 2} ${FRAME.inTop + 62}v${FRAME.inBottom - FRAME.inTop - 124}`} strokeOpacity="0.2" strokeWidth="1" />
          </g>
        ))}

        {/* plinth, scalloped apron and bracket feet */}
        <rect x={FRAME.left} y={FRAME.inBottom + 9} width={FRAME.right - FRAME.left} height="19" rx="2" fill="url(#jg-wood)" strokeOpacity="0.55" strokeWidth="1.3" />
        <path
          d={`M96 ${FRAME.inBottom + 28}h348v6${Array.from({ length: 6 }, () => "c-10 14-48 14-58 0").join("")}Z`}
          fill="url(#jg-wood)"
          strokeOpacity="0.4"
          strokeWidth="1.1"
        />
        {[
          [FRAME.left + 4, 96],
          [444, FRAME.right - 4],
        ].map(([x0, x1]) => (
          <path
            key={x0}
            d={`M${x0} ${FRAME.inBottom + 28}h${x1 - x0}v22c0 6-5 10-12 10h${-(x1 - x0 - 24)}c-7 0-12-4-12-10Z`}
            fill="url(#jg-wood)"
            strokeOpacity="0.5"
            strokeWidth="1.2"
          />
        ))}
      </g>

      {/* ── contents ────────────────────────────────────────── */}
      <g clipPath="url(#jg-inner)">
        {/* cusped valance hanging from the underside of the cornice */}
        <g fill="url(#jg-wood)" stroke="#e7cc8d" strokeOpacity="0.4" strokeWidth="1">
          {cusps.map((x) => (
            <path key={x} d={`M${x} ${FRAME.inTop}h52.5v6c0 12-11 20-26 20s-26.5-8-26.5-20Z`} />
          ))}
        </g>

        <Link href="/shop" className="jg-shelf">
          <title>Browse all products</title>

          <Books books={SHELF_UPPER} startX={70} baseline={286} />
          <g className="jg-book" stroke="#e7cc8d" strokeOpacity="0.5" strokeWidth="1.2" fill="#e7cc8d">
            <rect x="366" y="274" width="98" height="12" rx="2" fillOpacity="0.2" />
            <rect x="372" y="262" width="86" height="12" rx="2" fillOpacity="0.14" />
            <rect x="378" y="250" width="74" height="12" rx="2" fillOpacity="0.24" />
          </g>

          <Books books={SHELF_LOWER} startX={68} baseline={386} />
          <g className="jg-book" transform="rotate(-10 452 386)">
            <rect x="434" y="320" width="19" height="66" rx="2" fill="#e7cc8d" fillOpacity="0.18" stroke="#e7cc8d" strokeOpacity="0.55" strokeWidth="1.2" />
            <path d="M438 327h11" stroke="#e7cc8d" strokeOpacity="0.42" strokeWidth="1.1" />
          </g>
        </Link>
      </g>

      {/* shelf boards, drawn over the books so the spines sit behind the edge */}
      <g stroke="#e7cc8d" strokeLinejoin="round">
        {[286, 386].map((y) => (
          <g key={y}>
            <rect x={FRAME.inLeft} y={y} width={FRAME.inRight - FRAME.inLeft} height="9" fill="url(#jg-wood)" strokeOpacity="0.55" strokeWidth="1.2" />
            <path d={`M${FRAME.inLeft} ${y + 9}h${FRAME.inRight - FRAME.inLeft}`} strokeOpacity="0.2" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* lanterns, hung from brackets on the underside of the cornice */}
      <g stroke="#e7cc8d" strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {lanterns.map((lamp) => (
          <g key={lamp.x}>
            <path d={`M${lamp.x - 8} ${FRAME.inTop}h16`} strokeOpacity="0.75" strokeWidth="2" />
            <circle cx={lamp.x} cy={FRAME.inTop + 4} r="2.6" strokeOpacity="0.7" />
            <g
              className="jg-sway"
              style={{ transformOrigin: `${lamp.x}px ${FRAME.inTop}px`, animationDelay: lamp.sway }}
            >
              <path d={`M${lamp.x} ${FRAME.inTop + 6}v${lamp.chain}`} strokeOpacity="0.45" strokeWidth="1" />
              <g transform={`translate(${lamp.x} ${FRAME.inTop + lamp.chain}) scale(${lamp.scale})`}>
                <ellipse
                  className="jg-pulse"
                  style={{ animationDelay: lamp.pulse }}
                  cx="0"
                  cy="52"
                  rx="40"
                  ry="48"
                  fill="url(#jg-lampglow)"
                  stroke="none"
                />
                <use href="#jg-fanoos" />
              </g>
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
