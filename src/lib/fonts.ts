/**
 * The typefaces the dashboard can choose from. Each is self-hosted through
 * next/font (src/app/fonts.ts), exposed as the CSS variable named here; a font
 * is only downloaded by visitors once it is actually chosen.
 */
export const FONT_OPTIONS = [
  { id: "instrument", name: "Instrument Sans", kind: "sans", variable: "--font-instrument", note: "Clean and friendly. The site's original text font." },
  { id: "bricolage", name: "Bricolage Grotesque", kind: "sans", variable: "--font-bricolage", note: "Bold and characterful. The site's original heading font." },
  { id: "dm-sans", name: "DM Sans", kind: "sans", variable: "--font-dm-sans", note: "Soft, round and very readable." },
  { id: "manrope", name: "Manrope", kind: "sans", variable: "--font-manrope", note: "Modern and neat." },
  { id: "jakarta", name: "Plus Jakarta Sans", kind: "sans", variable: "--font-jakarta", note: "Crisp, a little playful." },
  { id: "outfit", name: "Outfit", kind: "sans", variable: "--font-outfit", note: "Geometric and airy." },
  { id: "figtree", name: "Figtree", kind: "sans", variable: "--font-figtree", note: "Warm and simple." },
  { id: "nunito", name: "Nunito", kind: "sans", variable: "--font-nunito", note: "Rounded ends, gentle for children's products." },
  { id: "poppins", name: "Poppins", kind: "sans", variable: "--font-poppins", note: "Popular geometric sans." },
  { id: "montserrat", name: "Montserrat", kind: "sans", variable: "--font-montserrat", note: "Wide and confident." },
  { id: "lexend", name: "Lexend", kind: "sans", variable: "--font-lexend", note: "Made for easy reading." },
  { id: "inter", name: "Inter", kind: "sans", variable: "--font-inter", note: "Neutral and very common." },
  { id: "playfair", name: "Playfair Display", kind: "serif", variable: "--font-playfair", note: "Elegant, high-contrast serif for headings." },
  { id: "lora", name: "Lora", kind: "serif", variable: "--font-lora", note: "Bookish serif, good for long text." },
  { id: "cormorant", name: "Cormorant Garamond", kind: "serif", variable: "--font-cormorant", note: "Delicate classic serif; best for large headings." },
  { id: "eb-garamond", name: "EB Garamond", kind: "serif", variable: "--font-eb-garamond", note: "Traditional book serif." },
  { id: "literata", name: "Literata", kind: "serif", variable: "--font-literata", note: "Made for reading on screens." },
  { id: "merriweather", name: "Merriweather", kind: "serif", variable: "--font-merriweather", note: "Sturdy serif, clear at small sizes." },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];
export type FontChoice = { heading: FontId; body: FontId };

export const DEFAULT_FONTS: FontChoice = { heading: "bricolage", body: "instrument" };

export const isFontId = (value: unknown): value is FontId => FONT_OPTIONS.some((font) => font.id === value);

export const fontById = (id: FontId) => FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];

/** The font-family value for a choice: the font, then fallbacks of the same kind. */
export function fontStack(id: FontId) {
  const font = fontById(id);
  return font.kind === "serif"
    ? `var(${font.variable}), ui-serif, Georgia, serif`
    : `var(${font.variable}), ui-sans-serif, system-ui, sans-serif`;
}
