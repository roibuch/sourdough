import { computeSourdoughMath } from "@/lib/sourdoughMath";
import type { DoughResult } from "@/lib/types";

export interface RecipeMetrics {
  totalGrams: number | null;
  hydrationPercent: number | null;
  /** True when from last calculate; false when live estimate */
  isCalculated: boolean;
  label: string;
}

export function computeRecipeMetrics(params: {
  totalWeightG: number | null;
  waterPercent: number;
  starterPercent: number;
  saltPercent: number;
  flourTotalPercent: number;
  results: DoughResult | null;
  showResults: boolean;
}): RecipeMetrics {
  const {
    totalWeightG,
    waterPercent,
    starterPercent,
    saltPercent,
    flourTotalPercent,
    results,
    showResults,
  } = params;

  if (showResults && results) {
    const totalGrams =
      results.flour + results.water + results.starter + results.salt;
    return {
      totalGrams,
      hydrationPercent: results.trueHydration,
      isCalculated: true,
      label: "מחושב",
    };
  }

  if (
    totalWeightG &&
    totalWeightG > 0 &&
    Math.abs(flourTotalPercent - 100) <= 0.15
  ) {
    const est = computeSourdoughMath({
      targetWeightG: totalWeightG,
      waterPercent,
      starterPercent,
      saltPercent,
      starterHydrationPercent: 100,
    });
    if (est) {
      return {
        totalGrams: est.totalDoughG,
        hydrationPercent: est.trueHydrationPercent,
        isCalculated: false,
        label: "הערכה חיה",
      };
    }
  }

  return {
    totalGrams: totalWeightG && totalWeightG > 0 ? totalWeightG : null,
    hydrationPercent:
      totalWeightG && totalWeightG > 0 ? waterPercent : null,
    isCalculated: false,
    label: "הערכה",
  };
}
