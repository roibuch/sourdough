import dayjs from "dayjs";
import type { BlackoutPeriod } from "@/lib/scheduling/types";

export const MS_MIN = 60_000;
export const MS_H = 3_600_000;

export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.min(1439, Math.max(0, h * 60 + m));
}

export function minutesToHHmm(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function localMinutesOfDay(ms: number): number {
  const d = dayjs(ms);
  return d.hour() * 60 + d.minute();
}

/** Inclusive overlap of [a0,a1] and [b0,b1] on the timeline */
export function rangesOverlap(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
): boolean {
  return a0 < b1 && b0 < a1;
}

/**
 * Daily blackout as one or two intervals on the absolute timeline for the day of `dayMs`.
 * Midnight-spanning blackouts become [start, 24h) and [0, end).
 */
export function blackoutIntervalsForDay(
  blackout: BlackoutPeriod,
  dayMs: number,
): Array<{ start: number; end: number }> {
  const dayStart = dayjs(dayMs).startOf("day");
  const base = dayStart.valueOf();
  const s = blackout.startMinutes;
  const e = blackout.endMinutes;

  if (s === e) return [];

  if (s < e) {
    return [
      {
        start: base + s * MS_MIN,
        end: base + e * MS_MIN,
      },
    ];
  }

  return [
    { start: base + s * MS_MIN, end: base + 24 * 60 * MS_MIN },
    { start: base, end: base + e * MS_MIN },
  ];
}

/** All blackout intervals touching the range [rangeStart, rangeEnd] */
export function collectBlackoutIntervals(
  blackouts: BlackoutPeriod[],
  rangeStart: number,
  rangeEnd: number,
): Array<{ blackout: BlackoutPeriod; start: number; end: number }> {
  const out: Array<{ blackout: BlackoutPeriod; start: number; end: number }> =
    [];
  const startDay = dayjs(rangeStart).startOf("day");
  const endDay = dayjs(rangeEnd).startOf("day");
  let d = startDay;
  while (d.valueOf() <= endDay.valueOf()) {
    const dayMs = d.valueOf();
    for (const b of blackouts) {
      for (const interval of blackoutIntervalsForDay(b, dayMs)) {
        if (rangesOverlap(rangeStart, rangeEnd, interval.start, interval.end)) {
          out.push({ blackout: b, start: interval.start, end: interval.end });
        }
      }
    }
    d = d.add(1, "day");
  }
  return out;
}

export function activeRangeOverlapsBlackout(
  startMs: number,
  endMs: number,
  blackouts: BlackoutPeriod[],
): Array<{ blackout: BlackoutPeriod; overlapStart: number; overlapEnd: number }> {
  const hits: Array<{
    blackout: BlackoutPeriod;
    overlapStart: number;
    overlapEnd: number;
  }> = [];
  const intervals = collectBlackoutIntervals(blackouts, startMs, endMs);
  for (const { blackout, start, end } of intervals) {
    const o0 = Math.max(startMs, start);
    const o1 = Math.min(endMs, end);
    if (o0 < o1) {
      hits.push({ blackout, overlapStart: o0, overlapEnd: o1 });
    }
  }
  return hits;
}

/** Next local time at or after `afterMs` when blackout has ended */
export function nextFreeMinuteAfterBlackout(
  afterMs: number,
  blackout: BlackoutPeriod,
): number {
  const d = dayjs(afterMs);
  const dayStart = d.startOf("day").valueOf();
  const endToday = dayStart + blackout.endMinutes * MS_MIN;
  const startToday = dayStart + blackout.startMinutes * MS_MIN;

  if (blackout.startMinutes < blackout.endMinutes) {
    if (afterMs < endToday) return endToday;
    return afterMs;
  }

  const inEvening =
    afterMs >= startToday && afterMs < dayStart + 24 * 60 * MS_MIN;
  const inMorning = afterMs >= dayStart && afterMs < endToday;
  if (inEvening) {
    return dayStart + 24 * 60 * MS_MIN + blackout.endMinutes * MS_MIN;
  }
  if (inMorning) return endToday;
  return afterMs;
}

export function formatTimeShort(ms: number): string {
  return dayjs(ms).format("HH:mm");
}

export function formatDayLabel(ms: number): string {
  return dayjs(ms).format("ddd D/M");
}
