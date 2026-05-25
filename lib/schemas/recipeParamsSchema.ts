import { z } from "zod";
import {
  FLOUR_PRESETS,
  FLOUR_FIELDS,
  migrateLegacyFlourPcts,
} from "@/lib/flour";
import {
  createDefaultRecipeState,
  FLOUR_COUNT,
  RECIPE_DEFAULTS,
} from "@/lib/constants/recipeDefaults";
import type { PresetKey } from "@/lib/types";
import type {
  BakingSchedule,
  FlourBlend,
  RecipeState,
  StarterPreferences,
} from "@/lib/types/recipe";

const FLOUR_TOTAL_TARGET = 100;
const FLOUR_TOTAL_TOLERANCE = 0.15;

const LEGACY_PRESET_MAP: Record<string, PresetKey> = {
  openCrumb: "country",
  pizzaSoft: "classic",
  nutty: "country",
  buckwheatAccent: "whole",
  softHome: "classic",
};

export const presetKeySchema = z
  .string()
  .optional()
  .transform((v): PresetKey => {
    const key = v ?? RECIPE_DEFAULTS.preset;
    if (key in FLOUR_PRESETS) return key as Exclude<PresetKey, "custom">;
    if (key === "custom") return "custom";
    return LEGACY_PRESET_MAP[key] ?? RECIPE_DEFAULTS.preset;
  });

export const fermentationPaceSchema = z.enum(["standard", "express"]);
export const starterRatioPresetSchema = z.enum([
  "auto",
  "equal",
  "half",
  "peak",
]);

/** "1" = true; absent or "0" = false — except useRecipeStarter (see ursField) */
const calcFlagSchema = z
  .union([z.literal("1"), z.literal("0"), z.literal(""), z.undefined()])
  .transform((v) => v === "1");

/** Default true when param omitted (legacy behavior) */
const useRecipeStarterSchema = z
  .union([z.literal("1"), z.literal("0"), z.literal(""), z.undefined()])
  .transform((v) => v !== "0");

const percentCoerce = (min: number, max: number, fallback: number) =>
  z
    .union([z.string(), z.number(), z.undefined()])
    .transform((v) => {
      if (v === undefined || v === "") return fallback;
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : fallback;
    })
    .pipe(z.number().min(min).max(max));

const optionalString = z
  .union([z.string(), z.undefined()])
  .transform((v) => (v == null ? "" : String(v)));

/** Raw URL search-param record (short keys). `.partial()` — share links omit most keys. */
export const urlRecipeParamsRawSchema = z
  .object({
    w: optionalString,
    wa: percentCoerce(1, 120, RECIPE_DEFAULTS.waterPercent),
    st: percentCoerce(1, 80, RECIPE_DEFAULTS.starterPercent),
    sa: percentCoerce(0.5, 5, RECIPE_DEFAULTS.saltPercent),
    fp: presetKeySchema,
    fl: optionalString,
    bake: optionalString,
    retard: percentCoerce(0, 48, RECIPE_DEFAULTS.coldRetardHours),
    hta: percentCoerce(1, 24, RECIPE_DEFAULTS.hoursToAutolyse),
    rt: percentCoerce(10, 35, RECIPE_DEFAULTS.roomTempC),
    jar: percentCoerce(0, 500, RECIPE_DEFAULTS.keepInJarG),
    urs: useRecipeStarterSchema,
    ms: optionalString,
    pace: fermentationPaceSchema.catch(RECIPE_DEFAULTS.fermentationPace),
    sr: starterRatioPresetSchema.catch(RECIPE_DEFAULTS.starterRatioPreset),
    calc: calcFlagSchema,
  })
  .partial();

export type UrlRecipeParamsRaw = z.input<typeof urlRecipeParamsRawSchema>;
export type UrlRecipeParamsParsed = z.output<typeof urlRecipeParamsRawSchema>;

function parseFlourCsv(fl: string): number[] | null {
  if (!fl.trim()) return null;
  const parts = fl.split(",").map((p) => parseFloat(p.trim()));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === FLOUR_COUNT) {
    return parts.map((n) => Math.min(100, Math.max(0, n)));
  }
  if (parts.length === 10) {
    return migrateLegacyFlourPcts(parts);
  }
  return null;
}

function sumPct(pcts: number[]): number {
  return Math.round(pcts.reduce((s, p) => s + p, 0) * 100) / 100;
}

/** Scale blend proportionally so total = 100% */
export function normalizeFlourPercentages(pcts: number[]): number[] {
  const total = sumPct(pcts);
  if (total <= 0) return [...FLOUR_PRESETS.classic.values];
  if (Math.abs(total - FLOUR_TOTAL_TARGET) < FLOUR_TOTAL_TOLERANCE) {
    return pcts.map((n) => Math.round(n * 10) / 10);
  }
  const factor = FLOUR_TOTAL_TARGET / total;
  const scaled = pcts.map((n) => Math.round(n * factor * 10) / 10);
  const drift = FLOUR_TOTAL_TARGET - sumPct(scaled);
  if (Math.abs(drift) > 0.01) {
    const maxIdx = scaled.indexOf(Math.max(...scaled));
    scaled[maxIdx] = Math.round((scaled[maxIdx] + drift) * 10) / 10;
  }
  return scaled;
}

