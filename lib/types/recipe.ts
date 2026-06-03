import type { FermentationPace, StarterRatioPreset } from "@/lib/expressMode";
import type { RestMethod } from "@/lib/restMethod";
import type { PresetKey } from "@/lib/types";

/** Baker's-percentage blend of flour types (must sum to 100%). */
export interface FlourBlend {
  preset: PresetKey;
  /** One entry per flour field, 0–100 each */
  percentages: number[];
  totalPercent: number;
}

/** Timeline / environment inputs stored in the URL. */
export interface BakingSchedule {
  /** Local datetime string for target bake end (HTML datetime-local) */
  targetBakeTime: string;
  coldRetardHours: number;
  hoursToAutolyse: number;
  roomTempC: number;
  fermentationPace: FermentationPace;
  /** Autolyse (flour+water) vs fermentolyse (flour+water+starter, salt later) */
  restMethod: RestMethod;
}

export interface StarterPreferences {
  useFromRecipe: boolean;
  manualGrams: number | null;
  keepInJarG: number;
  ratioPreset: StarterRatioPreset;
}

/**
 * Validated application recipe state (domain model).
 * Serialized to URL via {@link lib/urlRecipeCodec}.
 */
export interface RecipeState {
  /** Target final dough weight in grams; null when field is empty */
  totalWeightG: number | null;
  waterPercent: number;
  starterPercent: number;
  saltPercent: number;
  flourBlend: FlourBlend;
  schedule: BakingSchedule;
  starter: StarterPreferences;
  calculated: boolean;
}
