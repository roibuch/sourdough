import {
  buildTimelineInputWithPace,
  type FermentationPace,
} from "./expressMode";
import {
  estimateBulkFermentationHours,
  pickStarterFeedRatio,
  roundTimingHours,
} from "./fermentationTiming";
import { buildFlourMix } from "./flour";
import { getDoughWorkflow } from "./workflow";
import { heContent, t as fmt } from "@/lib/content";
import type { FlourMix, TimelinePlan, TimelineStep } from "./types";
import { buildWorkflowSchedule } from "./schedule";

const tl = heContent.timeline;

const MS_H = 3_600_000;

export function defaultTargetBakeLocal(): string {
  const d = new Date();
  let daysUntilFriday = (5 - d.getDay() + 7) % 7;
  if (daysUntilFriday === 0) {
    daysUntilFriday =
      d.getHours() < 19 || (d.getHours() === 19 && d.getMinutes() === 0) ? 0 : 7;
  }
  d.setDate(d.getDate() + daysUntilFriday);
  d.setHours(18, 0, 0, 0);
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

export function getTimelineBulkHours(
  starterPct: number,
  mix: FlourMix,
  roomTempC = 22,
): number {
  return estimateBulkFermentationHours(starterPct, roomTempC, mix);
}

/** Peak duration after feed for the chosen ratio (not the full window until autolyse). */
export function getTimelineStarterHours(
  hoursToAutolyse: number,
  roomTempC = 22,
): number {
  if (Number.isNaN(hoursToAutolyse)) return 5;
  return pickStarterFeedRatio(hoursToAutolyse, roomTempC).peakHours;
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
    input.bulkHours ??
    getTimelineBulkHours(input.starterPct, mix, input.roomTemp);
  const starterPeakH =
    input.starterPeakHours ??
    getTimelineStarterHours(input.hoursToAutolyse, input.roomTemp);

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
  const hoursUntilAutolyse = input.hoursToAutolyse;
  const tStarterFeed = tAutolyseStart - hoursUntilAutolyse * MS_H;

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

export interface BuildForwardTimelineInput extends BuildTimelineInput {
  /** Anchor "now" for forward schedule (defaults to Date.now()) */
  startMs?: number;
}

/** Build a step-by-step schedule forward from the current time (or `startMs`). */
export function buildForwardTimelineFromNow(
  input: BuildForwardTimelineInput,
): TimelinePlan {
  const paced = buildTimelineInputWithPace(input);
  const startMs = input.startMs ?? Date.now();
  const mix = buildFlourMix(paced.flourPcts);
  const bulkH =
    paced.bulkHours ??
    getTimelineBulkHours(paced.starterPct, mix, paced.roomTemp);
  const hoursUntilAutolyse = paced.hoursToAutolyse;
  const starterPeakH =
    paced.starterPeakHours ??
    getTimelineStarterHours(hoursUntilAutolyse, paced.roomTemp);
  const autolyseH = paced.autolyseHours ?? 1;

  const tStarterFeed = startMs;
  const tAutolyseStart = tStarterFeed + hoursUntilAutolyse * MS_H;
  const tAutolyseEnd = tAutolyseStart + autolyseH * MS_H;
  const tBulkStart = tAutolyseEnd;
  const tBulkEnd = tBulkStart + bulkH * MS_H;
  const tPreshapeStart = tBulkEnd;
  const tPreshapeEnd = tPreshapeStart + 0.5 * MS_H;
  const tRetardStart = tPreshapeEnd;
  const tRetardEnd = tRetardStart + paced.coldRetardHours * MS_H;
  const tBakeStart = tRetardEnd;
  const tBakeEnd = tBakeStart + MS_H;

  const workflow = getDoughWorkflow(
    mix,
    paced.waterPct,
    paced.starterPct,
    paced.roomTemp,
  );

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
      title: tl.steps.starterFeed.title,
      start: tStarterFeed,
      duration: formatDurationLabel(starterPeakH),
      meta: tl.steps.starterFeed.meta,
    },
    {
      icon: "🥣",
      title: tl.steps.autolyse.title,
      start: tAutolyseStart,
      duration: formatDurationLabel(autolyseH),
      meta:
        autolyseH <= 0.5
          ? tl.steps.autolyse.metaExpress
          : tl.steps.autolyse.metaStandard,
    },
    {
      icon: "🧂",
      title: tl.steps.bulk.title,
      start: tBulkStart,
      duration: formatDurationLabel(bulkH),
      meta: fmt(tl.steps.bulk.meta, { starterPct: paced.starterPct }),
      alarms: schedule
        ? [...schedule.folds, schedule.endBulk]
        : undefined,
    },
    {
      icon: "✋",
      title: tl.steps.preshape.title,
      start: tPreshapeStart,
      duration: tl.duration.halfHour,
      meta: tl.steps.preshape.meta,
    },
    {
      icon: "❄️",
      title: tl.steps.coldRetard.title,
      start: tRetardStart,
      duration: formatDurationLabel(paced.coldRetardHours),
      meta: tl.steps.coldRetard.meta,
    },
    {
      icon: "🔥",
      title: tl.steps.bake.title,
      start: tBakeStart,
      duration: tl.duration.oneHour,
      meta: tl.steps.bake.meta,
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
      starterPct: paced.starterPct,
    },
    workflow,
    schedule,
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
      title: tl.steps.starterFeed.title,
      start: tStarterFeed,
      duration: formatDurationLabel(starterPeakH),
      meta: tl.steps.starterFeed.meta,
    },
    {
      icon: "🥣",
      title: tl.steps.autolyse.title,
      start: tAutolyseStart,
      duration: formatDurationLabel(autolyseH),
      meta:
        autolyseH <= 0.5
          ? tl.steps.autolyse.metaExpress
          : tl.steps.autolyse.metaStandard,
    },
    {
      icon: "🧂",
      title: tl.steps.bulk.title,
      start: tAutolyseEnd,
      duration: formatDurationLabel(bulkH),
      meta: fmt(tl.steps.bulk.meta, { starterPct: input.starterPct }),
      alarms: schedule
        ? [...schedule.folds, schedule.endBulk]
        : undefined,
    },
    {
      icon: "✋",
      title: tl.steps.preshape.title,
      start: tPreshapeStart,
      duration: tl.duration.halfHour,
      meta: tl.steps.preshape.meta,
    },
    {
      icon: "❄️",
      title: tl.steps.coldRetard.title,
      start: tRetardStart,
      duration: formatDurationLabel(input.coldRetardHours),
      meta: tl.steps.coldRetard.meta,
    },
    {
      icon: "🔥",
      title: tl.steps.bake.title,
      start: tBakeStart,
      duration: tl.duration.oneHour,
      meta: tl.steps.bake.meta,
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
