"use client";

import { useCallback, useMemo, useState } from "react";
import { useRecipeValidation } from "@/hooks/useRecipeValidation";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { buildFlourMix } from "@/lib/flour";
import { VALIDATION_BLOCKED_MESSAGE } from "@/lib/validation/recipeValidation";

export type RecipeCalculateFlow = ReturnType<typeof useRecipeCalculateFlow>;

/** Shared validate → balance dialog → calculate (inputs panel + sticky CTA). */
export function useRecipeCalculateFlow(form: RecipeForm) {
  const {
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    flourDraft,
    commitTotalWeight,
    commitFlourPcts,
    runCalculate,
    showToast,
  } = form;

  const draftMix = useMemo(() => buildFlourMix(flourDraft), [flourDraft]);

  const validation = useRecipeValidation({
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    mix: draftMix,
  });

  const [balanceOpen, setBalanceOpen] = useState(false);

  const requestCalculate = useCallback(() => {
    if (!validation.canCalculate) {
      const flourMsg = validation.fields.flourTotal?.message;
      const first =
        validation.fields.totalWeight?.message ??
        validation.fields.waterPct?.message ??
        flourMsg;
      showToast(first ?? VALIDATION_BLOCKED_MESSAGE);
      return;
    }
    commitTotalWeight();
    commitFlourPcts(flourDraft);
    runCalculate();
  }, [
    validation,
    commitTotalWeight,
    commitFlourPcts,
    flourDraft,
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
