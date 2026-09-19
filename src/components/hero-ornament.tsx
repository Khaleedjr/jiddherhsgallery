/**
 * The hero's centrepiece: a pointed arch framing three hanging lanterns and a
 * crescent, drawn in the brand gold. Line art rather than photography, so the
 * opening reads as the store's own world instead of one product.
 */
export function HeroOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 520"
      className={className}
      role="img"
      aria-label="A crescent moon and three hanging lanterns inside an arch"
    >
      <defs>
        <linearGradient id="jg-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7cc8d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cd9a32" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="jg-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e7cc8d" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#e7cc8d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jg-arch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7cc8d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e7cc8d" stopOpacity="0.12" />
        </linearGradient>
        <g id="jg-lantern">
          {/* cap, dome, body and finial of a fanoos */}
          <path d="M-9 0h18l-3 7h-12Z" />
          <path d="M-13 7h26l-4 9h-18Z" />
          <path d="M-16 16h32l-5 40a11 11 0 0 1-22 0Z" />
          <path d="M-11 22h22M-10 32h20M-9 42h18" strokeOpacity="0.45" />
          <path d="M0 56v7" />
          <path d="M-4 63h8l-4 8Z" />
        </g>
      </defs>

      {/* pointed arch */}
      <path
        d="M210 24c56 0 100 44 100 100v300H110V124c0-56 44-100 100-100Z"
        fill="none"
        stroke="url(#jg-arch)"
        strokeWidth="1.4"
      />
      <path
        d="M210 52c41 0 74 33 74 74v298H136V126c0-41 33-74 74-74Z"
        fill="none"
        stroke="#e7cc8d"
        strokeOpacity="0.16"
        strokeWidth="1"
      />

      {/* crescent */}
      <g transform="translate(300 118)">
        <circle r="62" fill="url(#jg-halo)" />
        <path
          d="M18-40a44 44 0 1 0 0 80 36 36 0 1 1 0-80Z"
          fill="#e7cc8d"
          fillOpacity="0.92"
        />
      </g>

      {/* stars */}
      <g fill="#e7cc8d">
        {[
          [120, 96, 5, 0.75],
          [156, 64, 3.4, 0.55],
          [96, 150, 3, 0.45],
          [286, 226, 3.6, 0.5],
          [330, 176, 2.6, 0.4],
          [142, 268, 2.8, 0.35],
        ].map(([cx, cy, r, o], i) => (
          <path
            key={i}
            transform={`translate(${cx} ${cy}) scale(${r / 10})`}
            opacity={o}
            d="M0-10 2.4-2.4 10 0 2.4 2.4 0 10-2.4 2.4-10 0-2.4-2.4Z"
          />
        ))}
      </g>

      {/* lanterns, each on its own chain */}
      <g stroke="#e7cc8d" strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <g className="jg-sway" style={{ transformOrigin: "162px 40px" }}>
          <path d="M162 40v58" strokeOpacity="0.5" />
          <g transform="translate(162 98)">
            <path d="M-16 16h32l-5 40a11 11 0 0 1-22 0Z" fill="url(#jg-glow)" />
            <use href="#jg-lantern" />
          </g>
        </g>
        <g className="jg-sway jg-sway-2" style={{ transformOrigin: "228px 40px" }}>
          <path d="M228 40v112" strokeOpacity="0.5" />
          <g transform="translate(228 152) scale(1.22)">
            <path d="M-16 16h32l-5 40a11 11 0 0 1-22 0Z" fill="url(#jg-glow)" />
            <use href="#jg-lantern" />
          </g>
        </g>
        <g className="jg-sway jg-sway-3" style={{ transformOrigin: "120px 40px" }}>
          <path d="M120 40v176" strokeOpacity="0.5" />
          <g transform="translate(120 216) scale(0.86)">
            <path d="M-16 16h32l-5 40a11 11 0 0 1-22 0Z" fill="url(#jg-glow)" />
            <use href="#jg-lantern" />
          </g>
        </g>
      </g>

      {/* ground line */}
      <path d="M96 424h228" stroke="#e7cc8d" strokeOpacity="0.28" strokeWidth="1" />
      <path
        d="M186 424h48"
        stroke="#e7cc8d"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
