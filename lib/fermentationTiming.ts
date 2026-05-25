/**
 * Fermentation timing for schedules — built on {@link ./sourdoughFermentation}
 * with flour-mix bulk adjustments for the app timeline.
 */

import { pctOf } from "@/lib/flour";
import {
  adjustHoursForTemperature as adjustHoursQ10,
  getBaseBulkFermentationHours,
  getTimeToPeakHours,
  pickFeedingRatioForWindow,
  recommendFeedingRatio,
  roundFermentationHours,
  REFERENCE_TEMP_C,
} from "@/lib/sourdoughFermentation";
import type { FlourMix } from "@/lib/types";

export {
  Q10_SOURDOUGH,
  REFERENCE_TEMP_C,
  adjustFermentationTimeQ10,
  calculateAutolyseStartTime,
  getBaseBulkFermentationHours,
  getBaseTimeToPeakHours,
  getBulkFermentationHours,
  getTimeToPeakHours,
  recommendFeedingRatio,
} from "@/lib/sourdoughFermentation";

export const REFERENCE_STARTER_PCT = 20;

/** @deprecated Use PEAK table in sourdoughFermentation — kept for tests */
export const STARTER_PEAK_HOURS_AT_REF: Record<number, number> = {
  1: 4.0,
  2: 6.0,
  3: 7.5,
  4: 9.0,
  5: 11.0,
  6: 13.0,
};

export const STARTER_READY_BUFFER_H = 0.5;

const STARTER_RATIO_NOTES: Record<number, string> = {
  1: "1:1:1 — שיא בכ־4 שעות ב־22°C; מתאים לאפייה באותו יום.",
  2: "1:2:2 — שיא בכ־6 שעות; האכלת ערב → בוקר נפוצה.",
  3: "1:3:3 — שיא בכ־7.5 שעות; יציב לרוב המאפים הביתיים.",
  4: "1:4:4 — שיא בכ־9 שעות; דילול גבוה לחלון ארוך.",
  5: "1:5:5 — שיא בכ־11 שעות; האכלה לילית.",
  6: "1:6:6 — שיא בכ־13 שעות; חלון לילה ארוך.",
};

const STARTER_INOCULATION_EXP = 0.85;

export function roundTimingHours(h: number): number {
  return roundFermentationHours(h);
}

/** Adjust hours from 22°C reference to target temp (Q10 = 2.1). */
export function adjustHoursForTemperature(
  hoursAtRefC: number,
  tempC: number,
  refTempC: number = REFERENCE_TEMP_C,
): number {
  return adjustHoursQ10(hoursAtRefC, tempC, refTempC).hours;
}

export function starterPeakHours(
  feedMultiplier: number,
  tempC: number = REFERENCE_TEMP_C,
): number {
  return getTimeToPeakHours(feedMultiplier, tempC).hours;
}

export interface PickedStarterRatio {
  flourMult: number;
  waterMult: number;
  a: number;
  peakHours: number;
  note: string;
}

export function pickStarterFeedRatio(
  hoursUntilAutolyse: number,
  tempC: number = REFERENCE_TEMP_C,
): PickedStarterRatio {
  const picked = pickFeedingRatioForWindow(
    hoursUntilAutolyse,
    tempC,
    STARTER_READY_BUFFER_H,
  );
  const a = picked.ratio.flourMultiplier;
  return {
    a,
    flourMult: a,
    waterMult: picked.ratio.waterMultiplier,
    peakHours: picked.peakHours,
    note: STARTER_RATIO_NOTES[a] ?? STARTER_RATIO_NOTES[6],
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
  riseFraction?: number;
}

export function estimateBulkFermentationHours(
  starterPct: number,
  tempC: number = REFERENCE_TEMP_C,
  mix?: FlourMix,
  options?: BulkTimingOptions,
): number {
  const rise = options?.riseFraction ?? 1;
  let hours = getBaseBulkFermentationHours(starterPct);
  hours = adjustHoursForTemperature(hours, tempC) * rise;
  if (mix) hours *= flourBulkFactor(mix);
  return roundTimingHours(Math.max(2.5, Math.min(18, hours)));
}

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
  const baseAtRef = getBaseBulkFermentationHours(REFERENCE_STARTER_PCT);
  const scale = (baseAtRef * tempFactor * riseFraction) / effectiveTarget;
  const pct =
    REFERENCE_STARTER_PCT * Math.pow(scale, 1 / STARTER_INOCULATION_EXP);
  return Math.round(Math.max(5, Math.min(40, pct)) * 10) / 10;
}

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

export function recommendHoursToAutolyseFromTemp(avgTempC: number): number {
  const rec = recommendFeedingRatio(8, avgTempC);
  return roundTimingHours(
    Math.max(4, Math.min(14, rec.peakHoursAtTemp + STARTER_READY_BUFFER_H)),
  );
}
