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
      className={cn("results-hero-enter w-full")}
    >
      <p className="mb-4 text-sm font-medium text-text-secondary lg:mb-6">
        המתכון שלכם
      </p>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {STATS.map((item) => (
          <div
            key={item.key}
            className="app-card flex flex-col justify-center px-4 py-5 sm:px-6 sm:py-7"
          >
            <span className="text-sm font-medium text-text-muted">
              {item.label}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <CountUpValue
                value={values[item.key]}
                className="font-serif text-4xl font-medium text-accent sm:text-5xl lg:text-6xl xl:text-7xl"
              />
              <span className="text-base text-text-muted">ג</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
