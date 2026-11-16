import { cache } from "react";
import { DEFAULT_FONTS, isFontId, type FontChoice } from "@/lib/fonts";
import { getDriver } from "@/lib/store/driver";

const KEY = "site-style";

/** The heading and text fonts chosen in the dashboard (the originals until someone picks others). */
export const getSiteFonts = cache(async (): Promise<FontChoice> => {
  try {
    const saved = await getDriver().getValue<Partial<FontChoice>>(KEY);
    return {
      heading: isFontId(saved?.heading) ? saved.heading : DEFAULT_FONTS.heading,
      body: isFontId(saved?.body) ? saved.body : DEFAULT_FONTS.body,
    };
  } catch (error) {
    console.error("Couldn't read the font choice; using the defaults.", error);
    return DEFAULT_FONTS;
  }
});

export async function setSiteFonts(choice: FontChoice) {
  await getDriver().setValue(KEY, choice);
}
