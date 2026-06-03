"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateDoughMasses } from "@/lib/bakingMath";
import { useSourdoughMath } from "@/hooks/useSourdoughMath";
import {
  FLOUR_FIELDS,
  FLOUR_PRESETS,
  PRESET_OPTIONS,
  buildFlourMix,
} from "@/lib/flour";
import { createDefaultRecipeState } from "@/lib/constants/recipeDefaults";
import { STORAGE_KEY } from "@/lib/recipeState.types";
import {
  type FermentationPace,
  type StarterRatioPreset,
} from "@/lib/expressMode";
import { heContent } from "@/lib/content";
import { sumFlourPcts } from "@/lib/flourBalance";
import { normalizeFlourPercentages } from "@/lib/schemas/recipeParamsSchema";
import { CUSTOM_FLOUR_NOTE } from "@/lib/validation/recipeValidation";

const toasts = heContent.toasts;

import type { BakingWeatherPlan } from "@/lib/weatherPlan";
import type { PresetKey } from "@/lib/types";
import { useRecipeParams } from "@/hooks/useRecipeParams";
import { recipeStateToUrlRecord } from "@/lib/urlRecipeCodec";
import { saveRecipeStateToStorage } from "@/lib/recipeState";

export function useRecipeForm() {
  const {
    state,
    hydrated,
    flourAdjusted: paramsFlourAdjusted,
    patchState,
    setState,
    commitStateToUrl,
    resetToCleanDefaults,
  } = useRecipeParams();

  const [presetNote, setPresetNote] = useState(FLOUR_PRESETS.classic.note);
  const [showGuide, setShowGuide] = useState(false);
  const [starterOnlyMode, setStarterOnlyMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [flourDraft, setFlourDraft] = useState<number[]>(() => [
    ...state.flourBlend.percentages,
  ]);
  const initDone = useRef(false);

  const math = useSourdoughMath({
    targetWeightG: state.totalWeightG,
    waterPercent: state.waterPercent,
    starterPercent: state.starterPercent,
    saltPercent: state.saltPercent,
    onCommitInputs: (patch) => {
      patchState({
        ...(patch.targetWeightG !== undefined && {
          totalWeightG: patch.targetWeightG,
        }),
        ...(patch.waterPercent !== undefined && {
          waterPercent: patch.waterPercent,
        }),
        ...(patch.starterPercent !== undefined && {
          starterPercent: patch.starterPercent,
        }),
        ...(patch.saltPercent !== undefined && {
          saltPercent: patch.saltPercent,
        }),
      });
    },
  });

  const { results, showResults } = math;
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flourPcts = state.flourBlend.percentages;
  const committedFlourKeyRef = useRef(flourPcts.join(","));

  /** Sync draft only when committed flour changed (preset / URL), not while typing */
  useEffect(() => {
    const key = flourPcts.join(",");
    if (key === committedFlourKeyRef.current) return;
    committedFlourKeyRef.current = key;
    setFlourDraft([...flourPcts]);
  }, [flourPcts]);
  const preset = state.flourBlend.preset;
  const totalWeight = math.targetWeight;
  const waterPct = math.waterPercent;
  const starterPct = math.starterPercent;
  const saltPct = math.saltPercent;
  const coldRetardHours = state.schedule.coldRetardHours;
  const hoursToAutolyse = state.schedule.hoursToAutolyse;
  const roomTemp = state.schedule.roomTempC;
  const keepInJarG = state.starter.keepInJarG;
  const useRecipeStarter = state.starter.useFromRecipe;
  const manualStarterG =
    state.starter.manualGrams != null
      ? String(state.starter.manualGrams)
      : "";
  const fermentationPace = state.schedule.fermentationPace;
  const starterRatioPreset = state.starter.ratioPreset;

  const mix = useMemo(() => buildFlourMix(flourDraft), [flourDraft]);
  const committedMix = useMemo(() => buildFlourMix(flourPcts), [flourPcts]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const persistState = useCallback(
    (calculated?: boolean) => {
      const next = {
        ...state,
        calculated: calculated ?? showResults,
      };
      saveRecipeStateToStorage(recipeStateToUrlRecord(next));
    },
    [state, showResults],
  );

  const schedulePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => persistState(), 350);
  }, [persistState]);

  const setWeightDraftValue = math.setTargetWeight;
  const commitTotalWeight = math.commitTargetWeight;
  const setWaterPct = math.setWaterPercent;
  const setStarterPct = math.setStarterPercent;
  const setSaltPct = math.setSaltPercent;

  const setFlourDraftPct = useCallback((index: number, value: number) => {
    setFlourDraft((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const setFlourDraftFromPreset = useCallback((pcts: number[]) => {
    setFlourDraft([...pcts]);
  }, []);

  const commitFlourPcts = useCallback(
    (pcts: number[]) => {
      const clean = pcts.map((p) => {
        const n = Number(p);
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
      });
      const total = Math.round(clean.reduce((s, p) => s + p, 0) * 10) / 10;
      setFlourDraft(clean);
      committedFlourKeyRef.current = clean.join(",");
      patchState({
        flourBlend: {
          preset: "custom",
          percentages: clean,
          totalPercent: total,
        },
      });
      setPresetNote(
        Math.abs(total - 100) <= 0.1
          ? CUSTOM_FLOUR_NOTE(100)
          : CUSTOM_FLOUR_NOTE(total),
      );
    },
    [patchState, setPresetNote],
  );

  const setFlourPcts = useCallback(
    (updater: number[] | ((prev: number[]) => number[])) => {
      const next =
        typeof updater === "function" ? updater(flourDraft) : updater;
      setFlourDraft(next);
    },
    [flourDraft],
  );

  const setPreset = useCallback(
    (key: PresetKey) => {
      patchState({
        flourBlend: {
          ...state.flourBlend,
          preset: key,
        },
      });
    },
    [patchState, state.flourBlend],
  );

  const setColdRetardHours = useCallback(
    (v: number) => patchState({ schedule: { coldRetardHours: v } }),
    [patchState],
  );
  const setHoursToAutolyse = useCallback(
    (v: number) => patchState({ schedule: { hoursToAutolyse: v } }),
    [patchState],
  );
  const setRoomTemp = useCallback(
    (v: number) => patchState({ schedule: { roomTempC: v } }),
    [patchState],
  );
  const setKeepInJarG = useCallback(
    (v: number) => patchState({ starter: { keepInJarG: v } }),
    [patchState],
  );
  const setUseRecipeStarter = useCallback(
    (v: boolean) => patchState({ starter: { useFromRecipe: v } }),
    [patchState],
  );
  const setManualStarterG = useCallback(
    (v: string) => {
      const n = parseFloat(v);
      patchState({
        starter: {
          manualGrams: v.trim() === "" ? null : Number.isFinite(n) ? n : null,
        },
      });
    },
    [patchState],
  );
  const setFermentationPace = useCallback(
    (v: FermentationPace) =>
      patchState({ schedule: { fermentationPace: v } }),
    [patchState],
  );
  const setStarterRatioPreset = useCallback(
    (v: StarterRatioPreset) => patchState({ starter: { ratioPreset: v } }),
    [patchState],
  );

  const applyPreset = useCallback(
    (key: PresetKey) => {
      if (key === "custom") {
        setPresetNote("עריכה ידנית: ודאו שהאחוזים מסתכמים ל־100%.");
        patchState({ flourBlend: { ...state.flourBlend, preset: "custom" } });
        return;
      }
      const p = FLOUR_PRESETS[key];
      if (!p) return;
      const percentages = [...p.values];
      setFlourDraft(percentages);
      committedFlourKeyRef.current = percentages.join(",");
      patchState({
        flourBlend: {
          preset: key,
          percentages,
          totalPercent: percentages.reduce((s, n) => s + n, 0),
        },
      });
      setPresetNote(p.note);
    },
    [patchState, state.flourBlend],
  );

  useEffect(() => {
    if (!hydrated || initDone.current) return;
    initDone.current = true;

    if (paramsFlourAdjusted) {
      showToast(toasts.flourNormalized);
    }

    const fp = state.flourBlend.preset;
    if (
      fp &&
      fp !== "custom" &&
      FLOUR_PRESETS[fp as Exclude<PresetKey, "custom">]
    ) {
      setPresetNote(FLOUR_PRESETS[fp as Exclude<PresetKey, "custom">].note);
    }

    if (state.calculated && state.totalWeightG) {
      const w = state.totalWeightG;
      if (w > 0 && Math.abs(state.flourBlend.totalPercent - 100) < 0.2) {
        math.restoreResults(
          calculateDoughMasses({
            targetDoughWeightG: w,
            percentages: {
              water: state.waterPercent,
              starter: state.starterPercent,
              salt: state.saltPercent,
            },
          }),
          w,
        );
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const runCalculate = useCallback(() => {
    commitFlourPcts(flourDraft);
    const dough = math.calculate();
    if (!dough) {
      showToast(toasts.invalidDoughWeight);
      return false;
    }
    setShowGuide(true);
    setStarterOnlyMode(false);
    commitStateToUrl((prev) => ({ ...prev, calculated: true }));
    persistState(true);

    requestAnimationFrame(() => {
      document.getElementById("section-guide")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return true;
  }, [
    math,
    showToast,
    commitFlourPcts,
    flourDraft,
    commitStateToUrl,
    persistState,
  ]);

  const handleCalculate = useCallback(() => {
    return runCalculate();
  }, [runCalculate]);

  const needsFlourBalance = useCallback(
    (pcts?: number[]) => Math.abs(sumFlourPcts(pcts ?? flourDraft) - 100) > 0.1,
    [flourDraft],
  );

  const handleCopyLink = useCallback(async () => {
    commitStateToUrl((prev) => ({
      ...prev,
      calculated: showResults,
    }));
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      showToast(url);
    }
  }, [commitStateToUrl, showResults, showToast]);

  const applyWeatherPlan = useCallback(
    (plan: BakingWeatherPlan) => {
      setStarterPct(plan.starterPct);
      setRoomTemp(plan.roomTemp);
      setHoursToAutolyse(plan.hoursToAutolyse);
      setState({ ...state, calculated: showResults });
    },
    [setStarterPct, setRoomTemp, setHoursToAutolyse, setState, state, showResults],
  );

  const openStarterOnlyGuide = useCallback(() => {
    setShowGuide(true);
    setStarterOnlyMode(true);
  }, []);

  const handleClearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const defaults = createDefaultRecipeState();
    resetToCleanDefaults();
    setFlourDraft([...defaults.flourBlend.percentages]);
    committedFlourKeyRef.current = defaults.flourBlend.percentages.join(",");
    math.clearResults();
    setShowGuide(false);
    setStarterOnlyMode(false);
    setPresetNote(FLOUR_PRESETS.classic.note);
    showToast(toasts.storageCleared);
  }, [resetToCleanDefaults, math, showToast]);

  return {
    totalWeight,
    setWeightDraftValue,
    commitTotalWeight,
    waterPct,
    setWaterPct,
    starterPct,
    setStarterPct,
    saltPct,
    setSaltPct,
    preset,
    setPreset,
    flourPcts,
    flourDraft,
    setFlourDraftPct,
    setFlourDraftFromPreset,
    commitFlourPcts,
    setFlourPcts,
    needsFlourBalance,
    runCalculate,
    presetNote,
    setPresetNote,
    coldRetardHours,
    setColdRetardHours,
    hoursToAutolyse,
    setHoursToAutolyse,
    roomTemp,
    setRoomTemp,
    keepInJarG,
    setKeepInJarG,
    useRecipeStarter,
    setUseRecipeStarter,
    manualStarterG,
    setManualStarterG,
    showGuide,
    starterOnlyMode,
    openStarterOnlyGuide,
    applyWeatherPlan,
    fermentationPace,
    setFermentationPace,
    starterRatioPreset,
    setStarterRatioPreset,
    results,
    showResults,
    mix,
    toast,
    showToast,
    applyPreset,
    schedulePersist,
    persistState,
    handleCalculate,
    handleCopyLink,
    handleClearStorage,
    recipeParams: state,
    isParamsReady: hydrated,
    sourdoughMath: math,
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
