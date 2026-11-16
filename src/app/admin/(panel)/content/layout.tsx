import type { Metadata } from "next";
import { ContentNav } from "@/components/admin/content-nav";
import { AdminPage } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Website text" };

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminPage title="Website text" description="Change the words on every page of the store, and the fonts they are set in.">
      <div className="grid gap-6 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-8">
        <ContentNav />
        <div className="min-w-0">{children}</div>
      </div>
    </AdminPage>
  );
}
