/**
 * Core sourdough fermentation biology — time-to-peak, Q10 temperature adjustment,
 * bulk fermentation, autolyse scheduling, and feeding-ratio recommendations.
 *
 * Reference temperature: 22°C. Q10 multiplier: 2.1.
 */

/** Reference temperature (°C) for all base tables. */
export const REFERENCE_TEMP_C = 22;

/** Sourdough fermentation Q10 (rate doubles ~every 10°C). */
export const Q10_SOURDOUGH = 2.1;

/** Practical home-baking temperature range for warnings. */
export const TEMP_COMFORT_MIN_C = 18;
export const TEMP_COMFORT_MAX_C = 28;

/** 1 : flour : water multipliers (hydration 100% feed). */
export interface FeedingRatio {
  flourMultiplier: number;
  waterMultiplier: number;
}

export interface TemperatureAdjustmentResult {
  hours: number;
  /** Set when target temp is outside 18–28°C. */
  tempWarning?: string;
}

export interface RecommendedFeedingRatio {
  ratio: FeedingRatio;
  /** e.g. "1 : 3 : 3" */
  label: string;
  /** Peak time (h) at the requested temperature after Q10 adjustment. */
  peakHoursAtTemp: number;
  /** Optional second choice (e.g. 1:4:4 for ~8h windows). */
  alternate?: {
    ratio: FeedingRatio;
    label: string;
    peakHoursAtTemp: number;
  };
}

/** Base time to peak (hours) @ 22°C for 1:a:a feeds. */
const PEAK_HOURS_AT_22C: Readonly<Record<number, number>> = {
  1: 4.0,
  2: 6.0,
  3: 7.5,
  4: 9.0,
  5: 11.0,
  6: 13.0,
};

const PEAK_RATIO_ANCHORS = [1, 2, 3, 4, 5, 6] as const;

/** Bulk time (h) @ 22°C targeting ~30–50% volume rise. */
const BULK_HOURS_AT_22C: Readonly<{ starterPct: number; hours: number }[]> = [
  { starterPct: 10, hours: 7.0 },
  { starterPct: 15, hours: 6.0 },
  { starterPct: 20, hours: 5.0 },
  { starterPct: 25, hours: 4.0 },
];

let lastTempWarningKey = "";

function warnTemperatureOnce(tempC: number, context: string): string | undefined {
  if (tempC >= TEMP_COMFORT_MIN_C && tempC <= TEMP_COMFORT_MAX_C) {
    return undefined;
  }
  const msg = `[sourdoughFermentation] ${context}: ${tempC}°C is outside the typical ${TEMP_COMFORT_MIN_C}–${TEMP_COMFORT_MAX_C}°C range; results are extrapolated.`;
  const key = `${context}:${Math.round(tempC)}`;
  if (typeof console !== "undefined" && key !== lastTempWarningKey) {
    console.warn(msg);
    lastTempWarningKey = key;
  }
  return msg;
}

export function roundFermentationHours(h: number): number {
  return Math.round(h * 2) / 2;
}

/**
 * Linear interpolation on sorted anchor points.
 */
function interpolateAnchors(
  anchors: { x: number; y: number }[],
  x: number,
): number {
  if (!anchors.length) return 0;
  const sorted = [...anchors].sort((a, b) => a.x - b.x);
  if (x <= sorted[0].x) return sorted[0].y;
  if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
  }
  return sorted[sorted.length - 1].y;
}

function normalizeRatioMultiplier(ratio: number | FeedingRatio): number {
  if (typeof ratio === "number") {
    return Math.max(1, Math.min(6, ratio));
  }
  return Math.max(1, Math.min(6, ratio.flourMultiplier));
}

function formatRatioLabel(ratio: FeedingRatio): string {
  if (ratio.flourMultiplier === ratio.waterMultiplier) {
    return `1 : ${ratio.flourMultiplier} : ${ratio.waterMultiplier}`;
  }
  return `1 : ${ratio.flourMultiplier} : ${ratio.waterMultiplier}`;
}

