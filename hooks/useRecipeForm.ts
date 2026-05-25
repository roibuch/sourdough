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
import {
  SchedulingEngine,
  type AdaptiveScheduleResult,
  type BlackoutPeriod,
} from "@/lib/scheduling";
import type { SchedulingEngineInput } from "@/lib/scheduling/types";
import { MS_MIN } from "@/lib/scheduling/timeUtils";
import { heContent, t } from "@/lib/content";
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
  const [adaptiveSchedule, setAdaptiveSchedule] =
    useState<AdaptiveScheduleResult | null>(null);
  const [blackouts, setBlackoutsState] = useState<BlackoutPeriod[]>(loadBlackouts);
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
      const rounded = next.map(
        (p) => Math.round(Math.min(100, Math.max(0, p)) * 10) / 10,
      );
      const total = Math.round(rounded.reduce((s, p) => s + p, 0) * 10) / 10;
      patchState({
        flourBlend: {
          preset: "custom",
          percentages: rounded,
          totalPercent: total,
        },
      });
    },
    [flourPcts, patchState],
  );

  const balanceFlourBlend = useCallback(() => {
    const normalized = normalizeFlourPercentages(flourPcts);
    patchState({
      flourBlend: {
        preset: "custom",
        percentages: normalized,
        totalPercent: 100,
      },
    });
    setPresetNote(CUSTOM_FLOUR_NOTE(100));
  }, [flourPcts, patchState, setPresetNote]);

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
    if (!isReady || initDone.current) return;
    initDone.current = true;

    if (flourAdjusted) {
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
      try {
        const result = SchedulingEngine.buildAdaptivePlan({
          targetBakeTime: state.schedule.targetBakeTime,
          coldRetardHours: state.schedule.coldRetardHours,
          starterPct: state.starterPercent,
          waterPct: state.waterPercent,
          roomTemp: state.schedule.roomTempC,
          hoursToAutolyse: state.schedule.hoursToAutolyse,
          flourPcts: state.flourBlend.percentages,
          fermentationPace: state.schedule.fermentationPace,
          blackouts,
          earliestStartMs: Date.now(),
        });
        if (result) applyAdaptiveResult(result);
      } catch (err) {
        console.error("buildAdaptivePlan failed on init", err);
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
    try {
      const result = SchedulingEngine.buildAdaptivePlan(schedulingEngineInput);
      if (result) {
        setAdaptiveSchedule(result);
        setTimelinePlan(result.plan);
      }
    } catch (err) {
      console.error("buildAdaptivePlan failed", err);
    }
  }, [schedulingEngineInput, showTimeline, targetBakeTime, blackouts.length]);

  const handleCalculate = useCallback(() => {
    const w = state.totalWeightG;
    if (!w || w <= 0) {
      showToast(toasts.invalidDoughWeight);
      return;
    }
    if (Math.abs(mix.totalPct - 100) > 0.1) {
      const balanced = normalizeFlourPercentages(flourPcts);
      patchState({
        flourBlend: {
          preset: "custom",
          percentages: balanced,
          totalPercent: 100,
        },
      });
      showToast(toasts.flourNormalized);
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
        const engineResult = SchedulingEngine.buildAdaptivePlan({
          ...nextInput,
          blackouts,
          earliestStartMs: Date.now(),
        });
        const rebuilt =
          engineResult?.plan ??
          match?.plan ??
          buildReverseTimeline(nextInput);
        if (engineResult) applyAdaptiveResult(engineResult);
        else if (rebuilt) {
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
      blackouts,
      applyAdaptiveResult,
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
    balanceFlourBlend,
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
    recipeParams: state,
    isParamsReady: isReady,
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
