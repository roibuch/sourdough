"use client";

import { useMemo } from "react";
import { BeakerIcon, ScaleIcon } from "@heroicons/react/24/outline";
import { MorphingValue } from "@/components/motion/MorphingValue";
import { computeRecipeMetrics } from "@/lib/recipeMetrics";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

export function StickyMetricsBar({ form }: { form: RecipeForm }) {
  const {
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    mix,
    results,
    showResults,
  } = form;

  const metrics = useMemo(
    () =>
      computeRecipeMetrics({
        totalWeightG: parseFloat(totalWeight) || null,
        waterPercent: waterPct,
        starterPercent: starterPct,
        saltPercent: saltPct,
        flourTotalPercent: mix.totalPct,
        results,
        showResults,
      }),
    [
      totalWeight,
      waterPct,
      starterPct,
      saltPct,
      mix.totalPct,
      results,
      showResults,
    ],
  );

  return (
    <div
      className={cn(
        "sticky top-14 z-20 border-b border-warm-border/60",
        "bg-dough/80 px-4 py-2.5 backdrop-blur-xl sm:top-16 sm:px-6",
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <MetricPill
            icon={<ScaleIcon className="h-4 w-4" />}
            label="משקל בצק"
            value={
              metrics.totalGrams != null
                ? `${Math.round(metrics.totalGrams)} גרם`
                : "—"
            }
          />
          <MetricPill
            icon={<BeakerIcon className="h-4 w-4" />}
            label="הידרציה"
            value={
              metrics.hydrationPercent != null
                ? `${metrics.hydrationPercent}%`
                : "—"
            }
            highlight
          />
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            metrics.isCalculated
              ? "bg-wheat-muted text-crust ring-1 ring-wheat/50"
              : "bg-wheat/30 text-crust-dark",
          )}
        >
          {metrics.label}
        </span>
      </div>
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm backdrop-blur-md",
        highlight
          ? "border-wheat/70 bg-wheat-muted/90 shadow-[0_0_10px_rgb(212_165_116_/_0.25)]"
          : "border-warm-border/80 bg-white/80",
      )}
    >
      <span className="text-crust" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-medium text-charcoal-muted">{label}</span>
      <MorphingValue
        value={value}
        className={cn(
          "font-serif text-sm font-semibold",
          highlight ? "text-crust" : "text-charcoal",
        )}
      />
    </div>
  );
}
