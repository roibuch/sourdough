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
        "sticky top-14 z-20 border-b border-border-subtle",
        "bg-surface/90 px-3 py-2 backdrop-blur-xl sm:top-16 sm:px-6 sm:py-2.5",
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3">
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
            label="אחוז נוזלים"
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
              ? "bg-accent-muted text-accent ring-1 ring-accent/20"
              : "bg-stone-100 text-text-secondary",
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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm",
        highlight
          ? "border-accent/30 bg-accent-muted"
          : "border-border-subtle bg-surface",
      )}
    >
      <span className="text-accent" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <MorphingValue
        value={value}
        className={cn(
          "font-serif text-sm font-semibold tabular-nums",
          highlight ? "text-accent" : "text-text-primary",
        )}
      />
    </div>
  );
}