// ─── 1. Time to peak @ 22°C ───────────────────────────────────────────────

/**
 * Base hours until starter peak at 22°C for feed ratio 1:a:a (or explicit multipliers).
 */
export function getBaseTimeToPeakHours(ratio: number | FeedingRatio): number {
  const a = normalizeRatioMultiplier(ratio);
  const anchors = PEAK_RATIO_ANCHORS.map((k) => ({
    x: k,
    y: PEAK_HOURS_AT_22C[k],
  }));
  return roundFermentationHours(interpolateAnchors(anchors, a));
}

// ─── 2. Q10 temperature adjustment ─────────────────────────────────────────

/**
 * Adjust fermentation time from T1 to T2 using Q10.
 * Formula: t2 = t1 × (Q10 ^ ((T1 − T2) / 10))
 */
export function adjustFermentationTimeQ10(
  timeHoursAtT1: number,
  t1C: number,
  t2C: number,
  q10: number = Q10_SOURDOUGH,
): number {
  if (!Number.isFinite(timeHoursAtT1) || timeHoursAtT1 <= 0) return timeHoursAtT1;
  if (!Number.isFinite(t1C) || !Number.isFinite(t2C)) return timeHoursAtT1;
  const factor = Math.pow(q10, (t1C - t2C) / 10);
  return timeHoursAtT1 * factor;
}

/**
 * Adjust hours from reference temp (default 22°C) to a target temperature.
 * Includes optional comfort-range warning.
 */
export function adjustHoursForTemperature(
  hoursAtRefC: number,
  targetTempC: number,
  refTempC: number = REFERENCE_TEMP_C,
): TemperatureAdjustmentResult {
  const warning = warnTemperatureOnce(
    targetTempC,
    "adjustHoursForTemperature",
  );
  const hours = adjustFermentationTimeQ10(hoursAtRefC, refTempC, targetTempC);
  return {
    hours: roundFermentationHours(hours),
    tempWarning: warning,
  };
}

// ─── 3. Bulk fermentation ───────────────────────────────────────────────────

/**
 * Base bulk fermentation hours @ 22°C for a given starter % (baker's inoculation).
 * Interpolates between 10%, 15%, 20%, 25% anchors.
 */
export function getBaseBulkFermentationHours(starterPct: number): number {
  const pct = Math.max(5, Math.min(40, starterPct));
  const anchors = BULK_HOURS_AT_22C.map((row) => ({
    x: row.starterPct,
    y: row.hours,
  }));
  return roundFermentationHours(interpolateAnchors(anchors, pct));
}

/**
 * Bulk fermentation hours at an arbitrary dough temperature (Q10 from 22°C).
 */
export function getBulkFermentationHours(
  starterPct: number,
  doughTempC: number = REFERENCE_TEMP_C,
): TemperatureAdjustmentResult {
  const base = getBaseBulkFermentationHours(starterPct);
  return adjustHoursForTemperature(base, doughTempC);
}

// ─── 4. Autolyse start time ─────────────────────────────────────────────────

export interface AutolyseStartInput {
  /** When the starter is expected to reach peak (ready to mix into dough). */
  expectedStarterPeakTime: Date;
  /** Autolyse duration — provide hours and/or minutes. */
  autolyseDurationHours?: number;
  autolyseDurationMinutes?: number;
}

/**
 * When to mix flour + water: peak time minus autolyse duration.
 */
export function calculateAutolyseStartTime(input: AutolyseStartInput): Date {
  const peakMs = input.expectedStarterPeakTime.getTime();
  if (Number.isNaN(peakMs)) {
    throw new RangeError("expectedStarterPeakTime is invalid");
  }

  const hours = input.autolyseDurationHours ?? 0;
  const minutes = input.autolyseDurationMinutes ?? 0;
  const totalMs = (hours * 60 + minutes) * 60 * 1000;

  if (totalMs <= 0) {
    throw new RangeError(
      "autolyse duration must be positive (hours or minutes)",
    );
  }

  return new Date(peakMs - totalMs);
}

