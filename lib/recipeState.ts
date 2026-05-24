import type { RecipeState as LegacyUrlRecipeState } from "./types";
import type { RecipeFormSnapshot } from "./recipeState.types";
import {
  legacyUrlRecordToRecipeState,
  recipeStateToUrlRecord,
  urlRecordToSearchParams,
} from "./urlRecipeCodec";
import type { RecipeState } from "./types/recipe";

export { STORAGE_KEY } from "./recipeState.types";
export type { RecipeFormSnapshot } from "./recipeState.types";

export function flourPctsToString(pcts: number[]): string {
  return pcts.join(",");
}

export function parseFlourPcts(fl: string | null | undefined): number[] | null {
  if (!fl) return null;
  const parts = fl.split(",").map((p) => parseFloat(p.trim()));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

export function buildRecipeState(
  params: RecipeFormSnapshot,
): LegacyUrlRecipeState {
  const domain: RecipeState = {
    totalWeightG: params.totalWeight
      ? parseFloat(params.totalWeight) || null
      : null,
    waterPercent: params.waterPct,
    starterPercent: params.starterPct,
    saltPercent: params.saltPct,
    flourBlend: {
      preset: params.preset,
      percentages: params.flourPcts,
      totalPercent: params.flourPcts.reduce((s, p) => s + p, 0),
    },
    schedule: {
      targetBakeTime: params.targetBakeTime,
      coldRetardHours: params.coldRetardHours,
      hoursToAutolyse: params.hoursToAutolyse,
      roomTempC: params.roomTemp,
      fermentationPace:
        (params.fermentationPace as RecipeState["schedule"]["fermentationPace"]) ??
        "standard",
    },
    starter: {
      useFromRecipe: params.useRecipeStarter,
      manualGrams: params.manualStarterG
        ? parseFloat(params.manualStarterG) || null
        : null,
      keepInJarG: params.keepInJarG,
      ratioPreset:
        (params.starterRatioPreset as RecipeState["starter"]["ratioPreset"]) ??
        "auto",
    },
    calculated: params.calculated ?? false,
  };
  return recipeStateToUrlRecord(domain);
}

export function stateToSearchParams(
  state: LegacyUrlRecipeState,
): URLSearchParams {
  return urlRecordToSearchParams(state);
}

export function parseRecipeStateFromSearch(
  search: string,
): LegacyUrlRecipeState | null {
  const params = new URLSearchParams(search);
  if (!params.toString()) return null;
  const record: LegacyUrlRecipeState = {
    w: params.get("w") ?? "",
    wa: params.get("wa") ?? "",
    st: params.get("st") ?? "",
    sa: params.get("sa") ?? "",
    fp: (params.get("fp") as LegacyUrlRecipeState["fp"]) || "classic",
    fl: params.get("fl") ?? "",
    bake: params.get("bake") ?? undefined,
    retard: params.get("retard") ?? undefined,
    hta: params.get("hta") ?? undefined,
    rt: params.get("rt") ?? undefined,
    jar: params.get("jar") ?? undefined,
    urs: params.get("urs") ?? undefined,
    ms: params.get("ms") ?? undefined,
    pace: params.get("pace") ?? undefined,
    sr: params.get("sr") ?? undefined,
    calc: params.get("calc") ?? undefined,
  };
  return recipeStateToUrlRecord(legacyUrlRecordToRecipeState(record).state);
}

export function loadRecipeStateFromStorage(): LegacyUrlRecipeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sourdough-master-state-v1");
    if (!raw) return null;
    return JSON.parse(raw) as LegacyUrlRecipeState;
  } catch {
    return null;
  }
}

export function saveRecipeStateToStorage(state: LegacyUrlRecipeState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sourdough-master-state-v1", JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function syncRecipeStateToUrl(state: LegacyUrlRecipeState): void {
  if (typeof window === "undefined") return;
  const qs = stateToSearchParams(state).toString();
  const newUrl =
    window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
  window.history.replaceState(null, "", newUrl);
}
