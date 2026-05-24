/**
 * Dough fermentation rate vs temperature (~15% speed change per °C).
 *
 *   adjustedTime = baseTime × 1.15^(baseTemp − targetTemp)
 *   targetTemp   = baseTemp − log(targetTime / baseTime) / log(1.15)
 */

import { heContent, t } from "@/lib/content";
import { buildFlourMix, pctOf } from "@/lib/flour";
import { getTimelineBulkHours } from "@/lib/timeline";
import type { FlourMix } from "@/lib/types";

export const FERMENTATION_RATE_PER_C = 1.15;
export const MIN_DOUGH_TEMP_C = 4;
export const MAX_DOUGH_TEMP_C = 30;

const LN_RATE = Math.log(FERMENTATION_RATE_PER_C);
const sch = heContent.scheduling.adaptations;

export interface FermentationTempBounds {
  minC: number;
  maxC: number;
}

export const DOUGH_TEMP_BOUNDS: FermentationTempBounds = {
  minC: MIN_DOUGH_TEMP_C,
  maxC: MAX_DOUGH_TEMP_C,
};

export function isDoughTempInSafeRange(tempC: number): boolean {
  return (
    Number.isFinite(tempC) &&
    tempC >= MIN_DOUGH_TEMP_C &&
    tempC <= MAX_DOUGH_TEMP_C
  );
}

/**
 * Duration at `targetTempC` given baseline duration at `baseTempC`.
 */
export function calculateAdjustedTime(
  baseTimeHours: number,
  baseTempC: number,
  targetTempC: number,
): number {
  if (!Number.isFinite(baseTimeHours) || baseTimeHours <= 0) {
    throw new RangeError("baseTimeHours must be a positive finite number");
  }
  if (!Number.isFinite(baseTempC) || !Number.isFinite(targetTempC)) {
    throw new RangeError("temperatures must be finite numbers");
  }
  const adjusted =
    baseTimeHours *
    Math.pow(FERMENTATION_RATE_PER_C, baseTempC - targetTempC);
  return Math.round(adjusted * 100) / 100;
}

/**
 * Dough temperature (°C) needed to reach `targetTimeHours` from `baseTimeHours` at `baseTempC`.
 */
export function calculateRequiredTemp(
  baseTimeHours: number,
  baseTempC: number,
  targetTimeHours: number,
): number {
  if (!Number.isFinite(baseTimeHours) || baseTimeHours <= 0) {
    throw new RangeError("baseTimeHours must be a positive finite number");
  }
  if (!Number.isFinite(targetTimeHours) || targetTimeHours <= 0) {
    throw new RangeError("targetTimeHours must be a positive finite number");
  }
  if (!Number.isFinite(baseTempC)) {
    throw new RangeError("baseTempC must be finite");
  }
  if (Math.abs(targetTimeHours - baseTimeHours) < 1e-9) {
    return Math.round(baseTempC * 10) / 10;
  }
  const targetTempC =
    baseTempC - Math.log(targetTimeHours / baseTimeHours) / LN_RATE;
  return Math.round(targetTempC * 10) / 10;
}

export function clampDoughTemp(tempC: number): number {
  return (
    Math.round(
      Math.min(MAX_DOUGH_TEMP_C, Math.max(MIN_DOUGH_TEMP_C, tempC)) * 10,
    ) / 10
  );
}

/**
 * Inverse of `getTimelineBulkHours` (ignoring whole-grain tweak) for starter % suggestion.
 */
export function calculateRequiredStarterPct(
  targetBulkHours: number,
  mix: FlourMix,
): number {
  const whole = pctOf(mix, "wholeWheat") + pctOf(mix, "wholeRye");
  let h = targetBulkHours;
  if (whole > 15) h += 0.5;
  const pct = 15 + (6 - h) / 0.2;
  return Math.round(Math.max(5, Math.min(35, pct)) * 10) / 10;
}

export type FermentationBypassStrategy = "temperature" | "starter";

