import type { BassinageAmounts, DoughResult } from "./types";

/** Starter assumed at 100% hydration */
export function getTrueHydration(
  flourG: number,
  waterG: number,
  starterG: number,
): number {
  const denom = flourG + starterG / 2;
  if (denom <= 0) return 0;
  return Math.round(((waterG + starterG / 2) / denom) * 1000) / 10;
}

export function getBassinageAmounts(totalWaterG: number): BassinageAmounts {
  const minG = Math.round(totalWaterG * 0.05);
  const maxG = Math.round(totalWaterG * 0.1);
  const holdG = Math.round(totalWaterG * 0.075);
  return {
    minG,
    maxG,
    holdG,
    autolyseG: Math.max(0, totalWaterG - holdG),
  };
}

export function calculateDough(
  totalWeight: number,
  waterPct: number,
  starterPct: number,
  saltPct: number,
): DoughResult {
  const totalPct = 1 + waterPct / 100 + starterPct / 100 + saltPct / 100;
  const flour = totalWeight / totalPct;
  const water = flour * (waterPct / 100);
  const starter = flour * (starterPct / 100);
  const salt = flour * (saltPct / 100);

  const rFlour = Math.round(flour);
  const rWater = Math.round(water);
  const rStarter = Math.round(starter);
  const rSalt = Math.round(salt);

  return {
    flour: rFlour,
    water: rWater,
    starter: rStarter,
    salt: rSalt,
    trueHydration: getTrueHydration(rFlour, rWater, rStarter),
  };
}
