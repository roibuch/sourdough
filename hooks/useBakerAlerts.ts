"use client";

import { useMemo } from "react";
import { collectBakerAlerts } from "@/lib/bakerAlerts";
import type { RecipeForm } from "@/hooks/useRecipeForm";

export function useBakerAlerts(form: RecipeForm) {
  return useMemo(
    () =>
      collectBakerAlerts({
        mix: form.mix,
        waterPercent: form.waterPct,
        trueHydrationPercent: form.results?.trueHydration ?? null,
      }),
    [form.mix, form.waterPct, form.results?.trueHydration],
  );
}
