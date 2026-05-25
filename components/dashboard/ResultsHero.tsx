"use client";

import { CountUpValue } from "@/components/motion/CountUpValue";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const res = heContent.inputs.results;

const STATS = [
  { key: "flour" as const, label: res.flour },
  { key: "water" as const, label: res.water },
  { key: "starter" as const, label: res.starter },
  { key: "salt" as const, label: res.salt },
];

export function ResultsHero({ form }: { form: RecipeForm }) {
  const { results, showResults } = form;

  if (!showResults || !results) return null;

  const values = {
    flour: results.flour,
    water: results.water,
    starter: results.starter,
    salt: results.salt,
  };

  return (
    <section
      id="recipe-results"
      aria-live="polite"
      className={cn(
        "results-hero-enter min-h-[min(70vh,32rem)] w-full lg:min-h-[min(72vh,40rem)]",
      )}
    >
      <div className="grid grid-cols-2 gap-6 p-4 sm:gap-8 sm:p-6 md:gap-10 lg:gap-12 lg:p-8">
        {STATS.map((item) => (
          <div
            key={item.key}
            className="flex flex-col justify-end border-b border-border-subtle pb-4 sm:pb-6"
          >
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
              {item.label}
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <CountUpValue
                value={values[item.key]}
                className="font-serif text-5xl font-light text-text-primary sm:text-6xl md:text-7xl lg:text-8xl xl:text-[9rem] xl:leading-none"
              />
              <span className="text-lg font-light text-text-secondary sm:text-xl">
                ג
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