function resolveFlourBlend(
  fp: PresetKey,
  fl: string,
): { blend: FlourBlend; flourAdjusted: boolean } {
  let percentages: number[];
  let flourAdjusted = false;

  const parsed = parseFlourCsv(fl);
  if (parsed) {
    const total = sumPct(parsed);
    if (Math.abs(total - FLOUR_TOTAL_TARGET) <= FLOUR_TOTAL_TOLERANCE) {
      percentages = parsed;
    } else {
      percentages = normalizeFlourPercentages(parsed);
      flourAdjusted = true;
    }
  } else if (fp !== "custom" && FLOUR_PRESETS[fp]) {
    percentages = [...FLOUR_PRESETS[fp].values];
  } else {
    percentages = [...FLOUR_PRESETS.classic.values];
    flourAdjusted = true;
  }

  return {
    blend: {
      preset: fp,
      percentages,
      totalPercent: sumPct(percentages),
    },
    flourAdjusted,
  };
}

function parseTotalWeightG(w: string): number | null {
  const trimmed = w.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 10_000) return null;
  return n;
}

function parseManualStarterG(ms: string): number | null {
  const trimmed = ms.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function rawParamsToRecipeState(
  raw: UrlRecipeParamsParsed,
): { state: RecipeState; flourAdjusted: boolean } {
  const fp = raw.fp ?? RECIPE_DEFAULTS.preset;
  const fl = raw.fl ?? "";
  const { blend, flourAdjusted } = resolveFlourBlend(fp, fl);

  const schedule: BakingSchedule = {
    targetBakeTime: raw.bake ?? "",
    coldRetardHours: raw.retard ?? RECIPE_DEFAULTS.coldRetardHours,
    hoursToAutolyse: raw.hta ?? RECIPE_DEFAULTS.hoursToAutolyse,
    roomTempC: raw.rt ?? RECIPE_DEFAULTS.roomTempC,
    fermentationPace: raw.pace ?? RECIPE_DEFAULTS.fermentationPace,
  };

  const starter: StarterPreferences = {
    useFromRecipe: raw.urs ?? true,
    manualGrams: parseManualStarterG(raw.ms ?? ""),
    keepInJarG: raw.jar ?? RECIPE_DEFAULTS.keepInJarG,
    ratioPreset: raw.sr ?? RECIPE_DEFAULTS.starterRatioPreset,
  };

  const state: RecipeState = {
    totalWeightG: parseTotalWeightG(raw.w ?? ""),
    waterPercent: raw.wa ?? RECIPE_DEFAULTS.waterPercent,
    starterPercent: raw.st ?? RECIPE_DEFAULTS.starterPercent,
    saltPercent: raw.sa ?? RECIPE_DEFAULTS.saltPercent,
    flourBlend: blend,
    schedule,
    starter,
    calculated: raw.calc ?? false,
  };

  return { state, flourAdjusted };
}

/** Full domain state after URL parse + flour normalization */
export const recipeStateSchema = urlRecipeParamsRawSchema.transform(
  (raw) => rawParamsToRecipeState(raw).state,
);

export interface ParseRecipeParamsResult {
  state: RecipeState;
  flourAdjusted: boolean;
  /** Zod issues when falling back to defaults */
  issues: z.ZodIssue[];
}

export function parseRecipeParamsFromRecord(
  record: Record<string, string | string[] | undefined>,
): ParseRecipeParamsResult {
  const flat: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(record)) {
    flat[key] = Array.isArray(val) ? val[0] : val;
  }

  const result = urlRecipeParamsRawSchema.safeParse(flat);
  if (result.success) {
    const { state, flourAdjusted } = rawParamsToRecipeState(result.data);
    return { state, flourAdjusted, issues: [] };
  }

  const partial = urlRecipeParamsRawSchema.safeParse({});
  const fallback =
    partial.success
      ? rawParamsToRecipeState(partial.data)
      : { state: createDefaultRecipeState(), flourAdjusted: true };

  return {
    state: fallback.state,
    flourAdjusted: true,
    issues: result.error.issues,
  };
}

export function parseRecipeParamsFromSearch(
  search: string | URLSearchParams,
): ParseRecipeParamsResult {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const record: Record<string, string> = {};
  params.forEach((value, key) => {
    record[key] = value;
  });
  if (!params.toString()) {
    return {
      state: createDefaultRecipeState(),
      flourAdjusted: false,
      issues: [],
    };
  }
  return parseRecipeParamsFromRecord(record);
}

export function isFlourBlendValid(blend: FlourBlend): boolean {
  return (
    blend.percentages.length === FLOUR_FIELDS.length &&
    Math.abs(blend.totalPercent - FLOUR_TOTAL_TARGET) <= FLOUR_TOTAL_TOLERANCE
  );
}

export function isHydrationValid(waterPercent: number): boolean {
  return waterPercent >= 1 && waterPercent <= 120;
}
