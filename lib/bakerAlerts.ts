import { heContent, t } from "@/lib/content";
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
const a = heContent.alerts;

const HIGH_HYDRATION_THRESHOLD = 78;
const VERY_HIGH_HYDRATION = 85;

function strongFlourPercent(mix: FlourMix): number {
  return (
    pctOf(mix, "manitoba") +
    pctOf(mix, "bread") +
    pctOf(mix, "allPurpose") * 0.25
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
        title: a.hydration.veryHighWeak.title,
        message: t(a.hydration.veryHighWeak.message, {
          effective: Math.round(effective),
        }),
      });
    } else if (manitoba < 10) {
      alerts.push({
        id: "hydration-very-high-manitoba",
        severity: "warning",
        title: a.hydration.veryHighManitoba.title,
        message: t(a.hydration.veryHighManitoba.message, {
          effective: Math.round(effective),
          manitoba,
        }),
      });
    } else {
      alerts.push({
        id: "hydration-very-high-ok",
        severity: "info",
        title: a.hydration.veryHighOk.title,
        message: t(a.hydration.veryHighOk.message, {
          effective: Math.round(effective),
        }),
      });
    }
  } else if (effective >= HIGH_HYDRATION_THRESHOLD && strong < 40) {
    alerts.push({
      id: "hydration-high-weak",
      severity: "warning",
      title: a.hydration.highWeak.title,
      message: t(a.hydration.highWeak.message, {
        effective: Math.round(effective),
        strong: Math.round(strong),
      }),
    });
  }

  if (waterPercent >= 85 && effective < VERY_HIGH_HYDRATION) {
    alerts.push({
      id: "hydration-bakers-high",
      severity: "warning",
      title: a.hydration.bakersHigh.title,
      message: t(a.hydration.bakersHigh.message, { waterPct: waterPercent }),
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
      title: a.schedule.nightActiveTitle,
      message: nightDesc,
    });
  }

  const bulkStep = plan.steps.find((s) =>
    s.title.includes("התפחה ראשונית בקערה"),
  );
  if (bulkStep && plan.summary.bulkHours > 0) {
    const bulkEndMs = bulkStep.start + plan.summary.bulkHours * MS_H;
    const endHour = new Date(bulkEndMs).getHours();
    if (isNightActiveHour(endHour)) {
      alerts.push({
        id: "schedule-bulk-end-night",
        severity: "warning",
        title: a.schedule.bulkEndNight.title,
        message: t(a.schedule.bulkEndNight.message, {
          timeLabel: hourLabel(bulkEndMs),
          formatted: formatScheduleTime(bulkEndMs),
          start: ACTIVE_HOUR_START,
          end: ACTIVE_HOUR_END,
        }),
      });
    }
  }

  const mixingStep = plan.steps.find((s) =>
    s.title.includes("התפחה ראשונית בקערה"),
  );
  if (mixingStep) {
    const mixHour = new Date(mixingStep.start).getHours();
    if (isNightActiveHour(mixHour)) {
      alerts.push({
        id: "schedule-mixing-night",
        severity: "danger",
        title: a.schedule.mixingNight.title,
        message: t(a.schedule.mixingNight.message, {
          timeLabel: hourLabel(mixingStep.start),
        }),
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
