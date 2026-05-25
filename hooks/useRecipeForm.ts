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
import { buildReverseTimeline } from "@/lib/timeline";
import {
  SchedulingEngine,
  type AdaptiveScheduleResult,
  type BlackoutPeriod,
} from "@/lib/scheduling";
import type { SchedulingEngineInput } from "@/lib/scheduling/types";
import { MS_MIN } from "@/lib/scheduling/timeUtils";
import { heContent, t } from "@/lib/content";
import { sumFlourPcts } from "@/lib/flourBalance";
import { normalizeFlourPercentages } from "@/lib/schemas/recipeParamsSchema";
import { CUSTOM_FLOUR_NOTE } from "@/lib/validation/recipeValidation";

const toasts = heContent.toasts;

const BLACKOUTS_STORAGE_KEY = "sourdough-blackouts-v1";

function isValidBlackout(entry: unknown): entry is BlackoutPeriod {
  if (!entry || typeof entry !== "object") return false;
  const b = entry as BlackoutPeriod;
  return (
    typeof b.id === "string" &&
    typeof b.label === "string" &&
    typeof b.startMinutes === "number" &&
    typeof b.endMinutes === "number" &&
    Number.isFinite(b.startMinutes) &&
    Number.isFinite(b.endMinutes)
  );
}

