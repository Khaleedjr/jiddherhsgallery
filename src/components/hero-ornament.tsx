/**
 * The hero's centrepiece: an arched alcove of Islamic books, lit by three
 * lanterns hanging in front of it. Drawn rather than photographed, so the
 * opening belongs to the store rather than to one product.
 *
 * The viewBox stays squat (460×500) so the artwork can run nearly full width
 * on a phone without pushing the rest of the hero off screen.
 */

/** [width, height, fill opacity] for each standing spine. */
const SHELF_TOP: Array<[number, number, number]> = [
  [18, 54, 0.22],
  [13, 44, 0.12],
  [20, 56, 0.28],
  [15, 48, 0.16],
  [22, 52, 0.2],
  [14, 46, 0.1],
];

const SHELF_MIDDLE: Array<[number, number, number]> = [
  [16, 50, 0.16],
  [22, 56, 0.26],
  [12, 42, 0.1],
  [18, 54, 0.2],
  [26, 58, 0.3],
  [14, 46, 0.12],
  [20, 52, 0.22],
  [16, 48, 0.14],
  [24, 56, 0.24],
];

const SHELF_BOTTOM: Array<[number, number, number]> = [
  [18, 54, 0.2],
  [24, 60, 0.28],
  [13, 46, 0.1],
  [20, 56, 0.22],
  [16, 50, 0.14],
  [26, 58, 0.3],
  [14, 44, 0.12],
  [22, 54, 0.24],
  [17, 48, 0.16],
];

