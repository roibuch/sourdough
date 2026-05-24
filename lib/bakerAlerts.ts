import { pctOf } from "@/lib/flour";
import type { FlourMix } from "@/lib/types";
import {
  ACTIVE_HOUR_END,
  ACTIVE_HOUR_START,
  isNightActiveHour,
  nightWorkDescription,
} from "@/lib/scheduleFriendly";
import { formatScheduleTime } from "@/lib/timeline";
import type { TimelinePlan } from "@/lib/types";

export type BakerAlertSeverity = "info" | "warning" | "danger";

export interface BakerAlert {
  id: string;
  severity: BakerAlertSeverity;
  title: string;
  message: string;
}

const MS_H = 3_600_000;

const HIGH_HYDRATION_THRESHOLD = 78;
const VERY_HIGH_HYDRATION = 85;

function strongFlourPercent(mix: FlourMix): number {
  return (
    pctOf(mix, "manitoba") +
    pctOf(mix, "bread") +
    pctOf(mix, "durum") * 0.5
  );
}

/** High hydration + weak flour blend */
export function getHydrationAlerts(
  mix: FlourMix,
  waterPercent: number,
  trueHydrationPercent?: number | null,
): BakerAlert[] {
  const alerts: BakerAlert[] = [];
  const effective =
    trueHydrationPercent != null && trueHydrationPercent > 0
      ? trueHydrationPercent
      : waterPercent;
  const strong = strongFlourPercent(mix);
  const manitoba = pctOf(mix, "manitoba");

  if (effective >= VERY_HIGH_HYDRATION) {
    if (manitoba < 15 && strong < 45) {
      alerts.push({
        id: "hydration-very-high-weak",
        severity: "danger",
        title: "הידרציה גבוהה מאוד",
        message: `ב־${Math.round(effective)}% הידרציה הבצק רטוב מאוד. ודאו שיש לפחות 15–25% מניטובה או 45%+ קמח לחם/חזק — אחרת הבצק עלול להישאר דביק וחלש.`,
      });
    } else if (manitoba < 10) {
      alerts.push({
        id: "hydration-very-high-manitoba",
        severity: "warning",
        title: "הידרציה גבוהה — חיזוק מומלץ",
        message: `ב־${Math.round(effective)}% הידרציה מומלץ לכלול קמח חלבון גבוה (מניטובה). כרגע מניטובה ${manitoba}% — שקלו להעלות ל־15% ומעלה.`,
      });
    } else {
      alerts.push({
        id: "hydration-very-high-ok",
        severity: "info",
        title: "הידרציה גבוהה",
        message: `ב־${Math.round(effective)}% הידרציה — עבודה עדינה, קיפולים עדינים (Coil/Slap), ודאו שהמחמצת בשיא לפני הלישה.`,
      });
    }
  } else if (effective >= HIGH_HYDRATION_THRESHOLD && strong < 40) {
    alerts.push({
      id: "hydration-high-weak",
      severity: "warning",
      title: "אזהרת הידרציה",
      message: `ב־${Math.round(effective)}% הידרציה עם תערובת יחסית חלשה (${Math.round(strong)}% קמח חזק). שקלו מניטובה או קמח לחם נוסף — אחרת הבצק עלול להתפזר.`,
    });
  }

  if (waterPercent >= 85 && effective < VERY_HIGH_HYDRATION) {
    alerts.push({
      id: "hydration-bakers-high",
      severity: "warning",
      title: "אחוז מים גבוה",
      message: `הגדרתם ${waterPercent}% מים (באקרים). ודאו שהתערובת תומכת בבצק רטוב — מניטובה או קמח לחם.`,
    });
  }

  return alerts;
}

function hourLabel(ms: number): string {
  const h = new Date(ms).getHours();
  const m = new Date(ms).getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Schedule / overnight active work warnings */
export function getScheduleAlerts(plan: TimelinePlan | null): BakerAlert[] {
  if (!plan) return [];

  const alerts: BakerAlert[] = [];
  const nightDesc = nightWorkDescription(plan);
  if (nightDesc) {
    alerts.push({
      id: "schedule-night-active",
      severity: "warning",
      title: "אזהרת לוח זמנים",
      message: nightDesc,
    });
  }

  const bulkStep = plan.steps.find((s) => s.title.includes("מחמצת, מלח"));
  if (bulkStep && plan.summary.bulkHours > 0) {
    const bulkEndMs = bulkStep.start + plan.summary.bulkHours * MS_H;
    const endHour = new Date(bulkEndMs).getHours();
    if (isNightActiveHour(endHour)) {
      alerts.push({
        id: "schedule-bulk-end-night",
        severity: "warning",
        title: "אזהרת לוח — סוף Bulk",
        message: `לפי ההגדרות הנוכחיות, שלב ה-Bulk מסתיים בערך ב־${hourLabel(bulkEndMs)} (${formatScheduleTime(bulkEndMs)}) — מחוץ לשעות העבודה הנוחות (${ACTIVE_HOUR_START}:00–${ACTIVE_HOUR_END}:00). שקלו מועד אפייה מאוחר יותר או מצב מואץ.`,
      });
    }
  }

  const mixingStep = plan.steps.find((s) => s.title.includes("מחמצת, מלח"));
  if (mixingStep) {
    const mixHour = new Date(mixingStep.start).getHours();
    if (isNightActiveHour(mixHour)) {
      alerts.push({
        id: "schedule-mixing-night",
        severity: "danger",
        title: "לישה בשעות לילה",
        message: `שלב הלישה וה-Bulk מתוזמן ל־${hourLabel(mixingStep.start)}. מומלץ לבחור מועד אפייה אחר — עבודה פעילה בלילה מובילה לעייפות וטעויות.`,
      });
    }
  }

  return alerts;
}

export interface CollectBakerAlertsInput {
  mix: FlourMix;
  waterPercent: number;
  trueHydrationPercent?: number | null;
  timelinePlan: TimelinePlan | null;
}

export function collectBakerAlerts(input: CollectBakerAlertsInput): BakerAlert[] {
  const seen = new Set<string>();
  const all = [
    ...getHydrationAlerts(
      input.mix,
      input.waterPercent,
      input.trueHydrationPercent,
    ),
    ...getScheduleAlerts(input.timelinePlan),
  ];
  return all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}
