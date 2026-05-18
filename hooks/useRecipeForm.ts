"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateDough } from "@/lib/dough";
import {
  FLOUR_FIELDS,
  FLOUR_PRESETS,
  PRESET_OPTIONS,
  buildFlourMix,
  defaultFlourPcts,
} from "@/lib/flour";
import {
  STORAGE_KEY,
  buildRecipeState,
  loadRecipeStateFromStorage,
  parseFlourPcts,
  parseRecipeStateFromSearch,
  saveRecipeStateToStorage,
  syncRecipeStateToUrl,
} from "@/lib/recipeState";
import { buildReverseTimeline, defaultTargetBakeLocal } from "@/lib/timeline";
import type { DoughResult, PresetKey, TimelinePlan } from "@/lib/types";

const DEFAULT_WATER = 73;
const DEFAULT_STARTER = 20;
const DEFAULT_SALT = 2;
const DEFAULT_RETARD = 12;
const DEFAULT_HTA = 5;
const DEFAULT_ROOM = 22;

export function useRecipeForm() {
  const [totalWeight, setTotalWeight] = useState("");
  const [waterPct, setWaterPct] = useState(DEFAULT_WATER);
  const [starterPct, setStarterPct] = useState(DEFAULT_STARTER);
  const [saltPct, setSaltPct] = useState(DEFAULT_SALT);
  const [preset, setPreset] = useState<PresetKey>("classic");
  const [flourPcts, setFlourPcts] = useState<number[]>(defaultFlourPcts);
  const [presetNote, setPresetNote] = useState(FLOUR_PRESETS.classic.note);
  const [targetBakeTime, setTargetBakeTime] = useState("");
  const [coldRetardHours, setColdRetardHours] = useState(DEFAULT_RETARD);
  const [hoursToAutolyse, setHoursToAutolyse] = useState(DEFAULT_HTA);
  const [roomTemp, setRoomTemp] = useState(DEFAULT_ROOM);
  const [results, setResults] = useState<DoughResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timelinePlan, setTimelinePlan] = useState<TimelinePlan | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hydrated = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mix = useMemo(() => buildFlourMix(flourPcts), [flourPcts]);

  const timelineInput = useMemo(
    () => ({
      targetBakeTime,
      coldRetardHours,
      starterPct,
      waterPct,
      roomTemp,
      hoursToAutolyse,
      flourPcts,
    }),
    [
      targetBakeTime,
      coldRetardHours,
      starterPct,
      waterPct,
      roomTemp,
      hoursToAutolyse,
      flourPcts,
    ],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const getSnapshot = useCallback(
    (calculated?: boolean) => ({
      totalWeight,
      waterPct,
      starterPct,
      saltPct,
      preset,
      flourPcts,
      targetBakeTime,
      coldRetardHours,
      hoursToAutolyse,
      roomTemp,
      calculated: calculated ?? showResults,
    }),
    [
      totalWeight,
      waterPct,
      starterPct,
      saltPct,
      preset,
      flourPcts,
      targetBakeTime,
      coldRetardHours,
      hoursToAutolyse,
      roomTemp,
      showResults,
    ],
  );

  const persistState = useCallback(
    (calculated?: boolean) => {
      if (!hydrated.current) return;
      const state = buildRecipeState(getSnapshot(calculated));
      saveRecipeStateToStorage(state);
      syncRecipeStateToUrl(state);
    },
    [getSnapshot],
  );

  const schedulePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => persistState(), 350);
  }, [persistState]);

  const applyPreset = useCallback((key: PresetKey) => {
    if (key === "custom") {
      setPresetNote("עריכה ידנית: ודא/י שהאחוזים מסתכמים ל־100%.");
      return;
    }
    const p = FLOUR_PRESETS[key];
    if (!p) return;
    setFlourPcts([...p.values]);
    setPresetNote(p.note);
  }, []);

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
    const fromUrl =
      typeof window !== "undefined"
        ? parseRecipeStateFromSearch(window.location.search)
        : null;
    const fromStorage = loadRecipeStateFromStorage();
    const state = fromUrl ?? fromStorage;

    if (state) {
      if (state.w) setTotalWeight(state.w);
      if (state.wa) setWaterPct(parseFloat(state.wa) || DEFAULT_WATER);
      if (state.st) setStarterPct(parseFloat(state.st) || DEFAULT_STARTER);
      if (state.sa) setSaltPct(parseFloat(state.sa) || DEFAULT_SALT);
      if (state.bake) setTargetBakeTime(state.bake);
      if (state.retard) setColdRetardHours(parseFloat(state.retard) || DEFAULT_RETARD);
      if (state.hta) setHoursToAutolyse(parseFloat(state.hta) || DEFAULT_HTA);
      if (state.rt) setRoomTemp(parseFloat(state.rt) || DEFAULT_ROOM);

      const parsed = parseFlourPcts(state.fl);
      if (parsed && parsed.length === FLOUR_FIELDS.length) {
        setFlourPcts(parsed);
        const fp = state.fp as PresetKey;
        setPreset(
          fp && PRESET_OPTIONS.some((o) => o.value === fp) ? fp : "custom",
        );
        if (
          fp &&
          fp !== "custom" &&
          FLOUR_PRESETS[fp as Exclude<PresetKey, "custom">]
        ) {
          setPresetNote(FLOUR_PRESETS[fp as Exclude<PresetKey, "custom">].note);
        }
      } else if (
        state.fp &&
        state.fp !== "custom" &&
        FLOUR_PRESETS[state.fp as Exclude<PresetKey, "custom">]
      ) {
        const fp = state.fp as Exclude<PresetKey, "custom">;
        setPreset(fp);
        setFlourPcts([...FLOUR_PRESETS[fp].values]);
        setPresetNote(FLOUR_PRESETS[fp].note);
      }
    } else {
      applyPreset("classic");
    }

    if (!state?.bake) setTargetBakeTime(defaultTargetBakeLocal());

    hydrated.current = true;

    if (state?.calc === "1" && state.w) {
      const w = parseFloat(state.w);
      const m = buildFlourMix(parseFlourPcts(state.fl) ?? defaultFlourPcts());
      if (w > 0 && Math.abs(m.totalPct - 100) < 0.2) {
        const wa = parseFloat(state.wa || String(DEFAULT_WATER));
        const st = parseFloat(state.st || String(DEFAULT_STARTER));
        const sa = parseFloat(state.sa || String(DEFAULT_SALT));
        setResults(calculateDough(w, wa, st, sa));
        setShowResults(true);
      }
    }

    if (state?.bake) {
      const plan = buildReverseTimeline({
        targetBakeTime: state.bake,
        coldRetardHours: parseFloat(state.retard || String(DEFAULT_RETARD)) || DEFAULT_RETARD,
        starterPct: parseFloat(state.st || String(DEFAULT_STARTER)) || DEFAULT_STARTER,
        waterPct: parseFloat(state.wa || String(DEFAULT_WATER)) || DEFAULT_WATER,
        roomTemp: parseFloat(state.rt || String(DEFAULT_ROOM)) || DEFAULT_ROOM,
        hoursToAutolyse: parseFloat(state.hta || String(DEFAULT_HTA)) || DEFAULT_HTA,
        flourPcts: parseFlourPcts(state.fl) ?? defaultFlourPcts(),
      });
      if (plan) {
        setTimelinePlan(plan);
        setShowTimeline(true);
      }
    }

    persistState(state?.calc === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    schedulePersist();
  }, [
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    preset,
    flourPcts,
    targetBakeTime,
    coldRetardHours,
    hoursToAutolyse,
    roomTemp,
    schedulePersist,
  ]);

  useEffect(() => {
    if (!showTimeline || !targetBakeTime) return;
    const plan = buildReverseTimeline(timelineInput);
    if (plan) setTimelinePlan(plan);
  }, [timelineInput, showTimeline, targetBakeTime]);

  const handleCalculate = useCallback(() => {
    const w = parseFloat(totalWeight);
    if (!w || w <= 0) {
      showToast("הזן/י משקל בצק תקין.");
      return;
    }
    if (Math.abs(mix.totalPct - 100) > 0.1) {
      showToast(`אחוזי הקמחים צריכים להסתכם ל־100%. כרגע: ${mix.totalPct}%.`);
      return;
    }
    const dough = calculateDough(w, waterPct, starterPct, saltPct);
    setResults(dough);
    setShowResults(true);
    persistState(true);

    if (targetBakeTime) {
      const plan = rebuildTimeline(true);
      if (plan) {
        requestAnimationFrame(() => {
          document.getElementById("schedule-card")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
        return;
      }
    }

    requestAnimationFrame(() => {
      document.getElementById("recipe-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [
    totalWeight,
    mix.totalPct,
    waterPct,
    starterPct,
    saltPct,
    targetBakeTime,
    showToast,
    persistState,
    rebuildTimeline,
  ]);

  const handleBuildTimeline = useCallback(() => {
    const plan = rebuildTimeline(false);
    if (plan) {
      persistState(showResults);
      setTimeout(() => {
        document.getElementById("schedule-card")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  }, [rebuildTimeline, persistState, showResults]);

  const handleCopyLink = useCallback(async () => {
    persistState(showResults);
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("הקישור הועתק — אפשר לשתף את המתכון.");
    } catch {
      showToast(url);
    }
  }, [persistState, showResults, showToast]);

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
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
