import { buildTimelineInputWithPace } from "./expressMode";
import {
  ACTIVE_HOUR_END,
  ACTIVE_HOUR_START,
  planHasNightActiveWork,
  shiftBakeDateUntilFriendly,
} from "./scheduleFriendly";
import {
  buildReverseTimeline,
  formatScheduleTime,
  toLocalDatetimeValue,
  type BuildTimelineInput,
} from "./timeline";
import type { TimelinePlan } from "./types";

const MS_H = 3_600_000;
const MIN_LEAD_H = 5;
const MIN_LEAD_H_EXPRESS = 3;

export interface ScheduleHighlight {
  icon: string;
  label: string;
  detail: string;
  kind: "start" | "active" | "free" | "finish";
}

export interface ScheduleOption {
  id: string;
  title: string;
  bakeLabel: string;
  targetBakeTime: string;
  coldRetardHours: number;
  plan: TimelinePlan;
  highlights: ScheduleHighlight[];
  feasible: boolean;
  infeasibleReason?: string;
  isExpress?: boolean;
}

interface Candidate {
  id: string;
  title: string;
  date: Date;
  coldRetardHours?: number;
}

function nextWeekday(weekday: number, hour: number, minute: number): Date {
  const d = new Date();
  let diff = (weekday - d.getDay() + 7) % 7;
  if (diff === 0) {
    const sameDay = new Date(d);
    sameDay.setHours(hour, minute, 0, 0);
    if (sameDay.getTime() <= Date.now()) diff = 7;
  }
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function dateAtOffsetDays(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatBakeLabel(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function buildHighlights(plan: TimelinePlan): ScheduleHighlight[] {
  const autolyse = plan.steps[1];
  const bulk = plan.steps[2];
  const retard = plan.steps[4];

  return [
    {
      icon: "🦠",
      label: "התחילו — האכלת מחמצת",
      detail: formatScheduleTime(plan.summary.starterFeed),
      kind: "start",
    },
    {
      icon: "🥣",
      label: "אוטוליזה וערבוב",
      detail: formatScheduleTime(autolyse.start),
      kind: "active",
    },
    {
      icon: "👐",
      label: "עבודה פעילה (קיפולים)",
      detail: `מ־${formatScheduleTime(bulk.start)} · ~${plan.summary.bulkHours} שעות`,
      kind: "active",
    },
    {
      icon: "😴",
      label: "פנויים — מקרר בלבד",
      detail: `מ־${formatScheduleTime(retard.start)}`,
      kind: "free",
    },
    {
      icon: "🔥",
      label: "לחם מוכן",
      detail: formatScheduleTime(plan.summary.bakeEnd),
      kind: "finish",
    },
  ];
}

function addCandidate(
  list: Candidate[],
  item: Omit<Candidate, "date"> & { hour: number; minute?: number },
  weekday?: number,
  dayOffset?: number,
) {
  const date =
    weekday != null
      ? nextWeekday(weekday, item.hour, item.minute ?? 0)
      : dateAtOffsetDays(dayOffset ?? 0, item.hour, item.minute ?? 0);
  if (date.getTime() <= Date.now()) return;
  list.push({
    id: item.id,
    title: item.title,
    date,
    coldRetardHours: item.coldRetardHours,
  });
}

function buildCandidates(): Candidate[] {
  const list: Candidate[] = [];

  addCandidate(list, {
    id: "fri-evening",
    title: "שישי אחה״צ — ארוחת שבת",
    hour: 18,
    coldRetardHours: 12,
  }, 5);

  addCandidate(list, {
    id: "sat-morning",
    title: "שבת בבוקר — כיכר לקפה",
    hour: 10,
    coldRetardHours: 10,
  }, 6);

  addCandidate(list, {
    id: "sat-lunch",
    title: "שבת בצהריים",
    hour: 13,
    coldRetardHours: 10,
  }, 6);

  addCandidate(list, {
    id: "sat-afternoon",
    title: "שבת אחר הצהריים",
    hour: 17,
    coldRetardHours: 10,
  }, 6);

  addCandidate(list, {
    id: "sun-brunch",
    title: "ראשון — בוקר/בראנץ׳",
    hour: 11,
    coldRetardHours: 12,
  }, 0);

  addCandidate(list, {
    id: "sun-lunch",
    title: "ראשון בצהריים",
    hour: 13,
    coldRetardHours: 12,
  }, 0);

  addCandidate(list, {
    id: "tomorrow-am",
    title: "מחר בבוקר",
    hour: 10,
    coldRetardHours: 10,
  }, undefined, 1);

  addCandidate(list, {
    id: "tomorrow-noon",
    title: "מחר בצהריים",
    hour: 13,
    coldRetardHours: 10,
  }, undefined, 1);

  return list;
}

function pushOption(
  options: ScheduleOption[],
  params: {
    id: string;
    title: string;
    date: Date;
    coldRetardHours: number;
    input: BuildTimelineInput;
    isExpress: boolean;
    minLeadH: number;
  },
) {
  const { id, title, date, coldRetardHours, input, isExpress, minLeadH } = params;
  const now = Date.now();
  const targetBakeTime = toLocalDatetimeValue(date);

  const baseInput: BuildTimelineInput = {
    ...input,
    targetBakeTime,
    coldRetardHours,
    fermentationPace: isExpress ? "express" : input.fermentationPace ?? "standard",
  };

  const resolved = isExpress
    ? buildTimelineInputWithPace({ ...baseInput, fermentationPace: "express" })
    : baseInput;

  const buildForDate = (bake: Date) =>
    buildReverseTimeline({
      ...resolved,
      targetBakeTime: toLocalDatetimeValue(bake),
    });

  let finalDate = date;
  let plan = buildForDate(date);
  if (!plan) return;

  if (planHasNightActiveWork(plan)) {
    const fixed = shiftBakeDateUntilFriendly(date, buildForDate);
    if (!fixed) {
      options.push({
        id: isExpress ? `${id}-express` : id,
        title: isExpress ? `${title} ⚡ מואץ` : title,
        bakeLabel: formatBakeLabel(date),
        targetBakeTime,
        coldRetardHours: resolved.coldRetardHours,
        plan,
        highlights: buildHighlights(plan),
        feasible: false,
        isExpress,
        infeasibleReason: `עבודה פעילה יוצאת משעות ${ACTIVE_HOUR_START}:00–${ACTIVE_HOUR_END}:00 — נסו מועד מאוחר יותר או «מואץ».`,
      });
      return;
    }
    finalDate = fixed.date;
    plan = fixed.plan;
  }

  const targetBakeTimeFinal = toLocalDatetimeValue(finalDate);
  const leadH = (plan.summary.starterFeed - now) / MS_H;
  const feasible = leadH >= minLeadH;

  const shiftedNote =
    finalDate.getTime() !== date.getTime()
      ? ` (הותאם ל־${formatBakeLabel(finalDate)} — בלי עבודה בלילה)`
      : "";

  options.push({
    id: isExpress ? `${id}-express` : id,
    title: (isExpress ? `${title} ⚡ מואץ` : title) + shiftedNote,
    bakeLabel: formatBakeLabel(finalDate),
    targetBakeTime: targetBakeTimeFinal,
    coldRetardHours: resolved.coldRetardHours,
    plan,
    highlights: buildHighlights(plan),
    feasible,
    isExpress,
    infeasibleReason: feasible
      ? undefined
      : isExpress
        ? `גם במצב מואץ נדרשות לפחות ${minLeadH} שעות מראש`
        : `נדרשות לפחות ${MIN_LEAD_H} שעות — נסו את גרסת «מואץ»`,
  });
}

/** Ready-made bake schedules — user picks one, sees full plan */
export function generateScheduleOptions(
  input: BuildTimelineInput,
): ScheduleOption[] {
  const options: ScheduleOption[] = [];

  for (const c of buildCandidates()) {
    pushOption(options, {
      id: c.id,
      title: c.title,
      date: c.date,
      coldRetardHours: c.coldRetardHours ?? input.coldRetardHours,
      input,
      isExpress: false,
      minLeadH: MIN_LEAD_H,
    });

    pushOption(options, {
      id: c.id,
      title: c.title,
      date: c.date,
      coldRetardHours: Math.max(4, (c.coldRetardHours ?? input.coldRetardHours) - 4),
      input,
      isExpress: true,
      minLeadH: MIN_LEAD_H_EXPRESS,
    });
  }

  const seen = new Set<string>();
  return options
    .filter((o) => {
      const key = `${o.targetBakeTime}-${o.isExpress ? "x" : "s"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
      if (a.isExpress !== b.isExpress) return a.isExpress ? 1 : -1;
      return a.plan.summary.bakeEnd - b.plan.summary.bakeEnd;
    });
}

export function findScheduleOptionByTarget(
  options: ScheduleOption[],
  targetBakeTime: string,
): ScheduleOption | undefined {
  return options.find(
    (o) => o.targetBakeTime === targetBakeTime && o.feasible,
  );
}
