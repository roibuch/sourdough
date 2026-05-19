import type { PresetKey, RecipeState } from "./types";

export const STORAGE_KEY = "sourdough-master-state-v1";

export function flourPctsToString(pcts: number[]): string {
  return pcts.join(",");
}

export function parseFlourPcts(fl: string | null | undefined): number[] | null {
  if (!fl) return null;
  const parts = fl.split(",").map((p) => parseFloat(p.trim()));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

export interface RecipeFormSnapshot {
  totalWeight: string;
  waterPct: number;
  starterPct: number;
  saltPct: number;
  preset: PresetKey;
  flourPcts: number[];
  targetBakeTime: string;
  coldRetardHours: number;
  hoursToAutolyse: number;
  roomTemp: number;
  keepInJarG: number;
  useRecipeStarter: boolean;
  manualStarterG: string;
  fermentationPace?: string;
  starterRatioPreset?: string;
  calculated?: boolean;
}

export function buildRecipeState(params: RecipeFormSnapshot): RecipeState {
  return {
    w: params.totalWeight,
    wa: String(params.waterPct),
    st: String(params.starterPct),
    sa: String(params.saltPct),
    fp: params.preset,
    fl: flourPctsToString(params.flourPcts),
    bake: params.targetBakeTime || undefined,
    retard: String(params.coldRetardHours),
    hta: String(params.hoursToAutolyse),
    rt: String(params.roomTemp),
    jar: String(params.keepInJarG),
    urs: params.useRecipeStarter ? "1" : "0",
    ms: params.manualStarterG || undefined,
    pace: params.fermentationPace || undefined,
    sr: params.starterRatioPreset || undefined,
    ...(params.calculated ? { calc: "1" } : {}),
  };
}

export function stateToSearchParams(state: RecipeState): URLSearchParams {
  const p = new URLSearchParams();
  (Object.keys(state) as (keyof RecipeState)[]).forEach((key) => {
    const val = state[key];
    if (val !== "" && val != null) p.set(key, String(val));
  });
  return p;
}

export function parseRecipeStateFromSearch(
  search: string,
): RecipeState | null {
  const p = new URLSearchParams(search);
  if (!p.toString()) return null;
  return {
    w: p.get("w") ?? "",
    wa: p.get("wa") ?? "",
    st: p.get("st") ?? "",
    sa: p.get("sa") ?? "",
    fp: (p.get("fp") as PresetKey) || "classic",
    fl: p.get("fl") ?? "",
    bake: p.get("bake") ?? undefined,
    retard: p.get("retard") ?? undefined,
    hta: p.get("hta") ?? undefined,
    rt: p.get("rt") ?? undefined,
    jar: p.get("jar") ?? undefined,
    urs: p.get("urs") ?? undefined,
    ms: p.get("ms") ?? undefined,
    pace: p.get("pace") ?? undefined,
    sr: p.get("sr") ?? undefined,
    calc: p.get("calc") ?? undefined,
  };
}

export function loadRecipeStateFromStorage(): RecipeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RecipeState;
  } catch {
    return null;
  }
}

export function saveRecipeStateToStorage(state: RecipeState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function syncRecipeStateToUrl(state: RecipeState): void {
  if (typeof window === "undefined") return;
  const qs = stateToSearchParams(state).toString();
  const newUrl =
    window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
  window.history.replaceState(null, "", newUrl);
}
