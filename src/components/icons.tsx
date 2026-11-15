import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const SearchIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const BagIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const MenuIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 12h15m0 0-6-6m6 6-6 6" />
  </svg>
);

export const MinusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 12h14" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

export const StarIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z" />
  </svg>
);

export const TruckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 5 6v6c0 4.3 3 7.4 7 8.5 4-1.1 7-4.2 7-8.5V6l-7-2.5Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const HeartIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
  </svg>
);

export const WhatsappIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 18.13h-.01a8.3 8.3 0 0 1-4.2-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.24 8.24 0 0 1-1.27-4.4c0-4.56 3.72-8.28 8.29-8.28 2.21 0 4.29.86 5.85 2.43a8.22 8.22 0 0 1 2.43 5.86c0 4.57-3.72 8.28-8.32 8.28Zm4.55-6.2c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.56.13-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.38-2-1.23a7.5 7.5 0 0 1-1.39-1.72c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
  </svg>
);

export const InstagramIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const FacebookIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.54-1.5h1.66V4.63c-.29-.04-1.27-.13-2.42-.13-2.4 0-4.03 1.46-4.03 4.15v2.31H7.5V14h2.75v8h3.25Z" />
  </svg>
);

export const TiktokIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M16.5 3h-2.6v12.1a2.3 2.3 0 1 1-1.9-2.26V10.2a5 5 0 1 0 4.5 4.97V8.94a6.2 6.2 0 0 0 3.4 1.02V7.37A3.62 3.62 0 0 1 16.5 3Z" />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 8 8 5.2L20 8" />
  </svg>
);

export const PhoneIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6.2 3.5h3l1.2 3.6-1.8 1.3a11.5 11.5 0 0 0 5 5l1.3-1.8 3.6 1.2v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
  </svg>
);

export const PinIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 2.5 13.6 9l6.4 1.6-6.4 1.6L12 18.6 10.4 12.2 4 10.6 10.4 9 12 2.5Z" />
  </svg>
);

/** Padlock, for secure payment. */
export const LockIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </svg>
);

/** Eight-point star used as the brand's ornamental divider. */
export const StarKhatimIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="m12 1 2.2 4.6L19 3.6l-1.9 4.5L22 12l-4.9 3.9 1.9 4.5-4.8-2L12 23l-2.2-4.6-4.8 2 1.9-4.5L2 12l4.9-3.9L5 3.6l4.8 2L12 1Z" />
  </svg>
);