function loadBlackouts(): BlackoutPeriod[] {
  if (typeof window === "undefined") return SchedulingEngine.defaultBlackouts();
  try {
    const raw = localStorage.getItem(BLACKOUTS_STORAGE_KEY);
    if (!raw) return SchedulingEngine.defaultBlackouts();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SchedulingEngine.defaultBlackouts();
    }
    const valid = parsed.filter(isValidBlackout);
    if (valid.length === 0) return SchedulingEngine.defaultBlackouts();
    return valid;
  } catch {
    return SchedulingEngine.defaultBlackouts();
  }
}
import type { ScheduleOption } from "@/lib/scheduleOptions";
import type { BakingWeatherPlan } from "@/lib/weatherPlan";
import type { DoughResult, PresetKey, TimelinePlan } from "@/lib/types";
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
  } = useRecipeParams();

  const [presetNote, setPresetNote] = useState(FLOUR_PRESETS.classic.note);
  const [showGuide, setShowGuide] = useState(false);
  const [starterOnlyMode, setStarterOnlyMode] = useState(false);
  const [bulkHoursOverride, setBulkHoursOverride] = useState<number | null>(
    null,
  );
  const [timelinePlan, setTimelinePlan] = useState<TimelinePlan | null>(null);
  const [adaptiveSchedule, setAdaptiveSchedule] =
    useState<AdaptiveScheduleResult | null>(null);
  const [blackouts, setBlackoutsState] = useState<BlackoutPeriod[]>(loadBlackouts);
  const [showTimeline, setShowTimeline] = useState(false);
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

  const mix = useMemo(() => buildFlourMix(flourDraft), [flourDraft]);
  const committedMix = useMemo(() => buildFlourMix(flourPcts), [flourPcts]);

  const setBlackouts = useCallback((next: BlackoutPeriod[]) => {
    setBlackoutsState(next);
    try {
      localStorage.setItem(BLACKOUTS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

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

  const schedulingEngineInput = useMemo((): SchedulingEngineInput => {
    return {
      ...timelineInput,
      blackouts,
      earliestStartMs: Date.now(),
    };
  }, [timelineInput, blackouts]);

  const applyAdaptiveResult = useCallback((result: AdaptiveScheduleResult) => {
    setAdaptiveSchedule(result);
    setTimelinePlan(result.plan);
    setShowTimeline(true);
    if (Math.abs(result.applied.bulkHoursDelta) > 0.05) {
      setBulkHoursOverride(
        Math.round(result.plan.summary.bulkHours * 10) / 10,
      );
    }
    if (Math.abs(result.applied.bakeShiftMs) > MS_MIN) {
      const bakeEnd = new Date(result.plan.summary.bakeEnd);
      const y = bakeEnd.getFullYear();
      const mo = String(bakeEnd.getMonth() + 1).padStart(2, "0");
      const d = String(bakeEnd.getDate()).padStart(2, "0");
      const h = String(bakeEnd.getHours()).padStart(2, "0");
      const mi = String(bakeEnd.getMinutes()).padStart(2, "0");
      patchState({
        schedule: {
          targetBakeTime: `${y}-${mo}-${d}T${h}:${mi}`,
        },
      });
    }
  }, [patchState]);

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
      commitFlourPcts(next);
    },
    [flourDraft, commitFlourPcts],
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

  const rebuildTimeline = useCallback(
    (silent: boolean) => {
      const result = SchedulingEngine.buildAdaptivePlan(schedulingEngineInput);
      if (!result) {
        if (!silent) {
          if (!targetBakeTime) showToast(toasts.selectBakeTime);
          else showToast(toasts.invalidDateTime);
        }
        return null;
      }
      applyAdaptiveResult(result);
      if (!silent && result.adaptations.length > 0) {
        const first = result.adaptations[0];
        if (first.id !== "unresolved") {
          showToast(first.message);
        }
      }
      return result.plan;
    },
    [
      schedulingEngineInput,
      applyAdaptiveResult,
      targetBakeTime,
      showToast,
    ],
  );

  const applyAdaptiveSchedule = useCallback(
    (next: AdaptiveScheduleResult) => {
      applyAdaptiveResult(next);
      schedulePersist();
    },
    [applyAdaptiveResult, schedulePersist],
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

  const buildSimpleTimeline = useCallback(() => {
    if (!targetBakeTime.trim()) {
      showToast(toasts.selectBakeTime);
      return null;
    }
    try {
      const plan = buildReverseTimeline(timelineInput);
      if (!plan) {
        showToast(toasts.invalidDateTime);
        return null;
      }
      setTimelinePlan(plan);
      setAdaptiveSchedule(null);
      setShowTimeline(true);
      return plan;
    } catch (err) {
      console.error("buildReverseTimeline failed", err);
      showToast(toasts.invalidDateTime);
      return null;
    }
  }, [targetBakeTime, timelineInput, showToast]);

  const runCalculate = useCallback(() => {
    const dough = math.calculate();
    if (!dough) {
      showToast(toasts.invalidDoughWeight);
      return false;
    }
    setShowGuide(true);
    setStarterOnlyMode(false);
    setState({ ...state, calculated: true });
    persistState(true);

    requestAnimationFrame(() => {
      document.getElementById("recipe-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return true;
  }, [math, showToast, setState, state, persistState]);

  const handleCalculate = useCallback(() => {
    return runCalculate();
  }, [runCalculate]);

  const needsFlourBalance = useCallback(
    (pcts?: number[]) => Math.abs(sumFlourPcts(pcts ?? flourDraft) - 100) > 0.1,
    [flourDraft],
  );

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
      showToast(toasts.linkCopied);
    } catch {
      showToast(url);
    }
  }, [setState, state, showResults, showToast]);

  const selectScheduleOption = useCallback(
    (option: ScheduleOption) => {
      if (!option.feasible) {
        showToast(option.infeasibleReason ?? toasts.scheduleUnavailable);
        return;
      }
      setTargetBakeTime(option.targetBakeTime);
      setColdRetardHours(option.coldRetardHours);
      setFermentationPace(option.isExpress ? "express" : "standard");
      if (option.isExpress) {
        setStarterRatioPreset("equal");
      }
      const result = SchedulingEngine.buildAdaptivePlan({
        ...schedulingEngineInput,
        targetBakeTime: option.targetBakeTime,
        coldRetardHours: option.coldRetardHours,
        fermentationPace: option.isExpress ? "express" : "standard",
      });
      if (result) applyAdaptiveResult(result);
      else {
        setTimelinePlan(option.plan);
        setShowTimeline(true);
      }
      setState({ ...state, calculated: showResults });
    },
    [
      setTargetBakeTime,
      setColdRetardHours,
      setFermentationPace,
      setStarterRatioPreset,
      schedulingEngineInput,
      applyAdaptiveResult,
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

      if (targetBakeTime && showTimeline) {
        const nextInput = {
          ...timelineInput,
          starterPct: plan.starterPct,
          roomTemp: plan.roomTemp,
          hoursToAutolyse: plan.hoursToAutolyse,
          bulkHours: plan.bulkHours,
          starterPeakHours: plan.hoursToAutolyse,
        };
        const rebuilt = buildReverseTimeline(nextInput);
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
      showTimeline,
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
    showToast(toasts.storageCleared);
  }, [showToast]);

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
    adaptiveSchedule,
    applyAdaptiveSchedule,
    blackouts,
    setBlackouts,
    schedulingEngineInput,
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
    buildSimpleTimeline,
    recipeParams: state,
    isParamsReady: hydrated,
    sourdoughMath: math,
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
