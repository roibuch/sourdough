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

/** Hard bounds (match SmartNumberInput) */
const HARD = {
  waterPct: { min: 1, max: 120 },
  starterPct: { min: 1, max: 80 },
  saltPct: { min: 0.5, max: 5 },
} as const;

/** Soft guidance — visual warning, calculation still allowed */
const SOFT = {
  waterPct: { min: 55, max: 90, label: "מים" },
  starterPct: { min: 10, max: 30, label: "מחמצת" },
  saltPct: { min: 1.8, max: 2.4, label: "מלח" },
} as const;

function softMessage(
  label: string,
  min: number,
  max: number,
  value: number,
): string {
  return `${label} ${value}% — טווח נוח בדרך כלל ${min}–${max}%`;
}

export function validateRecipeForm(
  input: RecipeValidationInput,
): RecipeValidation {
  const fields: RecipeValidation["fields"] = {};

  const w = parseFloat(input.totalWeight);
  if (!input.totalWeight.trim() || Number.isNaN(w) || w <= 0) {
    fields.totalWeight = {
      invalid: true,
      message: "הזינו משקל בצק סופי חיובי (גרם).",
    };
  } else if (w > 10000) {
    fields.totalWeight = {
      invalid: true,
      message: "משקל גבוה מאוד — בדקו שהערך בגרם.",
    };
  }

  if (
    input.waterPct < HARD.waterPct.min ||
    input.waterPct > HARD.waterPct.max
  ) {
    fields.waterPct = {
      invalid: true,
      message: `מים: ${input.waterPct}% — חייב להיות בין ${HARD.waterPct.min}% ל־${HARD.waterPct.max}%.`,
    };
  } else if (
    input.waterPct < SOFT.waterPct.min ||
    input.waterPct > SOFT.waterPct.max
  ) {
    fields.waterPct = {
      warning: true,
      message: softMessage(
        SOFT.waterPct.label,
        SOFT.waterPct.min,
        SOFT.waterPct.max,
        input.waterPct,
      ),
    };
  }

  if (
    input.starterPct < HARD.starterPct.min ||
    input.starterPct > HARD.starterPct.max
  ) {
    fields.starterPct = {
      invalid: true,
      message: `מחמצת: ${input.starterPct}% — חייב להיות בין ${HARD.starterPct.min}% ל־${HARD.starterPct.max}%.`,
    };
  } else if (
    input.starterPct < SOFT.starterPct.min ||
    input.starterPct > SOFT.starterPct.max
  ) {
    fields.starterPct = {
      warning: true,
      message: softMessage(
        SOFT.starterPct.label,
        SOFT.starterPct.min,
        SOFT.starterPct.max,
        input.starterPct,
      ),
    };
  }

  if (
    input.saltPct < HARD.saltPct.min ||
    input.saltPct > HARD.saltPct.max
  ) {
    fields.saltPct = {
      invalid: true,
      message: `מלח: ${input.saltPct}% — חייב להיות בין ${HARD.saltPct.min}% ל־${HARD.saltPct.max}%.`,
    };
  } else if (
    input.saltPct < SOFT.saltPct.min ||
    input.saltPct > SOFT.saltPct.max
  ) {
    fields.saltPct = {
      warning: true,
      message: softMessage(
        SOFT.saltPct.label,
        SOFT.saltPct.min,
        SOFT.saltPct.max,
        input.saltPct,
      ),
    };
  }

  const flourDelta = Math.abs(input.mix.totalPct - FLOUR_TOTAL_TARGET);
  const flourTotalInvalid = flourDelta > FLOUR_TOTAL_TOLERANCE;

  if (flourTotalInvalid) {
    const dir =
      input.mix.totalPct > FLOUR_TOTAL_TARGET ? "מעל" : "מתחת";
    fields.flourTotal = {
      invalid: true,
      message: `סך הקמחים ${input.mix.totalPct}% — ${dir} ל־100%.`,
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
