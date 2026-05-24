"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateDough } from "@/lib/bakingMath";
import {
  FLOUR_FIELDS,
  FLOUR_PRESETS,
  PRESET_OPTIONS,
  buildFlourMix,
} from "@/lib/flour";
import { STORAGE_KEY } from "@/lib/recipeState.types";
import {
  buildTimelineInputWithPace,
  type FermentationPace,
  type StarterRatioPreset,
} from "@/lib/expressMode";
import {
  findScheduleOptionByTarget,
  generateScheduleOptions,
} from "@/lib/scheduleOptions";
import { buildReverseTimeline, defaultTargetBakeLocal } from "@/lib/timeline";
import { normalizeFlourPercentages } from "@/lib/schemas/recipeParamsSchema";
import type { ScheduleOption } from "@/lib/scheduleOptions";
import type { BakingWeatherPlan } from "@/lib/weatherPlan";
import type { DoughResult, PresetKey, TimelinePlan } from "@/lib/types";
import { useRecipeParams } from "@/hooks/useRecipeParams";
import { recipeStateToUrlRecord } from "@/lib/urlRecipeCodec";
import { saveRecipeStateToStorage } from "@/lib/recipeState";

export function useRecipeForm() {
  const {
    state,
    isReady,
    patchState,
    setState,
    flourAdjusted,
  } = useRecipeParams();

  const [presetNote, setPresetNote] = useState(FLOUR_PRESETS.classic.note);
  const [showGuide, setShowGuide] = useState(false);
  const [starterOnlyMode, setStarterOnlyMode] = useState(false);
  const [bulkHoursOverride, setBulkHoursOverride] = useState<number | null>(
    null,
  );
  const [results, setResults] = useState<DoughResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timelinePlan, setTimelinePlan] = useState<TimelinePlan | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const initDone = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flourPcts = state.flourBlend.percentages;
  const preset = state.flourBlend.preset;
  const totalWeight =
    state.totalWeightG != null ? String(state.totalWeightG) : "";
  const waterPct = state.waterPercent;
  const starterPct = state.starterPercent;
  const saltPct = state.saltPercent;
  const targetBakeTime = state.schedule.targetBakeTime;
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

  const mix = useMemo(() => buildFlourMix(flourPcts), [flourPcts]);

  const timelineInput = useMemo(() => {
    const base = {
      targetBakeTime,
      coldRetardHours,
      starterPct,
      waterPct,
      roomTemp,
      hoursToAutolyse,
      flourPcts,
      fermentationPace,
      ...(bulkHoursOverride != null ? { bulkHours: bulkHoursOverride } : {}),
      starterPeakHours: hoursToAutolyse,
    };
    return buildTimelineInputWithPace(base);
  }, [
    targetBakeTime,
    coldRetardHours,
    starterPct,
    waterPct,
    roomTemp,
    hoursToAutolyse,
    flourPcts,
    bulkHoursOverride,
    fermentationPace,
  ]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const persistState = useCallback(
    (calculated?: boolean) => {
      if (!isReady) return;
      const next = {
        ...state,
        calculated: calculated ?? showResults,
      };
      saveRecipeStateToStorage(recipeStateToUrlRecord(next));
    },
    [isReady, state, showResults],
  );

  const schedulePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => persistState(), 350);
  }, [persistState]);

  const setTotalWeight = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const n = parseFloat(trimmed.replace(",", "."));
      patchState({
        totalWeightG:
          trimmed === ""
            ? null
            : Number.isFinite(n) && n > 0
              ? n
              : null,
      });
    },
    [patchState],
  );

  const setWaterPct = useCallback(
    (v: number) => patchState({ waterPercent: v }),
    [patchState],
  );
  const setStarterPct = useCallback(
    (v: number) => patchState({ starterPercent: v }),
    [patchState],
  );
  const setSaltPct = useCallback(
    (v: number) => patchState({ saltPercent: v }),
    [patchState],
  );

  const setFlourPcts = useCallback(
    (updater: number[] | ((prev: number[]) => number[])) => {
      const next =
        typeof updater === "function" ? updater(flourPcts) : updater;
      const normalized = normalizeFlourPercentages(next);
      patchState({
        flourBlend: {
          preset: "custom",
          percentages: normalized,
          totalPercent: normalized.reduce((s, p) => s + p, 0),
        },
      });
    },
    [flourPcts, patchState],
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

  const setTargetBakeTime = useCallback(
    (v: string) => patchState({ schedule: { targetBakeTime: v } }),
    [patchState],
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
        setPresetNote("עריכה ידנית: ודא/י שהאחוזים מסתכמים ל־100%.");
        patchState({ flourBlend: { ...state.flourBlend, preset: "custom" } });
        return;
      }
      const p = FLOUR_PRESETS[key];
      if (!p) return;
      const percentages = [...p.values];
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

  const rebuildTimeline = useCallback(
    (silent: boolean) => {
      const plan = buildReverseTimeline(timelineInput);
      if (!plan) {
        if (!silent) {
          if (!targetBakeTime) showToast("בחר/י זמן יעד לאפייה.");
          else showToast("תאריך/שעה לא תקינים.");
        }
        return null;
      }
      setTimelinePlan(plan);
      setShowTimeline(true);
      return plan;
    },
    [timelineInput, targetBakeTime, showToast],
  );

  useEffect(() => {
    if (!isReady || initDone.current) return;
    initDone.current = true;

    if (flourAdjusted) {
      showToast("תערובת הקמחים עודכנה לסכום 100%.");
    }

    const fp = state.flourBlend.preset;
    if (
      fp &&
      fp !== "custom" &&
      FLOUR_PRESETS[fp as Exclude<PresetKey, "custom">]
    ) {
      setPresetNote(FLOUR_PRESETS[fp as Exclude<PresetKey, "custom">].note);
    }

    if (!state.schedule.targetBakeTime) {
      patchState({ schedule: { targetBakeTime: defaultTargetBakeLocal() } });
    }

    if (state.calculated && state.totalWeightG) {
      const w = state.totalWeightG;
      if (w > 0 && Math.abs(state.flourBlend.totalPercent - 100) < 0.2) {
        setResults(
          calculateDough(w, state.waterPercent, state.starterPercent, state.saltPercent),
        );
        setShowResults(true);
      }
    }

    if (state.schedule.targetBakeTime) {
      const plan = buildReverseTimeline({
        targetBakeTime: state.schedule.targetBakeTime,
        coldRetardHours: state.schedule.coldRetardHours,
        starterPct: state.starterPercent,
        waterPct: state.waterPercent,
        roomTemp: state.schedule.roomTempC,
        hoursToAutolyse: state.schedule.hoursToAutolyse,
        flourPcts: state.flourBlend.percentages,
        fermentationPace: state.schedule.fermentationPace,
      });
      if (plan) {
        setTimelinePlan(plan);
        setShowTimeline(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;
    schedulePersist();
  }, [state, isReady, schedulePersist]);

  useEffect(() => {
    if (!showTimeline || !targetBakeTime) return;
    const plan = buildReverseTimeline(timelineInput);
    if (plan) setTimelinePlan(plan);
  }, [timelineInput, showTimeline, targetBakeTime]);

  const handleCalculate = useCallback(() => {
    const w = state.totalWeightG;
    if (!w || w <= 0) {
      showToast("הזן/י משקל בצק תקין.");
      return;
    }
    if (Math.abs(mix.totalPct - 100) > 0.1) {
      showToast(`אחוזי הקמחים צריכים להסתכם ל־100%. כרגע: ${mix.totalPct}%.`);
      return;
    }
    const dough = calculateDough(
      w,
      state.waterPercent,
      state.starterPercent,
      state.saltPercent,
    );
    setResults(dough);
    setShowResults(true);
    setShowGuide(true);
    setStarterOnlyMode(false);
    setState({ ...state, calculated: true });

    if (targetBakeTime) {
      const plan = rebuildTimeline(true);
      if (plan) {
        requestAnimationFrame(() => {
          document.getElementById("section-schedule")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
        return;
      }
    }

    requestAnimationFrame(() => {
      document.getElementById("section-guide")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [
    state,
    mix.totalPct,
    targetBakeTime,
    showToast,
    setState,
    rebuildTimeline,
  ]);

  const handleBuildTimeline = useCallback(() => {
    const plan = rebuildTimeline(false);
    if (plan) {
      setState({ ...state, calculated: showResults });
      setTimeout(() => {
        document.getElementById("section-schedule")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  }, [rebuildTimeline, setState, state, showResults]);

  const handleCopyLink = useCallback(async () => {
    setState({ ...state, calculated: showResults });
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("הקישור הועתק — אפשר לשתף את המתכון.");
    } catch {
      showToast(url);
    }
  }, [setState, state, showResults, showToast]);

  const selectScheduleOption = useCallback(
    (option: ScheduleOption) => {
      if (!option.feasible) {
        showToast(option.infeasibleReason ?? "המועד לא זמין.");
        return;
      }
      setTargetBakeTime(option.targetBakeTime);
      setColdRetardHours(option.coldRetardHours);
      setFermentationPace(option.isExpress ? "express" : "standard");
      if (option.isExpress) {
        setStarterRatioPreset("equal");
      }
      setTimelinePlan(option.plan);
      setShowTimeline(true);
      setState({ ...state, calculated: showResults });
    },
    [
      setTargetBakeTime,
      setColdRetardHours,
      setFermentationPace,
      setStarterRatioPreset,
      setState,
      state,
      showResults,
      showToast,
    ],
  );

  const applyWeatherPlan = useCallback(
    (plan: BakingWeatherPlan) => {
      setStarterPct(plan.starterPct);
      setRoomTemp(plan.roomTemp);
      setHoursToAutolyse(plan.hoursToAutolyse);
      setBulkHoursOverride(plan.bulkHours);
      setState({ ...state, calculated: showResults });

      if (targetBakeTime) {
        const nextInput = {
          ...timelineInput,
          starterPct: plan.starterPct,
          roomTemp: plan.roomTemp,
          hoursToAutolyse: plan.hoursToAutolyse,
          bulkHours: plan.bulkHours,
          starterPeakHours: plan.hoursToAutolyse,
        };
        const options = generateScheduleOptions(nextInput);
        const match = findScheduleOptionByTarget(options, targetBakeTime);
        const rebuilt = match?.plan ?? buildReverseTimeline(nextInput);
        if (rebuilt) {
          setTimelinePlan(rebuilt);
          setShowTimeline(true);
        }
      }
    },
    [
      setStarterPct,
      setRoomTemp,
      setHoursToAutolyse,
      setState,
      state,
      showResults,
      targetBakeTime,
      timelineInput,
    ],
  );

  const openStarterOnlyGuide = useCallback(() => {
    setShowGuide(true);
    setStarterOnlyMode(true);
    setTimeout(() => {
      document.getElementById("section-guide")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, []);

  const handleClearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const path = window.location.pathname;
    window.history.replaceState(null, "", path);
    showToast("השמירה המקומית אופסה.");
  }, [showToast]);

  return {
    totalWeight,
    setTotalWeight,
    waterPct,
    setWaterPct,
    starterPct,
    setStarterPct,
    saltPct,
    setSaltPct,
    preset,
    setPreset,
    flourPcts,
    setFlourPcts,
    presetNote,
    setPresetNote,
    targetBakeTime,
    setTargetBakeTime,
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
    selectScheduleOption,
    timelineInput,
    fermentationPace,
    setFermentationPace,
    starterRatioPreset,
    setStarterRatioPreset,
    results,
    showResults,
    timelinePlan,
    showTimeline,
    mix,
    toast,
    showToast,
    applyPreset,
    schedulePersist,
    persistState,
    handleCalculate,
    handleBuildTimeline,
    handleCopyLink,
    handleClearStorage,
    rebuildTimeline,
    recipeParams: state,
    isParamsReady: isReady,
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
