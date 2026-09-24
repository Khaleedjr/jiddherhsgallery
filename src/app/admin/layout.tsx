import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Jidderh's Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-sand-100">{children}</div>;
}
