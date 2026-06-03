"use client";

import { useMemo } from "react";
import { AppBrandHeader } from "@/components/brand/AppBrandHeader";
import { computeRecipeMetrics } from "@/lib/recipeMetrics";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

interface MobileAppHeaderProps {
  form: RecipeForm;
  className?: string;
}

/** Single mobile top chrome — logo + compact metrics (no overlapping sticky bars). */
export function MobileAppHeader({ form, className }: MobileAppHeaderProps) {
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
    <header
      className={cn(
        "sticky top-0 z-30 shrink-0 border-b border-border-subtle bg-surface/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex h-12 items-center px-4">
        <AppBrandHeader logoSize={32} />
      </div>
      <div
        className="flex items-center justify-between gap-2 border-t border-border-subtle/80 px-4 py-1.5"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs">
          <span className="truncate text-text-muted">משקל</span>
          <span className="font-semibold tabular-nums text-text-primary">
            {metrics.totalGrams != null
              ? `${Math.round(metrics.totalGrams)} ג`
              : "—"}
          </span>
          <span className="text-border-subtle" aria-hidden>
            ·
          </span>
          <span className="truncate text-text-muted">נוזלים</span>
          <span className="font-semibold tabular-nums text-accent">
            {metrics.hydrationPercent != null
              ? `${metrics.hydrationPercent}%`
              : "—"}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
            metrics.isCalculated
              ? "bg-accent-muted text-accent"
              : "bg-stone-100 text-text-muted",
          )}
        >
          {metrics.label}
        </span>
      </div>
    </header>
  );
}
