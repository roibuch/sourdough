import type { FermentationPace } from "./expressMode";
import { pctOf, buildFlourMix } from "./flour";
import { getDoughWorkflow } from "./workflow";
import type { FlourMix, TimelinePlan, TimelineStep } from "./types";
import { buildWorkflowSchedule } from "./schedule";

const MS_H = 3_600_000;

export function defaultTargetBakeLocal(): string {
  const d = new Date();
  let daysUntilFriday = (5 - d.getDay() + 7) % 7;
  if (daysUntilFriday === 0) {
    daysUntilFriday =
      d.getHours() < 19 || (d.getHours() === 19 && d.getMinutes() === 0) ? 0 : 7;
  }
  d.setDate(d.getDate() + daysUntilFriday);
  d.setHours(19, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 7);
  return toLocalDatetimeValue(d);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toLocalDatetimeValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatScheduleTime(ms: number): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

export function formatDurationLabel(hours: number): string {
  if (hours === 0.5) return "30 דק׳";
  if (hours === 1) return "1 שעה";
  return `${hours} שעות`;
}

export function getTimelineBulkHours(starterPct: number, mix: FlourMix): number {
  const sp = starterPct || 20;
  let hours = 6 - ((sp - 15) / 10) * 2;
  hours = Math.max(4, Math.min(6, hours));
  const whole = pctOf(mix, "wholeWheat") + pctOf(mix, "wholeRye");
  if (whole > 15) hours = Math.max(4, hours - 0.5);
  return Math.round(hours * 10) / 10;
}

export function getTimelineStarterHours(hoursToAutolyse: number): number {
  if (Number.isNaN(hoursToAutolyse)) return 5;
  return Math.max(4, Math.min(10, hoursToAutolyse));
}

export interface BuildTimelineInput {
  targetBakeTime: string;
  coldRetardHours: number;
  starterPct: number;
  waterPct: number;
  roomTemp: number;
  hoursToAutolyse: number;
  flourPcts: number[];
  /** Override bulk block length (e.g. from weather plan) */
  bulkHours?: number;
  /** Override starter peak window (defaults to hoursToAutolyse) */
  starterPeakHours?: number;
  /** Autolyse block length in hours (default 1; express often 0.5) */
  autolyseHours?: number;
  fermentationPace?: FermentationPace;
}

export interface TimelineAnchors {
  tStarterFeed: number;
  tAutolyseStart: number;
  tAutolyseEnd: number;
  tBulkStart: number;
  tBulkEnd: number;
  starterPeakH: number;
  bulkH: number;
}

export function getTimelineAnchors(
  input: BuildTimelineInput,
): TimelineAnchors | null {
  if (!input.targetBakeTime) return null;
  const bakeEnd = new Date(input.targetBakeTime);
  if (Number.isNaN(bakeEnd.getTime())) return null;

  const mix = buildFlourMix(input.flourPcts);
  const bulkH =
    input.bulkHours ?? getTimelineBulkHours(input.starterPct, mix);
  const starterPeakH =
    input.starterPeakHours ??
    getTimelineStarterHours(input.hoursToAutolyse);

  const tBakeEnd = bakeEnd.getTime();
  const tBakeStart = tBakeEnd - MS_H;
  const tRetardEnd = tBakeStart;
  const tRetardStart = tRetardEnd - input.coldRetardHours * MS_H;
  const tPreshapeEnd = tRetardStart;
  const tPreshapeStart = tPreshapeEnd - 0.5 * MS_H;
  const autolyseH = input.autolyseHours ?? 1;
  const tBulkEnd = tPreshapeStart;
  const tBulkStart = tBulkEnd - bulkH * MS_H;
  const tAutolyseEnd = tBulkStart;
  const tAutolyseStart = tAutolyseEnd - autolyseH * MS_H;
  const tStarterFeed = tAutolyseStart - starterPeakH * MS_H;

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

export function buildReverseTimeline(input: BuildTimelineInput): TimelinePlan | null {
  const anchorData = getTimelineAnchors(input);
  if (!anchorData) return null;

  const mix = buildFlourMix(input.flourPcts);
  const { bulkH, starterPeakH } = anchorData;
  const workflow = getDoughWorkflow(
    mix,
    input.waterPct,
    input.starterPct,
    input.roomTemp,
  );

  const {
    tStarterFeed,
    tAutolyseStart,
    tAutolyseEnd,
    tBulkStart,
    tBulkEnd,
  } = anchorData;
  const autolyseH = input.autolyseHours ?? 1;

  const bakeEnd = new Date(input.targetBakeTime);
  const tBakeEnd = bakeEnd.getTime();
  const tBakeStart = tBakeEnd - MS_H;
  const tRetardEnd = tBakeStart;
  const tRetardStart = tRetardEnd - input.coldRetardHours * MS_H;
  const tPreshapeEnd = tRetardStart;
  const tPreshapeStart = tPreshapeEnd - 0.5 * MS_H;

  const anchors = {
    tBulkStart,
    tBulkEnd,
    tAutolyseStart,
    tStarterFeed,
    bulkH,
  };
  const schedule = buildWorkflowSchedule(workflow, anchors);

  const steps: TimelineStep[] = [
    {
      icon: "🦠",
      title: "האכלת מחמצת (לשיא)",
      start: tStarterFeed,
      duration: formatDurationLabel(starterPeakH),
      meta: "הוצא/י מהמקרר והאכל/י — חכה/י לכפילות נפח לפני האוטוליזה.",
    },
    {
      icon: "🥣",
      title: "אוטוליזה",
      start: tAutolyseStart,
      duration: formatDurationLabel(autolyseH),
      meta:
        autolyseH <= 0.5
          ? "ערבוב קמח ומים — אוטוליזה קצרה (מצב מואץ)."
          : "ערבוב קמח ומים בלבד (בסינאז׳ — החזיקו/י מים בצד לשלב הבא).",
    },
    {
      icon: "🧂",
      title: "הוספת מחמצת, מלח ו-Bulk",
      start: tAutolyseEnd,
      duration: formatDurationLabel(bulkH),
      meta: `אחרי האוטוליזה — לש/י והתפחה ראשונית (Bulk), ~${input.starterPct}% מחמצת.`,
      alarms: schedule
        ? [...schedule.folds, schedule.endBulk]
        : undefined,
    },
    {
      icon: "✋",
      title: "עיצוב מקדים ומנוחה",
      start: tPreshapeStart,
      duration: "30 דק׳",
      meta: "עיצוב קל והרפיה לפני הכנסה למקרר.",
    },
    {
      icon: "❄️",
      title: "התפחה איטית במקרר",
      start: tRetardStart,
      duration: formatDurationLabel(input.coldRetardHours),
      meta: "כיסוי הדוק — התפחה איטית בקור.",
    },
    {
      icon: "🔥",
      title: "חימום ואפייה",
      start: tBakeStart,
      duration: "1 שעה",
      meta: "הוצא/י מהמקרר, חימום תנור והכנסה לאפייה — סיום בזמן היעד.",
      isTarget: true,
    },
  ];

  const totalHours = Math.round(((tBakeEnd - tStarterFeed) / MS_H) * 10) / 10;

  return {
    steps,
    summary: {
      starterFeed: tStarterFeed,
      bakeEnd: tBakeEnd,
      totalHours,
      bulkHours: bulkH,
      starterPct: input.starterPct,
    },
    workflow,
    schedule,
  };
}
