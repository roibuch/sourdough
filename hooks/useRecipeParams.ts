"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDefaultRecipeState } from "@/lib/constants/recipeDefaults";
import {
  getClientPathname,
  getClientSearchKey,
  replaceRecipeUrl,
} from "@/lib/recipeUrlClient";
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
import {
  loadRecipeStateFromStorage,
  saveRecipeStateToStorage,
} from "@/lib/recipeState";

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

const URL_DEBOUNCE_MS = 900;

export interface UseRecipeParamsResult {
  state: RecipeState;
  /** True after URL / localStorage hydration (UI is never blocked). */
  hydrated: boolean;
  flourAdjusted: boolean;
  parseIssues: ParseRecipeParamsResult["issues"];
  setState: (next: RecipeState) => void;
  patchState: (patch: RecipeParamsPatch) => void;
  updateState: (fn: (prev: RecipeState) => RecipeState) => void;
  /** Persist draft to URL + localStorage (e.g. after «יצירת מתכון»). */
  commitStateToUrl: (
    next?: RecipeState | ((prev: RecipeState) => RecipeState),
  ) => void;
  /** Defaults in state, empty query string, no localStorage write. */
  resetToCleanDefaults: () => void;
}

export function useRecipeParams(): UseRecipeParamsResult {
  const [draft, setDraft] = useState<RecipeState>(createDefaultRecipeState);
  const [hydrated, setHydrated] = useState(false);
  const [flourAdjusted, setFlourAdjusted] = useState(false);
  const [parseIssues, setParseIssues] = useState<
    ParseRecipeParamsResult["issues"]
  >([]);

  const hydrateStarted = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<RecipeState | null>(null);
  const pathnameRef = useRef("/");

  const applyParsed = useCallback((result: ParseRecipeParamsResult) => {
    setDraft(result.state);
    setFlourAdjusted(result.flourAdjusted);
    setParseIssues(result.issues);
  }, []);

  const writeUrlNow = useCallback((next: RecipeState) => {
    const qs = recipeStateToSearchParams(next).toString();
    replaceRecipeUrl(pathnameRef.current, qs);
    saveRecipeStateToStorage(recipeStateToUrlRecord(next));
    pendingStateRef.current = null;
  }, []);

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
    pathnameRef.current = getClientPathname();

    if (hydrateStarted.current) return;
    hydrateStarted.current = true;

    const searchKey = getClientSearchKey();
    if (searchKey) {
      applyParsed(
        parseRecipeParamsFromSearch(new URLSearchParams(searchKey)),
      );
    } else {
      const stored = loadRecipeStateFromStorage();
      if (stored) {
        const { state } = legacyUrlRecordToRecipeState(stored);
        setDraft(state);
        writeUrlNow(state);
      }
    }
    setHydrated(true);
  }, [applyParsed, writeUrlNow]);

  useEffect(() => {
    const onPopState = () => {
      const searchKey = getClientSearchKey();
      if (searchKey) {
        applyParsed(
          parseRecipeParamsFromSearch(new URLSearchParams(searchKey)),
        );
      } else {
        applyParsed({
          state: createDefaultRecipeState(),
          flourAdjusted: false,
          issues: [],
        });
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyParsed]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const setState = useCallback(
    (next: RecipeState) => {
      setDraft(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      writeUrlNow(next);
    },
    [writeUrlNow],
  );

  const patchState = useCallback((patch: RecipeParamsPatch) => {
    setDraft((prev) => mergeRecipeState(prev, patch));
  }, []);

  const updateState = useCallback((fn: (prev: RecipeState) => RecipeState) => {
    setDraft((prev) => fn(prev));
  }, []);

  const commitStateToUrl = useCallback(
    (next?: RecipeState | ((prev: RecipeState) => RecipeState)) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pendingStateRef.current = null;
      setDraft((prev) => {
        const resolved =
          typeof next === "function" ? next(prev) : (next ?? prev);
        writeUrlNow(resolved);
        return resolved;
      });
    },
    [writeUrlNow],
  );

  const resetToCleanDefaults = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingStateRef.current = null;
    setDraft(createDefaultRecipeState());
    replaceRecipeUrl(pathnameRef.current, "");
  }, []);

  return {
    state: draft,
    hydrated,
    flourAdjusted,
    parseIssues,
    setState,
    patchState,
    updateState,
    commitStateToUrl,
    resetToCleanDefaults,
  };
}

export type { RecipeState, FlourBlend, BakingSchedule } from "@/lib/types/recipe";
