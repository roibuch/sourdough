import type { BuildTimelineInput } from "./timeline";

export type FermentationPace = "standard" | "express";

/** Starter feed ratio presets */
export type StarterRatioPreset = "auto" | "equal" | "half" | "peak";

export type WarmZoneId = "room" | "oven-light" | "microwave-off" | "warm-corner";

export interface StarterRatioOption {
  id: StarterRatioPreset;
  label: string;
  ratioLabel: string;
  flourMult: number;
  waterMult: number;
  typicalPeakHours: number;
  note: string;
}

export const STARTER_RATIO_OPTIONS: StarterRatioOption[] = [
  {
    id: "auto",
    label: "אוטומטי",
    ratioLabel: "לפי זמן",
    flourMult: -1,
    waterMult: -1,
    typicalPeakHours: 5,
    note: "המערכת בוחרת יחס לפי השעות עד האוטוליזה.",
  },
  {
    id: "equal",
    label: "1:1:1",
    ratioLabel: "1 : 1 : 1",
    flourMult: 1,
    waterMult: 1,
    typicalPeakHours: 3.5,
    note: "האכלה קטנה ומהירה — מגיעה לשיא בכ־3–4 שעות בחום.",
  },
  {
    id: "half",
    label: "1:0.5:0.5",
    ratioLabel: "1 : 0.5 : 0.5",
    flourMult: 0.5,
    waterMult: 0.5,
    typicalPeakHours: 2.5,
    note: "האכלה מינימלית — הכי מהיר, דורש מחמצת חזקה.",
  },
  {
    id: "peak",
    label: "בשיא מהצנצנת",
    ratioLabel: "ללא האכלה",
    flourMult: 0,
    waterMult: 0,
    typicalPeakHours: 0.5,
    note: "רק אם יש מספיק מחמצת פעילה בצנצנת — בלי האכלה נוספת.",
  },
];

export interface WarmZoneRecommendation {
  id: WarmZoneId;
  title: string;
  targetTemp: string;
  steps: string[];
  warning?: string;
}

export interface ExpressTimelineAdjustments {
  hoursToAutolyse: number;
  coldRetardHours: number;
  autolyseHours: number;
  bulkHours?: number;
  roomTemp: number;
  starterPct: number;
}

/** Shorten fermentation blocks when user enables express pace */
export function applyExpressToTimeline(
  input: BuildTimelineInput,
): ExpressTimelineAdjustments {
  const baseHta = input.hoursToAutolyse;
  const baseRetard = input.coldRetardHours;
  const baseStarter = input.starterPct;

  if (input.fermentationPace !== "express") {
    return {
      hoursToAutolyse: baseHta,
      coldRetardHours: baseRetard,
      autolyseHours: input.autolyseHours ?? 1,
      bulkHours: input.bulkHours,
      roomTemp: input.roomTemp,
      starterPct: baseStarter,
    };
  }

  return {
    hoursToAutolyse: Math.max(2.5, Math.min(baseHta, 4)),
    coldRetardHours: Math.max(4, Math.min(baseRetard, 8)),
    autolyseHours: 0.5,
    bulkHours: input.bulkHours
      ? Math.max(2.5, Math.round(input.bulkHours * 0.8 * 10) / 10)
      : undefined,
    roomTemp: Math.min(28, input.roomTemp + 3),
    starterPct: Math.min(35, baseStarter + 3),
  };
}

export function buildTimelineInputWithPace(
  input: BuildTimelineInput,
): BuildTimelineInput {
  const adj = applyExpressToTimeline(input);
  return {
    ...input,
    hoursToAutolyse: adj.hoursToAutolyse,
    coldRetardHours: adj.coldRetardHours,
    autolyseHours: adj.autolyseHours,
    bulkHours: adj.bulkHours,
    roomTemp: adj.roomTemp,
    starterPct: adj.starterPct,
    starterPeakHours: adj.hoursToAutolyse,
  };
}

export function getWarmZoneRecommendation(
  hoursToAutolyse: number,
  pace: FermentationPace,
  ratioPreset: StarterRatioPreset,
): WarmZoneRecommendation | null {
  const ratio = STARTER_RATIO_OPTIONS.find((r) => r.id === ratioPreset);
  const peakH =
    ratioPreset === "auto"
      ? hoursToAutolyse
      : ratio?.typicalPeakHours ?? hoursToAutolyse;

  const needsHeat =
    pace === "express" || hoursToAutolyse <= 5 || peakH <= 4;

  if (!needsHeat) return null;

  if (hoursToAutolyse <= 3 || ratioPreset === "half" || ratioPreset === "peak") {
    return {
      id: "microwave-off",
      title: "מיקרוגל כלול (כבוי)",
      targetTemp: "28–32°C",
      steps: [
        "שימו את המחמצת בקערה מכוסה בתוך המיקרוגל — **המיקרוגל כבוי לחלוטין**.",
        "סגרו את הדלת — יוצר תא חם ולח ללא חום ישיר.",
        "בדקו נפח כל 45–60 דקות.",
      ],
      warning: "לא להדליק מיקרוגל! רק שימוש כמחסן חם.",
    };
  }

  if (hoursToAutolyse <= 5 || pace === "express") {
    return {
      id: "oven-light",
      title: "תנור — נורה בלבד",
      targetTemp: "26–30°C",
      steps: [
        "הדליקו **רק** את נורת התנור (בלי חום / בלי טורבו).",
        "שימו קערה מכוסה על המדף האמצעי.",
        "אם חם מדי מעל 32°C — פתחו מעט את הדלת.",
      ],
    };
  }

  return {
    id: "warm-corner",
    title: "פינה חמה בבית",
    targetTemp: "24–26°C",
    steps: [
      "ליד תנור פועל, מעל מקרר, או חלון שמשי חלש.",
      "כיסוי הדוק על הקערה — שמרו על לחות.",
    ],
  };
}

export function expressModeSummary(pace: FermentationPace): string | null {
  if (pace !== "express") return null;
  return (
    "מצב מואץ: האכלה מהירה, אוטוליזה 30 דק׳, Bulk קצר יותר, מקרר 4–8 שעות, " +
    "ומומלץ אזור חימום."
  );
}
