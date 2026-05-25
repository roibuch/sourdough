/**
 * Professional sourdough fermentation timing (starter peak + bulk block).
 *
 * Calibrated to published ranges:
 * - Starter peaks @ 22°C: King Arthur, sourdoughratio.com, SourdoughTalk (1:1:1 → 4–6h … 1:5:5 → 10–14h)
 * - Bulk @ ~50% rise for scheduling: The Sourdough Journey timetables (20% inoculation, 68–74°F)
 * - Temperature: ~15% rate change per °C (Q10-style), aligned with fermentationTemp.ts
 */

import { FERMENTATION_RATE_PER_C } from "@/lib/scheduling/fermentationTemp";
import { pctOf } from "@/lib/flour";
import type { FlourMix } from "@/lib/types";

export const REFERENCE_TEMP_C = 22;
export const REFERENCE_STARTER_PCT = 20;

/** Peak time (h) at 22°C for mature starter fed 1:a:a (midpoint of common guides). */
export const STARTER_PEAK_HOURS_AT_REF: Record<number, number> = {
  1: 5,
  2: 7,
  3: 9,
  4: 11,
  5: 12,
};

const STARTER_RATIO_NOTES: Record<number, string> = {
  1: "1:1:1 — שיא בכ־4–6 שעות ב־22°C; מתאים לאפייה באותו יום.",
  2: "1:2:2 — שיא בכ־6–8 שעות; האכלת ערב → בוקר נפוצה.",
  3: "1:3:3 — שיא בכ־8–10 שעות; יציב לרוב המאפים הביתיים.",
  4: "1:4:4 — שיא בכ־10–12 שעות; דילול גבוה לחלון ארוך.",
  5: "1:5:5 — שיא בכ־10–14 שעות; האכלה לילית / מטבח קריר.",
};

/** Bulk hours to ~50% rise @ 22°C, 20% starter (TSJ-style, scaled for shaping target). */
const BULK_HOURS_50PCT_AT_REF = 7.5;

const STARTER_INOCULATION_EXP = 0.85;

export function roundTimingHours(h: number): number {
  return Math.round(h * 2) / 2;
}

export function adjustHoursForTemperature(
  hoursAtRefC: number,
  tempC: number,
  refTempC: number = REFERENCE_TEMP_C,
): number {
  if (!Number.isFinite(hoursAtRefC) || hoursAtRefC <= 0) return hoursAtRefC;
  const t = Number.isFinite(tempC) ? tempC : REFERENCE_TEMP_C;
  return (
    hoursAtRefC * Math.pow(FERMENTATION_RATE_PER_C, refTempC - t)
  );
}

/** Expected peak after feeding 1:a:a at room temperature. */
export function starterPeakHours(
  feedMultiplier: number,
  tempC: number = REFERENCE_TEMP_C,
): number {
  const a = Math.max(1, Math.min(5, Math.round(feedMultiplier)));
  const base = STARTER_PEAK_HOURS_AT_REF[a] ?? 12;
  return roundTimingHours(adjustHoursForTemperature(base, tempC));
}

export interface PickedStarterRatio {
  flourMult: number;
  waterMult: number;
  a: number;
  peakHours: number;
  note: string;
}

/**
 * Pick the most diluted feed that still peaks before `hoursUntilUse`.
 * Prefers a longer, milder feed when multiple ratios fit.
 */
export function pickStarterFeedRatio(
  hoursUntilUse: number,
  tempC: number = REFERENCE_TEMP_C,
): PickedStarterRatio {
  const targetH = Math.max(1.5, hoursUntilUse);
  let bestA = 1;
  let bestPeak = starterPeakHours(1, tempC);

  for (let a = 1; a <= 5; a++) {
    const peak = starterPeakHours(a, tempC);
    if (peak <= targetH + 0.35) {
      bestA = a;
      bestPeak = peak;
    }
  }

  return {
    a: bestA,
    flourMult: bestA,
    waterMult: bestA,
    peakHours: bestPeak,
    note: STARTER_RATIO_NOTES[bestA] ?? STARTER_RATIO_NOTES[5],
  };
}

function flourBulkFactor(mix: FlourMix): number {
  const whole = pctOf(mix, "wholeWheat") + pctOf(mix, "wholeRye");
  let f = 1;
  if (whole > 15) f += 0.08;
  if (whole > 35) f += 0.1;
  const rye = pctOf(mix, "wholeRye");
  if (rye >= 20) f += 0.06;
  return f;
}

export interface BulkTimingOptions {
  /** 0.5 ≈ schedule to preshape; 0.75 ≈ guidance upper range */
  riseFraction?: number;
}

/**
 * Estimated bulk fermentation block (hours) from inoculation % and dough/room temp.
 */
export function estimateBulkFermentationHours(
  starterPct: number,
  tempC: number = REFERENCE_TEMP_C,
  mix?: FlourMix,
  options?: BulkTimingOptions,
): number {
  const sp = Math.max(5, Math.min(40, starterPct || REFERENCE_STARTER_PCT));
  const t = Number.isFinite(tempC) ? tempC : REFERENCE_TEMP_C;
  const rise = options?.riseFraction ?? 1;

  let hours =
    BULK_HOURS_50PCT_AT_REF *
    Math.pow(REFERENCE_STARTER_PCT / sp, STARTER_INOCULATION_EXP) *
    adjustHoursForTemperature(1, t) *
    rise;

  if (mix) hours *= flourBulkFactor(mix);

  return roundTimingHours(Math.max(2.5, Math.min(18, hours)));
}

/** Invert bulk estimate for starter % suggestion (scheduling bypass). */
export function starterPctForBulkHours(
  targetBulkHours: number,
  tempC: number = REFERENCE_TEMP_C,
  mix?: FlourMix,
  riseFraction = 1,
): number {
  let effectiveTarget = targetBulkHours;
  if (mix) {
    const ff = flourBulkFactor(mix);
    if (ff > 0) effectiveTarget /= ff;
  }
  const tempFactor = adjustHoursForTemperature(1, tempC);
  const riseScale = riseFraction;
  const scale =
    (BULK_HOURS_50PCT_AT_REF * tempFactor * riseScale) / effectiveTarget;
  const pct = REFERENCE_STARTER_PCT * Math.pow(scale, 1 / STARTER_INOCULATION_EXP);
  return Math.round(Math.max(5, Math.min(40, pct)) * 10) / 10;
}

/** Hours from feed until starter is ready — matches pickStarterFeedRatio peak. */
export function hoursUntilStarterPeak(
  hoursToAutolyse: number,
  tempC: number,
  feedMultiplier?: number,
): number {
  if (feedMultiplier != null && feedMultiplier > 0) {
    return starterPeakHours(feedMultiplier, tempC);
  }
  return pickStarterFeedRatio(hoursToAutolyse, tempC).peakHours;
}

/** Suggested feed lead time from forecast / room temperature. */
export function recommendHoursToAutolyseFromTemp(avgTempC: number): number {
  const peak = starterPeakHours(3, avgTempC);
  return roundTimingHours(Math.max(4, Math.min(14, peak)));
}
