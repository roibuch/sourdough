"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateDoughMasses } from "@/lib/bakingMath";
import { RECIPE_DEFAULTS } from "@/lib/constants/recipeDefaults";
import {
  computeSourdoughMath,
  doughResultToSourdoughValues,
  type SourdoughMathInputs,
  type SourdoughMathValues,
} from "@/lib/sourdoughMath";
import type { DoughResult } from "@/lib/types";

export type { SourdoughMathInputs, SourdoughMathValues };
export { computeSourdoughMath } from "@/lib/sourdoughMath";

export interface UseSourdoughMathOptions {
  /** Committed target dough weight from URL / parent state */
  targetWeightG?: number | null;
  waterPercent?: number;
  starterPercent?: number;
  saltPercent?: number;
  starterHydrationPercent?: number;
  /** Persist committed inputs to parent (e.g. recipe URL state) */
  onCommitInputs?: (patch: Partial<SourdoughMathInputs>) => void;
}

export function useSourdoughMath(options: UseSourdoughMathOptions = {}) {
  const {
    targetWeightG: externalTargetWeightG = null,
    waterPercent: externalWater = RECIPE_DEFAULTS.waterPercent,
    starterPercent: externalStarter = RECIPE_DEFAULTS.starterPercent,
    saltPercent: externalSalt = RECIPE_DEFAULTS.saltPercent,
    starterHydrationPercent: externalStarterHydration = 100,
    onCommitInputs,
  } = options;

  const [targetWeightDraft, setTargetWeightDraft] = useState(() =>
    externalTargetWeightG != null ? String(externalTargetWeightG) : "",
  );
  const committedWeightRef = useRef(
    externalTargetWeightG != null ? String(externalTargetWeightG) : "",
  );

  const [results, setResults] = useState<DoughResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const s =
      externalTargetWeightG != null ? String(externalTargetWeightG) : "";
    if (s === committedWeightRef.current) return;
    committedWeightRef.current = s;
    setTargetWeightDraft(s);
  }, [externalTargetWeightG]);

  const committedTargetWeightG = useMemo((): number | null => {
    const trimmed = targetWeightDraft.trim().replace(",", ".");
    if (trimmed === "") return externalTargetWeightG;
    const n = parseFloat(trimmed);
    return Number.isFinite(n) && n > 0 ? n : externalTargetWeightG;
  }, [targetWeightDraft, externalTargetWeightG]);

  const inputs: SourdoughMathInputs = useMemo(
    () => ({
      targetWeightG: externalTargetWeightG ?? committedTargetWeightG,
      waterPercent: externalWater,
      starterPercent: externalStarter,
      saltPercent: externalSalt,
      starterHydrationPercent: externalStarterHydration,
    }),
    [
      externalTargetWeightG,
      committedTargetWeightG,
      externalWater,
      externalStarter,
      externalSalt,
      externalStarterHydration,
    ],
  );

  const preview = useMemo(() => computeSourdoughMath(inputs), [inputs]);

  const values = useMemo((): SourdoughMathValues | null => {
    if (showResults && results) {
      return doughResultToSourdoughValues(
        results,
        {
          water: inputs.waterPercent,
          starter: inputs.starterPercent,
          salt: inputs.saltPercent,
        },
        inputs.starterHydrationPercent,
      );
    }
    return preview;
  }, [showResults, results, inputs, preview]);

  const setTargetWeight = useCallback((value: string) => {
    setTargetWeightDraft(value);
  }, []);

  const commitTargetWeight = useCallback((): number | null => {
    const trimmed = targetWeightDraft.trim().replace(",", ".");
    const n = parseFloat(trimmed);
    const next =
      trimmed === ""
        ? ""
        : Number.isFinite(n) && n > 0
          ? String(n)
          : "";
    setTargetWeightDraft(next);
    committedWeightRef.current = next;
    const committed = next === "" ? null : n;
    onCommitInputs?.({ targetWeightG: committed });
    return committed;
  }, [targetWeightDraft, onCommitInputs]);

  const setWaterPercent = useCallback(
    (value: number) => {
      onCommitInputs?.({ waterPercent: value });
    },
    [onCommitInputs],
  );

  const setStarterPercent = useCallback(
    (value: number) => {
      onCommitInputs?.({ starterPercent: value });
    },
    [onCommitInputs],
  );

  const setSaltPercent = useCallback(
    (value: number) => {
      onCommitInputs?.({ saltPercent: value });
    },
    [onCommitInputs],
  );

  const setStarterHydrationPercent = useCallback(
    (value: number) => {
      onCommitInputs?.({ starterHydrationPercent: value });
    },
    [onCommitInputs],
  );

  const calculate = useCallback((): DoughResult | null => {
    const w = commitTargetWeight() ?? inputs.targetWeightG;
    if (w == null || !Number.isFinite(w) || w <= 0) return null;

    const { waterPercent, starterPercent, saltPercent } = inputs;
    if (
      !Number.isFinite(waterPercent) ||
      !Number.isFinite(starterPercent) ||
      !Number.isFinite(saltPercent) ||
      waterPercent < 0 ||
      starterPercent < 0 ||
      saltPercent < 0
    ) {
      return null;
    }

    const dough = calculateDoughMasses({
      targetDoughWeightG: w,
      percentages: {
        water: waterPercent,
        starter: starterPercent,
        salt: saltPercent,
      },
      starterHydrationPct: inputs.starterHydrationPercent,
    });

    setResults(dough);
    setShowResults(true);
    onCommitInputs?.({ targetWeightG: w });
    return dough;
  }, [commitTargetWeight, inputs, onCommitInputs]);

  const clearResults = useCallback(() => {
    setResults(null);
    setShowResults(false);
  }, []);

  const restoreResults = useCallback((dough: DoughResult, targetG: number) => {
    setResults(dough);
    setShowResults(true);
    const s = String(targetG);
    setTargetWeightDraft(s);
    committedWeightRef.current = s;
  }, []);

  return {
    inputs,
    targetWeight: targetWeightDraft,
    waterPercent: inputs.waterPercent,
    starterPercent: inputs.starterPercent,
    saltPercent: inputs.saltPercent,
    starterHydrationPercent: inputs.starterHydrationPercent,
    setTargetWeight,
    commitTargetWeight,
    setWaterPercent,
    setStarterPercent,
    setSaltPercent,
    setStarterHydrationPercent,
    preview,
    values,
    results,
    showResults,
    trueHydrationPercent: values?.trueHydrationPercent ?? null,
    bakersWaterPercent: values?.bakersWaterPercent ?? inputs.waterPercent,
    calculate,
    clearResults,
    restoreResults,
    canCalculate:
      (inputs.targetWeightG ?? 0) > 0 ||
      (parseFloat(targetWeightDraft.replace(",", ".")) > 0 &&
        Number.isFinite(parseFloat(targetWeightDraft.replace(",", ".")))),
  };
}
