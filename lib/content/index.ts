import { heContent } from "@/lib/content/he";

export { t } from "@/lib/content/interpolate";
export { heContent } from "@/lib/content/he";
export type { HeContent } from "@/lib/content/he";
export type { GlossaryEntry, GlossaryTerm } from "@/lib/content/glossary.types";

/** Active UI copy — extend with `enContent` when adding English locale. */
export const content = heContent;