export interface BlackoutFermentationSuggestion {
  strategy: FermentationBypassStrategy;
  baseBulkHours: number;
  targetBulkHours: number;
  bypassDelayHours: number;
  baseTempC: number;
  requiredDoughTempC?: number;
  waterTempDeltaC?: number;
  suggestedStarterPct?: number;
  currentStarterPct?: number;
  freeStartMs: number;
}

export interface SuggestBlackoutBypassParams {
  blockStartMs: number;
  freeStartMs: number;
  baseBulkHours: number;
  baseTempC: number;
  starterPct: number;
  flourPcts: number[];
}

export function suggestBlackoutFermentationBypass(
  params: SuggestBlackoutBypassParams,
): BlackoutFermentationSuggestion | null {
  const {
    blockStartMs,
    freeStartMs,
    baseBulkHours,
    baseTempC,
    starterPct,
    flourPcts,
  } = params;

  const bypassDelayHours = (freeStartMs - blockStartMs) / 3_600_000;
  if (bypassDelayHours <= 1 / 60) return null;

  const targetBulkHours =
    Math.round((baseBulkHours + bypassDelayHours) * 10) / 10;
  if (targetBulkHours <= baseBulkHours + 0.02) return null;

  const requiredTemp = calculateRequiredTemp(
    baseBulkHours,
    baseTempC,
    targetBulkHours,
  );

  const mix = buildFlourMix(flourPcts);
  const base: Omit<
    BlackoutFermentationSuggestion,
    "strategy" | "requiredDoughTempC" | "suggestedStarterPct"
  > = {
    baseBulkHours,
    targetBulkHours,
    bypassDelayHours: Math.round(bypassDelayHours * 10) / 10,
    baseTempC,
    freeStartMs,
  };

  if (isDoughTempInSafeRange(requiredTemp)) {
    return {
      ...base,
      strategy: "temperature",
      requiredDoughTempC: requiredTemp,
      waterTempDeltaC: Math.round((requiredTemp - baseTempC) * 10) / 10,
    };
  }

  const suggestedStarterPct = calculateRequiredStarterPct(targetBulkHours, mix);

  return {
    ...base,
    strategy: "starter",
    suggestedStarterPct,
    currentStarterPct: starterPct,
    requiredDoughTempC: requiredTemp,
  };
}

export function formatBlackoutBypassMessage(
  suggestion: BlackoutFermentationSuggestion,
  blackoutLabel: string,
  freeTimeLabel: string,
): { title: string; message: string } {
  if (suggestion.strategy === "temperature" && suggestion.requiredDoughTempC != null) {
    const delta = suggestion.waterTempDeltaC ?? 0;
    const title = sch.doughTempBypass.title;
    if (delta < -0.05) {
      return {
        title,
        message: t(sch.doughTempBypass.messageLower, {
          blackout: blackoutLabel,
          freeTime: freeTimeLabel,
          temp: suggestion.requiredDoughTempC.toFixed(1),
          baseTemp: suggestion.baseTempC.toFixed(1),
          targetBulk: suggestion.targetBulkHours.toFixed(1),
          baseBulk: suggestion.baseBulkHours.toFixed(1),
        }),
      };
    }
    if (delta > 0.05) {
      return {
        title,
        message: t(sch.doughTempBypass.messageRaise, {
          temp: suggestion.requiredDoughTempC.toFixed(1),
          targetBulk: suggestion.targetBulkHours.toFixed(1),
        }),
      };
    }
    return {
      title,
      message: t(sch.doughTempBypass.messageSame, {
        temp: suggestion.requiredDoughTempC.toFixed(1),
        targetBulk: suggestion.targetBulkHours.toFixed(1),
      }),
    };
  }

  return {
    title: sch.starterBypass.title,
    message: t(sch.starterBypass.message, {
      temp: suggestion.requiredDoughTempC?.toFixed(1) ?? "—",
      min: MIN_DOUGH_TEMP_C,
      max: MAX_DOUGH_TEMP_C,
      blackout: blackoutLabel,
      freeTime: freeTimeLabel,
      current: suggestion.currentStarterPct ?? 0,
      suggested: suggestion.suggestedStarterPct ?? 0,
      targetBulk: suggestion.targetBulkHours.toFixed(1),
    }),
  };
}
