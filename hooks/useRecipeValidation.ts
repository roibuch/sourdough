"use client";

import { useMemo } from "react";
import {
  validateRecipeForm,
  type RecipeValidation,
} from "@/lib/validation/recipeValidation";
import type { FlourMix } from "@/lib/types";

export function useRecipeValidation(params: {
  totalWeight: string;
  waterPct: number;
  starterPct: number;
  saltPct: number;
  mix: FlourMix;
}): RecipeValidation {
  return useMemo(
    () => validateRecipeForm(params),
    [
      params.totalWeight,
      params.waterPct,
      params.starterPct,
      params.saltPct,
      params.mix.totalPct,
    ],
  );
}
