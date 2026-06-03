import { heContent, t } from "@/lib/content";
import type { FlourMix } from "@/lib/types";

export const FLOUR_TOTAL_TARGET = 100;
export const FLOUR_TOTAL_TOLERANCE = 0.1;

export interface RecipeValidationInput {
  totalWeight: string;
  waterPct: number;
  starterPct: number;
  saltPct: number;
  mix: FlourMix;
}

export type RecipeFieldKey =
  | "totalWeight"
  | "waterPct"
  | "starterPct"
  | "saltPct"
  | "flourTotal";

export interface FieldValidation {
  invalid?: boolean;
  warning?: boolean;
  message?: string;
}

export interface RecipeValidation {
  fields: Partial<Record<RecipeFieldKey, FieldValidation>>;
  flourTotalInvalid: boolean;
  canCalculate: boolean;
}

const v = heContent.validation;

/** Hard bounds (match SmartNumberInput) */
const HARD = {
  waterPct: { min: 1, max: 120 },
  starterPct: { min: 1, max: 80 },
  saltPct: { min: 0.5, max: 5 },
} as const;

/** Soft guidance — visual warning, calculation still allowed */
const SOFT = {
  waterPct: { min: 55, max: 95 },
  starterPct: { min: 10, max: 30 },
  saltPct: { min: 1.8, max: 2.2 },
} as const;

export function validateRecipeForm(
  input: RecipeValidationInput,
): RecipeValidation {
  const fields: RecipeValidation["fields"] = {};

  const w = parseFloat(input.totalWeight);
  if (!input.totalWeight.trim() || Number.isNaN(w) || w <= 0) {
    fields.totalWeight = {
      invalid: true,
      message: v.totalWeight.required,
    };
  } else if (w > 10000) {
    fields.totalWeight = {
      invalid: true,
      message: v.totalWeight.tooHigh,
    };
  }

  if (
    input.waterPct < HARD.waterPct.min ||
    input.waterPct > HARD.waterPct.max
  ) {
    fields.waterPct = {
      invalid: true,
      message: t(v.waterPct.hard, {
        value: input.waterPct,
        min: HARD.waterPct.min,
        max: HARD.waterPct.max,
      }),
    };
  } else if (
    input.waterPct < SOFT.waterPct.min ||
    input.waterPct > SOFT.waterPct.max
  ) {
    fields.waterPct = {
      warning: true,
      message: t(v.waterPct.soft, {
        value: input.waterPct,
        min: SOFT.waterPct.min,
        max: SOFT.waterPct.max,
      }),
    };
  }

  if (
    input.starterPct < HARD.starterPct.min ||
    input.starterPct > HARD.starterPct.max
  ) {
    fields.starterPct = {
      invalid: true,
      message: t(v.starterPct.hard, {
        value: input.starterPct,
        min: HARD.starterPct.min,
        max: HARD.starterPct.max,
      }),
    };
  } else if (
    input.starterPct < SOFT.starterPct.min ||
    input.starterPct > SOFT.starterPct.max
  ) {
    fields.starterPct = {
      warning: true,
      message: t(v.starterPct.soft, {
        value: input.starterPct,
        min: SOFT.starterPct.min,
        max: SOFT.starterPct.max,
      }),
    };
  }

  if (
    input.saltPct < HARD.saltPct.min ||
    input.saltPct > HARD.saltPct.max
  ) {
    fields.saltPct = {
      invalid: true,
      message: t(v.saltPct.hard, {
        value: input.saltPct,
        min: HARD.saltPct.min,
        max: HARD.saltPct.max,
      }),
    };
  } else if (
    input.saltPct < SOFT.saltPct.min ||
    input.saltPct > SOFT.saltPct.max
  ) {
    fields.saltPct = {
      warning: true,
      message: t(v.saltPct.soft, {
        value: input.saltPct,
        min: SOFT.saltPct.min,
        max: SOFT.saltPct.max,
      }),
    };
  }

  const flourDelta = Math.abs(input.mix.totalPct - FLOUR_TOTAL_TARGET);
  const flourTotalInvalid = flourDelta > FLOUR_TOTAL_TOLERANCE;

  if (flourTotalInvalid) {
    const dir =
      input.mix.totalPct > FLOUR_TOTAL_TARGET ? "over" : "under";
    fields.flourTotal = {
      invalid: true,
      message: t(
        dir === "over" ? v.flourTotal.over : v.flourTotal.under,
        { total: input.mix.totalPct },
      ),
    };
  }

  const hasBlocking =
    fields.totalWeight?.invalid ||
    fields.waterPct?.invalid ||
    fields.starterPct?.invalid ||
    fields.saltPct?.invalid ||
    flourTotalInvalid;

  return {
    fields,
    flourTotalInvalid,
    canCalculate: !hasBlocking,
  };
}

/** Max % for one flour row so total never exceeds 100% */
export function maxFlourPctAtIndex(pcts: number[], index: number): number {
  const others = pcts.reduce(
    (sum, p, i) => (i === index ? sum : sum + (Number.isFinite(p) ? p : 0)),
    0,
  );
  return Math.max(0, FLOUR_TOTAL_TARGET - others);
}

export function clampFlourPctAtIndex(
  pcts: number[],
  index: number,
  value: number,
): number {
  return Math.min(
    Math.max(0, value),
    maxFlourPctAtIndex(pcts, index),
  );
}

export const VALIDATION_BLOCKED_MESSAGE = v.calculateBlocked;
export const CUSTOM_FLOUR_NOTE = (total: number) =>
  t(v.customFlourNote, { total });
