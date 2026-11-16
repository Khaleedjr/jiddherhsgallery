import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { fontVariables } from "@/app/fonts";
import { ThemeScript } from "@/components/theme-script";
import { getSiteFonts } from "@/lib/content/style";
import { getSiteText } from "@/lib/content/text";
import { fontStack } from "@/lib/fonts";
import { site } from "@/lib/site";
import { DEFAULT_THEME } from "@/lib/theme";

export async function generateMetadata(): Promise<Metadata> {
  const { store } = await getSiteText();
  const title = `${site.name} — ${store.tagline}`;
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: `%s | ${site.name}` },
    description: store.description,
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
    openGraph: { type: "website", locale: site.locale, url: site.url, siteName: site.name, title, description: store.description },
    twitter: { card: "summary_large_image", title, description: store.description },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#cd9a32",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = await getSiteFonts();
  /* The dashboard's font choice: the theme's --font-sans and --font-display point at the chosen faces. */
  const fontStyle = { "--font-sans": fontStack(fonts.body), "--font-display": fontStack(fonts.heading) } as CSSProperties;

  return (
    // The boot script may set data-theme before React hydrates, hence suppressHydrationWarning.
    <html lang="en-NG" className={fontVariables} style={fontStyle} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
