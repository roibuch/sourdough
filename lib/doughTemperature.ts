/**
 * Desired Dough Temperature (DDT) — water temperature for target final dough temp.
 * Heat balance: Σ(mᵢ × Tᵢ) = DDT × total mass (friction adds heat → cooler water).
 */

export interface DDTInput {
  /** Target final dough temperature (°C), typically 24–26 */
  targetDoughTempC: number;
  flourTempC: number;
  roomTempC: number;
  flourWeightG: number;
  waterWeightG: number;
  /** Heat from mixing (°C equivalent), ~0 hand / 2–4 stand mixer */
  frictionFactorC?: number;
  starterWeightG?: number;
  starterTempC?: number;
}

export interface DDTResult {
  waterTempC: number;
  totalMassG: number;
  /** Human-readable band */
  band: "too_cold" | "ok" | "too_hot";
  warning?: string;
}

const WATER_TEMP_MIN = 2;
const WATER_TEMP_MAX = 45;

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
  const starterTempC =
    input.starterTempC ?? roomTempC;

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
    warning =
      "טמפרטורת מים נמוכה מדי — השתמשו במים חמים יותר או הורידו את יעד ה-DDT / חממו קמח.";
  } else if (rounded > WATER_TEMP_MAX) {
    band = "too_hot";
    warning =
      "טמפרטורת מים גבוהה מדי — השתמשו במים קרים יותר, קמח מהמקרר, או הורידו את יעד ה-DDT.";
  } else if (rounded < 10) {
    warning = "מים קרים מאוד — ודאו שהמדידה וה-DDT מתאימים לסביבה.";
  } else if (rounded > 35) {
    warning = "מים חמים — בדקו עם מדחום לפני הלישה.";
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
  { value: 0, label: "ללא (ערבוב עדין)" },
  { value: 2, label: "קל (+2°C)" },
  { value: 4, label: "מיקסר (+4°C)" },
] as const;