/**
 * Convenience: peak = feedTime + timeToPeakHours.
 */
export function expectedPeakTimeFromFeed(
  feedTime: Date,
  timeToPeakHours: number,
): Date {
  return new Date(feedTime.getTime() + timeToPeakHours * 3_600_000);
}

// ─── 5. Feeding ratio recommendation ───────────────────────────────────────

/**
 * Time to peak at temperature for ratio 1:a:a.
 */
export function getTimeToPeakHours(
  ratio: number | FeedingRatio,
  tempC: number = REFERENCE_TEMP_C,
  refTempC: number = REFERENCE_TEMP_C,
): TemperatureAdjustmentResult {
  const base = getBaseTimeToPeakHours(ratio);
  return adjustHoursForTemperature(base, tempC, refTempC);
}

/**
 * Recommend 1:a:a feeding ratio for a desired hours-until-mix window @ 22°C baseline,
 * then adjust peak estimate for `tempC` via Q10.
 */
export function recommendFeedingRatio(
  desiredHoursUntilMix: number,
  tempC: number = REFERENCE_TEMP_C,
): RecommendedFeedingRatio {
  const targetH = Math.max(2, desiredHoursUntilMix);
  const warning = warnTemperatureOnce(tempC, "recommendFeedingRatio");

  let flourMult = 2;
  let alternate: RecommendedFeedingRatio["alternate"];

  if (targetH <= 6.5) {
    flourMult = 2;
  } else if (targetH <= 8.5) {
    flourMult = 3;
    alternate = buildAlternate(4, tempC);
  } else if (targetH <= 10.5) {
    flourMult = 5;
    alternate = buildAlternate(4, tempC);
  } else {
    flourMult = 6;
  }

  const ratio: FeedingRatio = { flourMultiplier: flourMult, waterMultiplier: flourMult };
  const peak = getTimeToPeakHours(ratio, tempC);

  const result: RecommendedFeedingRatio = {
    ratio,
    label: formatRatioLabel(ratio),
    peakHoursAtTemp: peak.hours,
    alternate,
  };

  if (warning && !peak.tempWarning) {
    peak.tempWarning = warning;
  }

  return result;
}

function buildAlternate(
  flourMult: number,
  tempC: number,
): RecommendedFeedingRatio["alternate"] {
  const ratio: FeedingRatio = {
    flourMultiplier: flourMult,
    waterMultiplier: flourMult,
  };
  return {
    ratio,
    label: formatRatioLabel(ratio),
    peakHoursAtTemp: getTimeToPeakHours(ratio, tempC).hours,
  };
}

/**
 * Pick the most diluted ratio (max a) whose peak at `tempC` fits within
 * `hoursUntilMix` minus an optional safety buffer (default 0.5h).
 */
export function pickFeedingRatioForWindow(
  hoursUntilMix: number,
  tempC: number = REFERENCE_TEMP_C,
  readyBufferHours = 0.5,
): RecommendedFeedingRatio & { peakHours: number } {
  const latestPeak = Math.max(1, hoursUntilMix - readyBufferHours);
  let bestA = 1;
  let bestPeak = getTimeToPeakHours(1, tempC).hours;

  for (const a of PEAK_RATIO_ANCHORS) {
    const peak = getTimeToPeakHours(a, tempC).hours;
    if (peak <= latestPeak + 0.01) {
      bestA = a;
      bestPeak = peak;
    }
  }

  const ratio: FeedingRatio = {
    flourMultiplier: bestA,
    waterMultiplier: bestA,
  };

  return {
    ratio,
    label: formatRatioLabel(ratio),
    peakHoursAtTemp: bestPeak,
    peakHours: bestPeak,
  };
}
