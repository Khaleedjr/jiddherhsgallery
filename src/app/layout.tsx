import type { Metadata, Viewport } from "next";
import { Amiri, Bricolage_Grotesque, Instrument_Sans, Sacramento } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { site } from "@/lib/site";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

/* The logo's "Jidderh's" is a monoline script; Sacramento echoes it. */
const sacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-sacramento",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "Islamic bookstore Nigeria",
    "Islamic books for kids",
    "Qur'an Nigeria",
    "Islamic toys",
    "prayer mats",
    "modest wear",
    "Jidderh's Gallery",
    "Kaduna Islamic store",
  ],
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#cd9a32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The boot script may set data-theme before React hydrates, hence suppressHydrationWarning.
    <html
      lang="en-NG"
      className={`${instrument.variable} ${bricolage.variable} ${sacramento.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
