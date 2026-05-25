import {
  calculateDoughMasses,
  getBassinageAmounts,
  starterFlourAndWater,
  type BakersPercentages,
} from "@/lib/bakingMath";
import type { BassinageAmounts, DoughResult } from "@/lib/types";

/** Baker's-math inputs (percentages relative to flour weight). */
export interface SourdoughMathInputs {
  targetWeightG: number | null;
  waterPercent: number;
  starterPercent: number;
  saltPercent: number;
  starterHydrationPercent: number;
}

export interface SourdoughMathValues {
  flourG: number;
  waterG: number;
  starterG: number;
  saltG: number;
  totalDoughG: number;
  /** Water % in the formula (baker's percentage). */
  bakersWaterPercent: number;
  /** Final dough hydration including water from the starter. */
  trueHydrationPercent: number;
  starterFlourG: number;
  starterWaterG: number;
  bassinage: BassinageAmounts | null;
}

export function doughResultToSourdoughValues(
  dough: DoughResult,
  percentages: BakersPercentages,
  starterHydrationPercent: number,
): SourdoughMathValues {
  const { flourG: starterFlourG, waterG: starterWaterG } = starterFlourAndWater(
    dough.starter,
    starterHydrationPercent,
  );
  const totalDoughG =
    dough.flour + dough.water + dough.starter + dough.salt;
  return {
    flourG: dough.flour,
    waterG: dough.water,
    starterG: dough.starter,
    saltG: dough.salt,
    totalDoughG,
    bakersWaterPercent: percentages.water,
    trueHydrationPercent: dough.trueHydration,
    starterFlourG: Math.round(starterFlourG * 10) / 10,
    starterWaterG: Math.round(starterWaterG * 10) / 10,
    bassinage: dough.water > 0 ? getBassinageAmounts(dough.water) : null,
  };
}

/** Pure baker's math — returns null when target weight is invalid. */
export function computeSourdoughMath(
  inputs: SourdoughMathInputs,
): SourdoughMathValues | null {
  const w = inputs.targetWeightG;
  if (w == null || w <= 0 || !Number.isFinite(w)) return null;

  const percentages: BakersPercentages = {
    water: inputs.waterPercent,
    starter: inputs.starterPercent,
    salt: inputs.saltPercent,
  };

  const dough = calculateDoughMasses({
    targetDoughWeightG: w,
    percentages,
    starterHydrationPct: inputs.starterHydrationPercent,
  });

  return doughResultToSourdoughValues(
    dough,
    percentages,
    inputs.starterHydrationPercent,
  );
}
