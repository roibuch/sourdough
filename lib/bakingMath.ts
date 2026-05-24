import { heContent } from "@/lib/content";
import type { BassinageAmounts, DoughResult } from "@/lib/types";

const ddtWarnings = heContent.ddt.warnings;

/** Baker's %: ingredient weight as % of flour weight */
export interface BakersPercentages {
  water: number;
  starter: number;
  salt: number;
}

export interface DoughMassInput {
  targetDoughWeightG: number;
  percentages: BakersPercentages;
}

export interface DDTInput {
  targetDoughTempC: number;
  flourTempC: number;
  roomTempC: number;
  flourWeightG: number;
  waterWeightG: number;
  frictionFactorC?: number;
  starterWeightG?: number;
  starterTempC?: number;
}

export interface DDTResult {
  waterTempC: number;
  totalMassG: number;
  band: "too_cold" | "ok" | "too_hot";
  warning?: string;
}

const WATER_TEMP_MIN = 2;
const WATER_TEMP_MAX = 45;

/** Total baker's % divisor: 1 + water% + starter% + salt% (all relative to flour) */
export function totalBakersPercentFactor(percentages: BakersPercentages): number {
  return (
    1 +
    percentages.water / 100 +
    percentages.starter / 100 +
    percentages.salt / 100
  );
}

/** Flour weight from target final dough mass and baker's percentages */
export function flourWeightFromTarget(
  targetDoughWeightG: number,
  percentages: BakersPercentages,
): number {
  const factor = totalBakersPercentFactor(percentages);
  if (factor <= 0 || targetDoughWeightG <= 0) return 0;
  return targetDoughWeightG / factor;
}

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

export function calculateDoughMasses(input: DoughMassInput): DoughResult {
  const { targetDoughWeightG, percentages } = input;
  const flour = flourWeightFromTarget(targetDoughWeightG, percentages);
  const water = flour * (percentages.water / 100);
  const starter = flour * (percentages.starter / 100);
  const salt = flour * (percentages.salt / 100);

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

/** @deprecated Prefer {@link calculateDoughMasses} */
export function calculateDough(
  totalWeight: number,
  waterPct: number,
  starterPct: number,
  saltPct: number,
): DoughResult {
  return calculateDoughMasses({
    targetDoughWeightG: totalWeight,
    percentages: { water: waterPct, starter: starterPct, salt: saltPct },
  });
}

/**
 * Desired dough temperature (DDT) — water temp for target final dough temp.
 * Heat balance: Σ(mᵢ × Tᵢ) + friction = DDT × total mass
 */
export function calculateWaterTempDDT(input: DDTInput): DDTResult | null {
  const {
    targetDoughTempC,
    flourTempC,
    roomTempC,
    flourWeightG,
    waterWeightG,
    frictionFactorC = 0,
  } = input;

  if (waterWeightG <= 0 || flourWeightG < 0) return null;
  if (
    !Number.isFinite(targetDoughTempC) ||
    !Number.isFinite(flourTempC) ||
    !Number.isFinite(roomTempC)
  ) {
    return null;
  }

  const starterWeightG = input.starterWeightG ?? 0;
  const starterTempC = input.starterTempC ?? roomTempC;

  const totalMassG = flourWeightG + waterWeightG + starterWeightG;
  if (totalMassG <= 0) return null;

  const heatFromSolids =
    flourWeightG * flourTempC +
    starterWeightG * starterTempC +
    frictionFactorC;

  const waterTempC =
    (targetDoughTempC * totalMassG - heatFromSolids) / waterWeightG;

  const rounded = Math.round(waterTempC * 10) / 10;

  let band: DDTResult["band"] = "ok";
  let warning: string | undefined;

  if (rounded < WATER_TEMP_MIN) {
    band = "too_cold";
    warning = ddtWarnings.tooCold;
  } else if (rounded > WATER_TEMP_MAX) {
    band = "too_hot";
    warning = ddtWarnings.tooHot;
  } else if (rounded < 10) {
    warning = ddtWarnings.veryColdWater;
  } else if (rounded > 35) {
    warning = ddtWarnings.veryHotWater;
  }

  return {
    waterTempC: rounded,
    totalMassG,
    band,
    warning,
  };
}

export const DDT_TARGET_DEFAULT = 25;
export const DDT_FRICTION_OPTIONS = [
  { value: 0, label: heContent.ddt.friction.none },
  { value: 2, label: heContent.ddt.friction.light },
  { value: 4, label: heContent.ddt.friction.mixer },
] as const;
