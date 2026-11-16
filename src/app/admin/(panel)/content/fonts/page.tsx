import type { Metadata } from "next";
import { FontEditor } from "@/components/admin/font-editor";
import { getSiteFonts } from "@/lib/content/style";

export const metadata: Metadata = { title: "Fonts · Website text" };

export default async function FontsPage() {
  const fonts = await getSiteFonts();
  return (
    <>
      <div className="mb-5">
        <h2 className="font-display text-2xl leading-tight font-semibold">Fonts</h2>
        <p className="mt-1 text-[0.84rem] text-ink-500">
          Choose one font for headings and one for the rest of the text. The Arabic lines and the handwritten script keep their own fonts.
        </p>
      </div>
      <FontEditor initial={fonts} />
    </>
  );
}