function Shelf({
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
          <g key={i}>
            <rect
              x={bx}
              y={baseline - h}
              width={w}
              height={h}
              rx="1.5"
              fill="#e7cc8d"
              fillOpacity={o}
              stroke="#e7cc8d"
              strokeOpacity="0.55"
              strokeWidth="1.1"
            />
            <path
              d={`M${bx + 3} ${baseline - h + 8}h${w - 6}`}
              stroke="#e7cc8d"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <path
              d={`M${bx + 3} ${baseline - h + 13}h${w - 6}`}
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

function Board({ y }: { y: number }) {
  return (
    <>
      <path d={`M100 ${y}h256`} stroke="#e7cc8d" strokeOpacity="0.6" strokeWidth="2.5" fill="none" />
      <path d={`M100 ${y + 4}h256`} stroke="#e7cc8d" strokeOpacity="0.18" strokeWidth="1" fill="none" />
    </>
  );
}

export function HeroOrnament({ className }: { className?: string }) {
  const lanterns = [
    { x: 142, drop: 168, scale: 0.82, sway: "-1.2s", pulse: "0s" },
    { x: 232, drop: 104, scale: 0.6, sway: "-2.6s", pulse: "-0.9s" },
    { x: 318, drop: 152, scale: 0.72, sway: "-0.4s", pulse: "-1.7s" },
  ];

  return (
    <svg
      viewBox="0 0 460 500"
      className={className}
      role="img"
      aria-label="An arched alcove holding three shelves of Islamic books, lit by hanging lanterns"
    >
      <defs>
        <linearGradient id="jg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06251c" />
          <stop offset="70%" stopColor="#0d3a2b" />
          <stop offset="100%" stopColor="#124937" />
        </linearGradient>

        <linearGradient id="jg-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7cc8d" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#cd9a32" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#cd9a32" stopOpacity="0.08" />
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

        <linearGradient id="jg-alcove" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#041b14" stopOpacity="0" />
          <stop offset="100%" stopColor="#041b14" stopOpacity="0.5" />
        </linearGradient>

        <path id="jg-opening" d="M96 430V234c0-78 62-156 134-180 72 24 134 102 134 180v196Z" />
        <clipPath id="jg-clip">
          <use href="#jg-opening" />
        </clipPath>
        {/* keeps the leaning volume sitting on the board, not through it */}
        <clipPath id="jg-shelfclip">
          <rect x="90" y="250" width="280" height="178" />
        </clipPath>

        {/* One fanoos, hung from its own origin so a sway carries the chain too. */}
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

      <use href="#jg-opening" fill="url(#jg-sky)" />

      <g clipPath="url(#jg-clip)">
        <g fill="#e7cc8d">
          {[
            [126, 112, 4.2, 0.55],
            [174, 74, 2.8, 0.4],
            [108, 178, 2.4, 0.3],
            [286, 88, 3.2, 0.45],
            [344, 146, 2.6, 0.34],
            [268, 196, 2.2, 0.26],
            [196, 208, 2.4, 0.24],
            [356, 210, 2.2, 0.22],
          ].map(([cx, cy, r, o], i) => (
            <path
              key={i}
              transform={`translate(${cx} ${cy}) scale(${r / 10})`}
              opacity={o}
              d="M0-10 2.3-2.3 10 0 2.3 2.3 0 10-2.3 2.3-10 0-2.3-2.3Z"
            />
          ))}
        </g>

        {/* the alcove darkens towards the shelves */}
        <rect x="90" y="230" width="280" height="202" fill="url(#jg-alcove)" />

        <Shelf books={SHELF_TOP} startX={112} baseline={302} />
        <g stroke="#e7cc8d" strokeOpacity="0.5" strokeWidth="1.1" fill="#e7cc8d">
          <rect x="248" y="293" width="74" height="9" rx="1.5" fillOpacity="0.2" />
          <rect x="252" y="284" width="68" height="9" rx="1.5" fillOpacity="0.14" />
          <rect x="256" y="275" width="60" height="9" rx="1.5" fillOpacity="0.24" />
        </g>
        <Board y={302} />

        <Shelf books={SHELF_MIDDLE} startX={110} baseline={366} />
        <Board y={366} />

        <Shelf books={SHELF_BOTTOM} startX={108} baseline={428} />
        <g transform="rotate(-9 340 428)" clipPath="url(#jg-shelfclip)">
          <rect
            x="323"
            y="378"
            width="17"
            height="50"
            rx="1.5"
            fill="#e7cc8d"
            fillOpacity="0.18"
            stroke="#e7cc8d"
            strokeOpacity="0.55"
            strokeWidth="1.1"
          />
          <path d="M326 387h11" stroke="#e7cc8d" strokeOpacity="0.4" strokeWidth="1" />
        </g>
        <path d="M100 428h256" stroke="#e7cc8d" strokeOpacity="0.6" strokeWidth="2.5" fill="none" />
      </g>

      {/* the arch, as a band between two outlines */}
      <path
        d="M80 430V232c0-88 68-174 150-202 82 28 150 114 150 202v198h-16V234c0-78-62-156-134-180-72 24-134 102-134 180v196Z"
        fill="url(#jg-band)"
      />
      <path
        d="M80 430V232c0-88 68-174 150-202 82 28 150 114 150 202v198"
        fill="none"
        stroke="#e7cc8d"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <path
        d="M96 430V234c0-78 62-156 134-180 72 24 134 102 134 180v196"
        fill="none"
        stroke="#e7cc8d"
        strokeOpacity="0.28"
        strokeWidth="1"
      />

      {[
        [88, 232],
        [372, 232],
      ].map(([cx, cy]) => (
        <g key={cx} transform={`translate(${cx} ${cy})`}>
          <circle r="5.5" fill="none" stroke="#e7cc8d" strokeOpacity="0.5" strokeWidth="1" />
          <circle r="1.8" fill="#e7cc8d" fillOpacity="0.7" />
        </g>
      ))}

      <path d="M62 430h336" stroke="#e7cc8d" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M74 438h312" stroke="#e7cc8d" strokeOpacity="0.16" strokeWidth="1" />

      <g stroke="#e7cc8d" strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeLinecap="round">
        {lanterns.map((lamp) => (
          <g
            key={lamp.x}
            className="jg-sway"
            style={{ transformOrigin: `${lamp.x}px 0px`, animationDelay: lamp.sway }}
          >
            <path d={`M${lamp.x} 0v${lamp.drop}`} strokeOpacity="0.45" strokeWidth="1" />
            <g transform={`translate(${lamp.x} ${lamp.drop}) scale(${lamp.scale})`}>
              <ellipse
                className="jg-pulse"
                style={{ animationDelay: lamp.pulse }}
                cx="0"
                cy="52"
                rx="38"
                ry="46"
                fill="url(#jg-lampglow)"
                stroke="none"
              />
              <use href="#jg-fanoos" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
