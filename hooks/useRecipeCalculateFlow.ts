"use client";

import { useCallback, useState } from "react";
import { useRecipeValidation } from "@/hooks/useRecipeValidation";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { VALIDATION_BLOCKED_MESSAGE } from "@/lib/validation/recipeValidation";

export type RecipeCalculateFlow = ReturnType<typeof useRecipeCalculateFlow>;

/** Shared validate → balance dialog → calculate (inputs panel + sticky CTA). */
export function useRecipeCalculateFlow(form: RecipeForm) {
  const {
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    mix,
    flourDraft,
    commitTotalWeight,
    commitFlourPcts,
    needsFlourBalance,
    runCalculate,
    showToast,
  } = form;

  const validation = useRecipeValidation({
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    mix,
  });

  const [balanceOpen, setBalanceOpen] = useState(false);

  const requestCalculate = useCallback(() => {
    if (!validation.canCalculate) {
      const first =
        validation.fields.totalWeight?.message ??
        validation.fields.waterPct?.message;
      showToast(first ?? VALIDATION_BLOCKED_MESSAGE);
      return;
    }
    commitTotalWeight();
    commitFlourPcts(flourDraft);
    if (needsFlourBalance(flourDraft)) {
      setBalanceOpen(true);
      return;
    }
    runCalculate();
  }, [
    validation,
    commitTotalWeight,
    commitFlourPcts,
    flourDraft,
    needsFlourBalance,
    runCalculate,
    showToast,
  ]);

  const onBalanceConfirm = useCallback(
    (balanced: number[]) => {
      commitFlourPcts(balanced);
      setBalanceOpen(false);
      runCalculate();
    },
    [commitFlourPcts, runCalculate],
  );

  return {
    validation,
    balanceOpen,
    setBalanceOpen,
    requestCalculate,
    onBalanceConfirm,
    balancePcts: flourDraft,
  };
}
