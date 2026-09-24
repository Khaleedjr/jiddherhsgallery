import { revalidatePath } from "next/cache";

/** Storefront pages are static; after any catalogue or stock change, rebuild them on next visit. */
export const refreshStorefront = () => revalidatePath("/", "layout");
