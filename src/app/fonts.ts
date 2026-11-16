import {
  Amiri,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Sans,
  EB_Garamond,
  Figtree,
  Instrument_Sans,
  Inter,
  Lexend,
  Literata,
  Lora,
  Manrope,
  Merriweather,
  Montserrat,
  Nunito,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Sacramento,
} from "next/font/google";

/*
 * Every typeface the site can use, self-hosted by next/font. The two original
 * fonts (and the script and Arabic faces) are preloaded; the alternatives
 * from the dashboard's font picker (src/lib/fonts.ts) only add a small
 * @font-face rule each, and a visitor's browser downloads one only when it is
 * the chosen font.
 */

const instrument = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--font-instrument" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });

/* The logo's "Jidderh's" is a monoline script; Sacramento echoes it. */
const sacramento = Sacramento({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-sacramento" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], display: "swap", variable: "--font-amiri" });

const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dm-sans" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-manrope" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-jakarta" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-outfit" });
const figtree = Figtree({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-figtree" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-nunito" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-montserrat" });
const lexend = Lexend({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lexend" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-playfair" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lora" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-cormorant" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-eb-garamond" });
const literata = Literata({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-literata" });
const merriweather = Merriweather({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-merriweather" });

/** Class names that define every font's CSS variable; set on <html>. */
export const fontVariables = [
  instrument,
  bricolage,
  sacramento,
  amiri,
  dmSans,
  manrope,
  jakarta,
  outfit,
  figtree,
  nunito,
  poppins,
  montserrat,
  lexend,
  inter,
  playfair,
  lora,
  cormorant,
  ebGaramond,
  literata,
  merriweather,
]
  .map((font) => font.variable)
  .join(" ");
