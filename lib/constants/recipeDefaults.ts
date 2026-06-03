import { defaultFlourPcts } from "@/lib/flour";
import type { FermentationPace, StarterRatioPreset } from "@/lib/expressMode";
import type { PresetKey } from "@/lib/types";
import { REST_METHOD_DEFAULT } from "@/lib/restMethod";
import type { RecipeState } from "@/lib/types/recipe";

export const FLOUR_COUNT = 6;

/** Typical room temp when user has no thermometer (Israeli homes). */
export const ESTIMATED_ROOM_TEMP_C = 22;

export const RECIPE_DEFAULTS = {
  waterPercent: 73,
  starterPercent: 20,
  saltPercent: 2,
  coldRetardHours: 12,
  hoursToAutolyse: 8,
  roomTempC: ESTIMATED_ROOM_TEMP_C,
  keepInJarG: 30,
  preset: "classic" as PresetKey,
  fermentationPace: "standard" as FermentationPace,
  starterRatioPreset: "auto" as StarterRatioPreset,
  restMethod: REST_METHOD_DEFAULT,
} as const;

export function createDefaultRecipeState(): RecipeState {
  const percentages = defaultFlourPcts();
  return {
    totalWeightG: null,
    waterPercent: RECIPE_DEFAULTS.waterPercent,
    starterPercent: RECIPE_DEFAULTS.starterPercent,
    saltPercent: RECIPE_DEFAULTS.saltPercent,
    flourBlend: {
      preset: RECIPE_DEFAULTS.preset,
      percentages,
      totalPercent: percentages.reduce((s, p) => s + p, 0),
    },
    schedule: {
      targetBakeTime: "",
      coldRetardHours: RECIPE_DEFAULTS.coldRetardHours,
      hoursToAutolyse: RECIPE_DEFAULTS.hoursToAutolyse,
      roomTempC: RECIPE_DEFAULTS.roomTempC,
      fermentationPace: RECIPE_DEFAULTS.fermentationPace,
      restMethod: RECIPE_DEFAULTS.restMethod,
    },
    starter: {
      useFromRecipe: true,
      manualGrams: null,
      keepInJarG: RECIPE_DEFAULTS.keepInJarG,
      ratioPreset: RECIPE_DEFAULTS.starterRatioPreset,
    },
    calculated: false,
  };
}
