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

const URL_DEBOUNCE_MS = 450;

export interface UseRecipeParamsResult {
  state: RecipeState;
  isReady: boolean;
  flourAdjusted: boolean;
  parseIssues: ParseRecipeParamsResult["issues"];
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

  const [draft, setDraft] = useState(parsed.state);
  const urlSyncKey = useRef(searchKey);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<RecipeState | null>(null);

  useEffect(() => {
    if (urlSyncKey.current !== searchKey) {
      urlSyncKey.current = searchKey;
      setDraft(parsed.state);
    }
  }, [searchKey, parsed.state]);

  const writeUrlNow = useCallback(
    (next: RecipeState) => {
      const qs = recipeStateToSearchParams(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.replace(href, { scroll: false });
      saveRecipeStateToStorage(recipeStateToUrlRecord(next));
      pendingStateRef.current = null;
    },
    [pathname, router],
  );

  const scheduleUrlWrite = useCallback(
    (next: RecipeState) => {
      pendingStateRef.current = next;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (pendingStateRef.current) {
          writeUrlNow(pendingStateRef.current);
        }
      }, URL_DEBOUNCE_MS);
    },
    [writeUrlNow],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (storageHydrated.current) return;
    storageHydrated.current = true;

    if (!searchKey) {
      const stored = loadRecipeStateFromStorage();
      if (stored) {
        writeUrlNow(legacyUrlRecordToRecipeState(stored).state);
      }
    }
    setIsReady(true);
  }, [searchKey, writeUrlNow]);

  const setState = useCallback(
    (next: RecipeState) => {
      setDraft(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      writeUrlNow(next);
    },
    [writeUrlNow],
  );

  const patchState = useCallback((patch: RecipeParamsPatch) => {
    setDraft((prev) => {
      const next = mergeRecipeState(prev, patch);
      scheduleUrlWrite(next);
      return next;
    });
  }, [scheduleUrlWrite]);

  const updateState = useCallback(
    (fn: (prev: RecipeState) => RecipeState) => {
      setDraft((prev) => {
        const next = fn(prev);
        scheduleUrlWrite(next);
        return next;
      });
    },
    [scheduleUrlWrite],
  );

  return {
    state: draft,
    isReady,
    flourAdjusted: parsed.flourAdjusted,
    parseIssues: parsed.issues,
    setState,
    patchState,
    updateState,
  };
}

export type { RecipeState, FlourBlend, BakingSchedule } from "@/lib/types/recipe";
