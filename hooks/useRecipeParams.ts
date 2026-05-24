"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createDefaultRecipeState } from "@/lib/constants/recipeDefaults";
import {
  parseRecipeParamsFromSearch,
  type ParseRecipeParamsResult,
} from "@/lib/schemas/recipeParamsSchema";
import type { RecipeState } from "@/lib/types/recipe";
import {
  legacyUrlRecordToRecipeState,
  recipeStateToSearchParams,
  recipeStateToUrlRecord,
} from "@/lib/urlRecipeCodec";
import { loadRecipeStateFromStorage, saveRecipeStateToStorage } from "@/lib/recipeState";

export type RecipeParamsPatch = Partial<{
  totalWeightG: number | null;
  waterPercent: number;
  starterPercent: number;
  saltPercent: number;
  flourBlend: RecipeState["flourBlend"];
  schedule: Partial<RecipeState["schedule"]>;
  starter: Partial<RecipeState["starter"]>;
  calculated: boolean;
}>;

function mergeRecipeState(
  prev: RecipeState,
  patch: RecipeParamsPatch,
): RecipeState {
  return {
    ...prev,
    ...patch,
    schedule: patch.schedule
      ? { ...prev.schedule, ...patch.schedule }
      : prev.schedule,
    starter: patch.starter
      ? { ...prev.starter, ...patch.starter }
      : prev.starter,
    flourBlend: patch.flourBlend ?? prev.flourBlend,
  };
}

export interface UseRecipeParamsResult {
  /** Validated domain state from URL (or defaults / storage on first load) */
  state: RecipeState;
  isReady: boolean;
  flourAdjusted: boolean;
  parseIssues: ParseRecipeParamsResult["issues"];
  /** Replace entire state in URL + storage (no full page reload) */
  setState: (next: RecipeState) => void;
  patchState: (patch: RecipeParamsPatch) => void;
  updateState: (fn: (prev: RecipeState) => RecipeState) => void;
}

export function useRecipeParams(): UseRecipeParamsResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const storageHydrated = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const searchKey = searchParams.toString();

  const parsed = useMemo((): ParseRecipeParamsResult => {
    if (!searchKey) {
      return {
        state: createDefaultRecipeState(),
        flourAdjusted: false,
        issues: [],
      };
    }
    return parseRecipeParamsFromSearch(new URLSearchParams(searchKey));
  }, [searchKey]);

  const state = parsed.state;

  const writeUrl = useCallback(
    (next: RecipeState) => {
      const qs = recipeStateToSearchParams(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.replace(href, { scroll: false });
      saveRecipeStateToStorage(recipeStateToUrlRecord(next));
    },
    [pathname, router],
  );

  useEffect(() => {
    if (storageHydrated.current) return;
    storageHydrated.current = true;

    if (!searchKey) {
      const stored = loadRecipeStateFromStorage();
      if (stored) {
        writeUrl(legacyUrlRecordToRecipeState(stored).state);
      }
    }
    setIsReady(true);
  }, [searchKey, writeUrl]);

  const setState = useCallback(
    (next: RecipeState) => {
      writeUrl(next);
    },
    [writeUrl],
  );

  const patchState = useCallback(
    (patch: RecipeParamsPatch) => {
      writeUrl(mergeRecipeState(parsed.state, patch));
    },
    [parsed.state, writeUrl],
  );

  const updateState = useCallback(
    (fn: (prev: RecipeState) => RecipeState) => {
      writeUrl(fn(parsed.state));
    },
    [parsed.state, writeUrl],
  );

  return {
    state,
    isReady,
    flourAdjusted: parsed.flourAdjusted,
    parseIssues: parsed.issues,
    setState,
    patchState,
    updateState,
  };
}

export type { RecipeState, FlourBlend, BakingSchedule } from "@/lib/types/recipe";
