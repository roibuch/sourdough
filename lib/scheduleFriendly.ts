import type { TimelinePlan } from "./types";

/** Active work should stay in this window (local time) */
export const ACTIVE_HOUR_START = 7;
export const ACTIVE_HOUR_END = 21;

export function isNightActiveHour(hour: number): boolean {
  return hour >= ACTIVE_HOUR_END || hour < ACTIVE_HOUR_START;
}

/** Steps 0–3: starter, autolyse, bulk, preshape — not overnight retard */
export function planHasNightActiveWork(plan: TimelinePlan): boolean {
  for (let i = 0; i <= 3 && i < plan.steps.length; i++) {
    const h = new Date(plan.steps[i].start).getHours();
    if (isNightActiveHour(h)) return true;
  }
  return false;
}

export function nightWorkDescription(plan: TimelinePlan): string | null {
  for (let i = 0; i <= 3 && i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const h = new Date(step.start).getHours();
    if (isNightActiveHour(h)) {
      return `«${step.title}» ב־${String(h).padStart(2, "0")}:00 — מחוץ לשעות העבודה הנוחות (${ACTIVE_HOUR_START}:00–${ACTIVE_HOUR_END}:00).`;
    }
  }
  return null;
}

const MS_H = 3_600_000;
const MS_30 = 30 * 60_000;

/** Shift bake target later until active steps fall in daytime (max ~36h) */
export function shiftBakeDateUntilFriendly(
  bakeDate: Date,
  buildPlan: (bake: Date) => TimelinePlan | null,
): { date: Date; plan: TimelinePlan } | null {
  const maxSteps = 72;
  for (let i = 0; i < maxSteps; i++) {
    const candidate = new Date(bakeDate.getTime() + i * MS_30);
    const plan = buildPlan(candidate);
    if (plan && !planHasNightActiveWork(plan)) {
      return { date: candidate, plan };
    }
  }
  return null;
}

/** Bake-end hours we offer in presets (no late night finishes) */
export const FRIENDLY_BAKE_HOURS = [9, 10, 11, 12, 13, 17, 18, 19] as const;
