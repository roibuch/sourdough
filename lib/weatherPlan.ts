import { buildFlourMix } from "./flour";
import {
  getTimelineAnchors,
  getTimelineBulkHours,
  type BuildTimelineInput,
  type TimelineAnchors,
} from "./timeline";
import {
  averageTempInWindow,
  recommendStarterFromAvgTemp,
  type ForecastItem,
} from "./weather";
import { recommendHoursToAutolyse } from "./starter";
import type { WeatherRecommendation } from "./types";

const MS_H = 3_600_000;

export interface BakingWeatherPlanInput {
  targetBakeTime?: string;
  coldRetardHours: number;
  starterPct: number;
  waterPct: number;
  roomTemp: number;
  hoursToAutolyse: number;
  flourPcts: number[];
}

export interface BakingWeatherPlan {
  starterPct: number;
  roomTemp: number;
  hoursToAutolyse: number;
  bulkHours: number;
  starterWindowAvg: number;
  bulkWindowAvg: number;
  autolyseWindowAvg: number;
  workWindowStart: number;
  workWindowEnd: number;
  hasTargetBake: boolean;
  recommendation: WeatherRecommendation;
  phaseSummary: string;
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Bulk block length tuned to forecast temp during bulk */
export function adjustBulkHoursForTemp(baseH: number, tempC: number): number {
  let h = baseH;
  if (tempC > 26) h -= 0.5 + (tempC - 26) * 0.12;
  else if (tempC < 20) h += 0.5 + (20 - tempC) * 0.18;
  return roundHalf(Math.max(3, Math.min(7, h)));
}

function buildTimelineInput(
  input: BakingWeatherPlanInput,
  overrides?: { hoursToAutolyse?: number; starterPct?: number; bulkHours?: number },
): BuildTimelineInput {
  return {
    targetBakeTime: input.targetBakeTime ?? "",
    coldRetardHours: input.coldRetardHours,
    starterPct: overrides?.starterPct ?? input.starterPct,
    waterPct: input.waterPct,
    roomTemp: input.roomTemp,
    hoursToAutolyse: overrides?.hoursToAutolyse ?? input.hoursToAutolyse,
    flourPcts: input.flourPcts,
    bulkHours: overrides?.bulkHours,
    starterPeakHours: overrides?.hoursToAutolyse,
  };
}

function anchorsFromNow(input: BakingWeatherPlanInput): TimelineAnchors {
  const mix = buildFlourMix(input.flourPcts);
  const starterPeakH = input.hoursToAutolyse;
  const bulkH = getTimelineBulkHours(input.starterPct, mix);
  const now = Date.now();
  const tStarterFeed = now;
  const tAutolyseStart = tStarterFeed + starterPeakH * MS_H;
  const tAutolyseEnd = tAutolyseStart + MS_H;
  const tBulkStart = tAutolyseEnd;
  const tBulkEnd = tBulkStart + bulkH * MS_H;
  return {
    tStarterFeed,
    tAutolyseStart,
    tAutolyseEnd,
    tBulkStart,
    tBulkEnd,
    starterPeakH,
    bulkH,
  };
}

function resolveAnchors(
  forecastList: ForecastItem[],
  input: BakingWeatherPlanInput,
): { anchors: TimelineAnchors; hasTargetBake: boolean } {
  if (input.targetBakeTime) {
    const anchors = getTimelineAnchors(buildTimelineInput(input));
    if (anchors) return { anchors, hasTargetBake: true };
  }
  return { anchors: anchorsFromNow(input), hasTargetBake: false };
}

function formatPhaseRange(startMs: number, endMs: number): string {
  const fmt = new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(new Date(startMs))} – ${fmt.format(new Date(endMs))}`;
}

/**
 * Plan starter %, room temp, hours to autolyse and bulk duration from forecast
 * across the actual work windows (starter peak → end of bulk).
 */
export function planBakingFromForecast(
  forecastList: ForecastItem[],
  input: BakingWeatherPlanInput,
): BakingWeatherPlan | null {
  if (!forecastList.length) return null;

  const mix = buildFlourMix(input.flourPcts);

  // Pass 1 — window from current recipe / target bake
  let { anchors, hasTargetBake } = resolveAnchors(forecastList, input);

  let starterWindowAvg = averageTempInWindow(
    forecastList,
    anchors.tStarterFeed,
    anchors.tAutolyseStart,
  );
  let autolyseWindowAvg = averageTempInWindow(
    forecastList,
    anchors.tAutolyseStart,
    anchors.tAutolyseEnd,
  );
  let bulkWindowAvg = averageTempInWindow(
    forecastList,
    anchors.tBulkStart,
    anchors.tBulkEnd,
  );

  if (starterWindowAvg == null || bulkWindowAvg == null) return null;
  if (autolyseWindowAvg == null) autolyseWindowAvg = starterWindowAvg;

  let hoursToAutolyse = recommendHoursToAutolyse(starterWindowAvg);
  hoursToAutolyse = roundHalf(
    Math.max(4, Math.min(10, hoursToAutolyse)),
  );

  const starterRec = recommendStarterFromAvgTemp(bulkWindowAvg);
  const starterPct = starterRec.pct;

  const baseBulkH = getTimelineBulkHours(starterPct, mix);
  let bulkHours = adjustBulkHoursForTemp(baseBulkH, bulkWindowAvg);

  const roomTemp = Math.round(
    starterWindowAvg * 0.35 + bulkWindowAvg * 0.55 + autolyseWindowAvg * 0.1,
  );

  // Pass 2 — recompute windows with adjusted hours (and target bake if set)
  if (hasTargetBake && input.targetBakeTime) {
    const refined = getTimelineAnchors(
      buildTimelineInput(input, {
        hoursToAutolyse,
        starterPct,
        bulkHours,
      }),
    );
    if (refined) {
      anchors = refined;
      starterWindowAvg =
        averageTempInWindow(
          forecastList,
          anchors.tStarterFeed,
          anchors.tAutolyseStart,
        ) ?? starterWindowAvg;
      autolyseWindowAvg =
        averageTempInWindow(
          forecastList,
          anchors.tAutolyseStart,
          anchors.tAutolyseEnd,
        ) ?? autolyseWindowAvg;
      bulkWindowAvg =
        averageTempInWindow(
          forecastList,
          anchors.tBulkStart,
          anchors.tBulkEnd,
        ) ?? bulkWindowAvg;

      hoursToAutolyse = roundHalf(
        Math.max(
          4,
          Math.min(
            10,
            recommendHoursToAutolyse(starterWindowAvg),
          ),
        ),
      );
      bulkHours = adjustBulkHoursForTemp(
        getTimelineBulkHours(starterPct, mix),
        bulkWindowAvg,
      );

      const finalAnchors = getTimelineAnchors(
        buildTimelineInput(input, {
          hoursToAutolyse,
          starterPct,
          bulkHours,
        }),
      );
      if (finalAnchors) anchors = finalAnchors;
    }
  } else {
    const starterPeakH = hoursToAutolyse;
    const now = Date.now();
    anchors = {
      tStarterFeed: now,
      tAutolyseStart: now + starterPeakH * MS_H,
      tAutolyseEnd: now + starterPeakH * MS_H + MS_H,
      tBulkStart: now + starterPeakH * MS_H + MS_H,
      tBulkEnd: now + starterPeakH * MS_H + MS_H + bulkHours * MS_H,
      starterPeakH,
      bulkH: bulkHours,
    };
  }

  const recommendation = recommendStarterFromAvgTemp(bulkWindowAvg);
  const windowLabel = hasTargetBake
    ? "לוח האפייה שלכם"
    : "מהרגע הנוכחי (הגדירו זמן יעד ללוח מדויק יותר)";

  const phaseSummary =
    `תכנון לפי ${windowLabel}: ` +
    `האכלה ${starterWindowAvg.toFixed(1)}°C (${formatPhaseRange(anchors.tStarterFeed, anchors.tAutolyseStart)}), ` +
    `אוטוליזה ${autolyseWindowAvg.toFixed(1)}°C, ` +
    `Bulk ${bulkWindowAvg.toFixed(1)}°C (${formatPhaseRange(anchors.tBulkStart, anchors.tBulkEnd)}). ` +
    `מומלץ: ${starterPct}% מחמצת, ${hoursToAutolyse} שעות עד אוטוליזה, Bulk ~${bulkHours} שעות.`;

  recommendation.body =
    `${recommendation.body} ${phaseSummary}`;

  return {
    starterPct,
    roomTemp,
    hoursToAutolyse,
    bulkHours,
    starterWindowAvg,
    bulkWindowAvg,
    autolyseWindowAvg,
    workWindowStart: anchors.tStarterFeed,
    workWindowEnd: anchors.tBulkEnd,
    hasTargetBake,
    recommendation,
    phaseSummary,
  };
}
