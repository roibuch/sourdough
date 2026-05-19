/** Starter feed math — ported from sourdough_app.html */

import type { StarterRatioPreset } from "./expressMode";
import { STARTER_RATIO_OPTIONS } from "./expressMode";

export interface RatioPick {
  a: number;
  flourMult: number;
  waterMult: number;
  note: string;
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
  seedG: number;
  flourAddG: number;
  waterAddG: number;
  totalMixG: number;
  explain: string;
}

/** Adjust hours for temperature when picking feed ratio */
export function effectiveHoursForRatio(hours: number, tempC: number): number {
  let adj = hours;
  if (tempC < 20) adj += (20 - tempC) * 0.35;
  if (tempC > 24) adj -= (tempC - 24) * 0.25;
  return Math.max(2, adj);
}

function ratioFromPreset(preset: StarterRatioPreset): RatioPick | null {
  const def = STARTER_RATIO_OPTIONS.find((r) => r.id === preset);
  if (!def || preset === "auto") return null;
  if (preset === "peak") {
    return {
      a: 0,
      flourMult: 0,
      waterMult: 0,
      note: def.note,
    };
  }
  return {
    a: def.flourMult,
    flourMult: def.flourMult,
    waterMult: def.waterMult,
    note: def.note,
  };
}

/** Pick 1:a:a ratio by effective hours until autolyse */
export function pickRatio(effectiveHours: number): RatioPick {
  const steps: { maxH: number; a: number; note: string }[] = [
    { maxH: 3.5, a: 1, note: "התפחה מהירה — מתאים כשיש מעט זמן עד האוטוליזה." },
    { maxH: 5, a: 2, note: "איזון נפוץ ליום אפייה רגיל." },
    { maxH: 7, a: 3, note: "דילול בינוני — מתאים ללילה קצר או בוקר מאוחר." },
    { maxH: 10, a: 4, note: "דילול גבוה — מתאים כשיש זמן ארוך עד ערבוב קמח ומים." },
    {
      maxH: 999,
      a: 5,
      note: "דילול גבוה במיוחד — מתאים לתכנון מראש; חשוב לוודא שהמחמצת חזקה.",
    },
  ];
  for (const s of steps) {
    if (effectiveHours <= s.maxH) {
      return { a: s.a, flourMult: s.a, waterMult: s.a, note: s.note };
    }
  }
  const last = steps[steps.length - 1];
  return { a: last.a, flourMult: last.a, waterMult: last.a, note: last.note };
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

export function calculateStarterFeed(input: StarterFeedInput): StarterFeedResult | null {
  const needG = input.needG;
  if (!needG || needG <= 0) return null;

  const keepG = Math.max(0, input.keepInJarG || 0);
  const tempC = Number.isFinite(input.roomTempC) ? input.roomTempC : 22;
  const hours = Number.isFinite(input.hoursToAutolyse) ? input.hoursToAutolyse : 8;

  const effectiveHours = effectiveHoursForRatio(hours, tempC);
  const preset = input.ratioPreset ?? "auto";
  const picked =
    ratioFromPreset(preset) ?? pickRatio(effectiveHours);

  const buffer = 1.08;
  const totalTarget = (needG + keepG) * buffer;

  let seedG: number;
  let flourAddG: number;
  let waterAddG: number;
  let ratioLabel: string;

  if (picked.flourMult === 0 && picked.waterMult === 0) {
    seedG = Math.ceil(totalTarget);
    flourAddG = 0;
    waterAddG = 0;
    ratioLabel = formatRatioLabel(0, 0);
  } else {
    const mult = 1 + picked.flourMult + picked.waterMult;
    seedG = Math.ceil(totalTarget / mult);
    flourAddG = seedG * picked.flourMult;
    waterAddG = seedG * picked.waterMult;
    ratioLabel = formatRatioLabel(picked.flourMult, picked.waterMult);
  }

  let explain = `לפי כ־${hours} שעות עד אוטוליזה`;
  if (Math.abs(effectiveHours - hours) > 0.6) {
    explain += ` (מותאם ל־~${Math.round(tempC)}°C כמו ~${effectiveHours.toFixed(1)} שעות «אפקטיביות»)`;
  }
  explain += `. ${picked.note}`;

  return {
    ratioA: picked.a,
    ratioLabel,
    ratioNote: picked.note,
    effectiveHours,
    seedG,
    flourAddG: Math.round(flourAddG),
    waterAddG: Math.round(waterAddG),
    totalMixG: Math.round(seedG + flourAddG + waterAddG),
    explain,
  };
}

/** Suggested hours until autolyse from ambient temperature */
export function recommendHoursToAutolyse(avgTempC: number): number {
  if (avgTempC > 27) return 4;
  if (avgTempC >= 22 && avgTempC <= 26) return 6;
  return 8;
}
