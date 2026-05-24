/**
 * Recipe URL state & domain model — public API.
 *
 * Flow: URL (?wa=70&fl=…) → Zod → RecipeState → UI via useRecipeParams
 * Math: lib/bakingMath.ts (no React)
 */

export type {
  RecipeState,
  FlourBlend,
  BakingSchedule,
  StarterPreferences,
} from "@/lib/types/recipe";

export {
  urlRecipeParamsRawSchema,
  recipeStateSchema,
  parseRecipeParamsFromSearch,
  parseRecipeParamsFromRecord,
  normalizeFlourPercentages,
  isFlourBlendValid,
  isHydrationValid,
  type ParseRecipeParamsResult,
  type UrlRecipeParamsRaw,
  type UrlRecipeParamsParsed,
} from "@/lib/schemas/recipeParamsSchema";

export {
  recipeStateToUrlRecord,
  recipeStateToSearchParams,
  legacyUrlRecordToRecipeState,
} from "@/lib/urlRecipeCodec";

export { createDefaultRecipeState, RECIPE_DEFAULTS } from "@/lib/constants/recipeDefaults";

export {
  calculateDough,
  calculateDoughMasses,
  getTrueHydration,
  getBassinageAmounts,
  calculateWaterTempDDT,
  totalBakersPercentFactor,
  flourWeightFromTarget,
  type BakersPercentages,
  type DoughMassInput,
  type DDTInput,
  type DDTResult,
} from "@/lib/bakingMath";
