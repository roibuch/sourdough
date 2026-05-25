/** Starter feed math — professional peak-time model */

import type { StarterRatioPreset } from "./expressMode";
import { STARTER_RATIO_OPTIONS } from "./expressMode";
import {
  adjustHoursForTemperature,
  hoursUntilStarterPeak,
  pickStarterFeedRatio,
  recommendHoursToAutolyseFromTemp,
  roundTimingHours,
  starterPeakHours,
} from "./fermentationTiming";

export interface RatioPick {
  a: number;
  flourMult: number;
  waterMult: number;
  note: string;
  peakHours: number;
}

export interface StarterFeedInput {
  needG: number;
  keepInJarG: number;
  roomTempC: number;
  hoursToAutolyse: number;
  ratioPreset?: StarterRatioPreset;
}

export interface StarterFeedResult {
  ratioA: number;
  ratioLabel: string;
  ratioNote: string;
  effectiveHours: number;
  expectedPeakHours: number;
  seedG: number;
  flourAddG: number;
  waterAddG: number;
  totalMixG: number;
  explain: string;
}

/** @deprecated Use pickStarterFeedRatio — kept for tests / legacy imports */
export function effectiveHoursForRatio(hours: number, tempC: number): number {
  return hoursUntilStarterPeak(hours, tempC);
}

/** Pick 1:a:a ratio so peak aligns with hours until autolyse */
export function pickRatio(hoursUntilUse: number, tempC: number): RatioPick {
  const picked = pickStarterFeedRatio(hoursUntilUse, tempC);
  return {
    a: picked.a,
    flourMult: picked.flourMult,
    waterMult: picked.waterMult,
    note: picked.note,
    peakHours: picked.peakHours,
  };
}

function ratioFromPreset(
  preset: StarterRatioPreset,
  tempC: number,
): RatioPick | null {
  const def = STARTER_RATIO_OPTIONS.find((r) => r.id === preset);
  if (!def || preset === "auto") return null;
  if (preset === "peak") {
    return {
      a: 0,
      flourMult: 0,
      waterMult: 0,
      note: def.note,
      peakHours: def.typicalPeakHours,
    };
  }
  if (preset === "half") {
    return {
      a: 0.5,
      flourMult: 0.5,
      waterMult: 0.5,
      note: def.note,
      peakHours: roundTimingHours(adjustHoursForTemperature(3.5, tempC)),
    };
  }
  const mult = def.flourMult;
  return {
    a: mult,
    flourMult: mult,
    waterMult: def.waterMult,
    note: def.note,
    peakHours: starterPeakHours(Math.max(1, mult), tempC),
  };
}

function formatRatioLabel(flourMult: number, waterMult: number): string {
  if (flourMult === 0 && waterMult === 0) return "בשיא — ללא האכלה";
  if (flourMult === waterMult) {
    if (flourMult === 1) return "1 : 1 : 1";
    if (flourMult === Math.floor(flourMult)) return `1 : ${flourMult} : ${flourMult}`;
    return `1 : ${flourMult} : ${waterMult}`;
  }
  return `1 : ${flourMult} : ${waterMult}`;
}

export function calculateStarterFeed(
  input: StarterFeedInput,
): StarterFeedResult | null {
  const needG = input.needG;
  if (!needG || needG <= 0) return null;

  const keepG = Math.max(0, input.keepInJarG || 0);
  const tempC = Number.isFinite(input.roomTempC) ? input.roomTempC : 22;
  const hours = Number.isFinite(input.hoursToAutolyse) ? input.hoursToAutolyse : 8;

  const preset = input.ratioPreset ?? "auto";
  const picked =
    ratioFromPreset(preset, tempC) ?? pickRatio(hours, tempC);

  const isPeakOnly = picked.flourMult === 0 && picked.waterMult === 0;
  const buffer = isPeakOnly ? 1.03 : 1.08;
  const totalTarget = (needG + keepG) * buffer;

  let seedG: number;
  let flourAddG: number;
  let waterAddG: number;
  const ratioLabel = formatRatioLabel(picked.flourMult, picked.waterMult);

  if (isPeakOnly) {
    seedG = Math.ceil(totalTarget);
    flourAddG = 0;
    waterAddG = 0;
  } else {
    const mult = 1 + picked.flourMult + picked.waterMult;
    seedG = Math.ceil(totalTarget / mult);
    flourAddG = seedG * picked.flourMult;
    waterAddG = seedG * picked.waterMult;
  }

  const expectedPeakHours = roundTimingHours(
    isPeakOnly ? picked.peakHours : picked.peakHours,
  );

  let explain = `שיא צפוי בכ־${expectedPeakHours} שעות ב־${Math.round(tempC)}°C`;
  if (preset === "auto") {
    explain += ` (יחס ${ratioLabel} לפי ${hours} שעות עד אוטוליזה)`;
  } else {
    explain += ` (${ratioLabel})`;
  }
  explain += `. ${picked.note}`;

  const usableG = seedG + flourAddG + waterAddG;
  if (usableG < needG + keepG - 0.5) {
    seedG += Math.ceil(needG + keepG - usableG);
  }

  return {
    ratioA: picked.a,
    ratioLabel,
    ratioNote: picked.note,
    effectiveHours: hours,
    expectedPeakHours,
    seedG,
    flourAddG: Math.round(flourAddG),
    waterAddG: Math.round(waterAddG),
    totalMixG: Math.round(seedG + flourAddG + waterAddG),
    explain,
  };
}

/** Suggested hours until autolyse from ambient temperature */
export function recommendHoursToAutolyse(avgTempC: number): number {
  return recommendHoursToAutolyseFromTemp(avgTempC);
}
