import {
  parseRecipeParamsFromRecord,
  parseRecipeParamsFromSearch,
  type ParseRecipeParamsResult,
} from "@/lib/schemas/recipeParamsSchema";
import type { RecipeState } from "@/lib/types/recipe";
import type { RecipeState as LegacyUrlRecipeState } from "@/lib/types";

export { parseRecipeParamsFromSearch, parseRecipeParamsFromRecord };
export type { ParseRecipeParamsResult };

/** Map domain state → legacy URL/storage record (short keys). */
export function recipeStateToUrlRecord(
  state: RecipeState,
): LegacyUrlRecipeState {
  return {
    w: state.totalWeightG != null ? String(state.totalWeightG) : "",
    wa: String(state.waterPercent),
    st: String(state.starterPercent),
    sa: String(state.saltPercent),
    fp: state.flourBlend.preset,
    fl: state.flourBlend.percentages.join(","),
    bake: state.schedule.targetBakeTime || undefined,
    retard: String(state.schedule.coldRetardHours),
    hta: String(state.schedule.hoursToAutolyse),
    rt: String(state.schedule.roomTempC),
    jar: String(state.starter.keepInJarG),
    urs: state.starter.useFromRecipe ? "1" : "0",
    ms:
      state.starter.manualGrams != null
        ? String(state.starter.manualGrams)
        : undefined,
    pace: state.schedule.fermentationPace,
    sr: state.starter.ratioPreset,
    calc: state.calculated ? "1" : undefined,
  };
}

export function urlRecordToSearchParams(
  record: LegacyUrlRecipeState,
): URLSearchParams {
  const p = new URLSearchParams();
  (Object.keys(record) as (keyof LegacyUrlRecipeState)[]).forEach((key) => {
    const val = record[key];
    if (val !== "" && val != null) p.set(key, String(val));
  });
  return p;
}

export function recipeStateToSearchParams(state: RecipeState): URLSearchParams {
  return urlRecordToSearchParams(recipeStateToUrlRecord(state));
}

export function legacyUrlRecordToRecipeState(
  legacy: LegacyUrlRecipeState,
): ParseRecipeParamsResult {
  const record: Record<string, string | undefined> = {
    w: legacy.w,
    wa: legacy.wa,
    st: legacy.st,
    sa: legacy.sa,
    fp: legacy.fp,
    fl: legacy.fl,
    bake: legacy.bake,
    retard: legacy.retard,
    hta: legacy.hta,
    rt: legacy.rt,
    jar: legacy.jar,
    urs: legacy.urs,
    ms: legacy.ms,
    pace: legacy.pace,
    sr: legacy.sr,
    calc: legacy.calc,
  };
  return parseRecipeParamsFromRecord(record);
}
