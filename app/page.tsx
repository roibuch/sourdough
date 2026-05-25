import { RecipeParamsProvider } from "@/components/RecipeParamsProvider";
import { heContent } from "@/lib/content";

/** Static export: pre-render calculator shell at build time (GitHub Pages). */
export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[60] focus:rounded-2xl focus:bg-crust focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-dough"
      >
        {heContent.app.skipToContent}
      </a>
      <RecipeParamsProvider />
    </>
  );
}
