import type { TimelinePlan, TimelineStep } from "@/lib/types";

export type LifecyclePhaseId =
  | "starter"
  | "autolyse"
  | "bulk"
  | "retard"
  | "bake";

export interface LifecycleSegment {
  id: LifecyclePhaseId;
  label: string;
  durationMs: number;
  percent: number;
  /** Tailwind background utility */
  colorClass: string;
}

const PHASE_META: Record<
  LifecyclePhaseId,
  { label: string; colorClass: string }
> = {
  starter: { label: "מחמצת", colorClass: "bg-amber-400" },
  autolyse: { label: "אוטוליזה", colorClass: "bg-sky-400" },
  bulk: { label: "Bulk", colorClass: "bg-orange-400" },
  retard: { label: "מקרר", colorClass: "bg-stone-400" },
  bake: { label: "אפייה", colorClass: "bg-crust" },
};

export function classifyStepPhase(title: string): LifecyclePhaseId {
  if (title.includes("אוטוליזה")) return "autolyse";
  if (title.includes("הוספת מחמצת") || title.includes("עיצוב"))
    return "bulk";
  if (title.includes("מקרר") || title.includes("התפחה איטית")) return "retard";
  if (title.includes("אפייה") || title.includes("חימום")) return "bake";
  return "starter";
}

function stepDurationMs(
  steps: TimelineStep[],
  index: number,
  bakeEndMs: number,
): number {
  const start = steps[index].start;
  const end =
    index + 1 < steps.length ? steps[index + 1].start : bakeEndMs;
  return Math.max(0, end - start);
}

/** Proportional segments for the dough lifecycle bar */
export function buildLifecycleSegments(
  plan: TimelinePlan,
): LifecycleSegment[] {
  const durations = new Map<LifecyclePhaseId, number>();

  plan.steps.forEach((step, i) => {
    const phase = classifyStepPhase(step.title);
    const ms = stepDurationMs(plan.steps, i, plan.summary.bakeEnd);
    durations.set(phase, (durations.get(phase) ?? 0) + ms);
  });

  const total = [...durations.values()].reduce((s, v) => s + v, 0);
  if (total <= 0) return [];

  const order: LifecyclePhaseId[] = [
    "starter",
    "autolyse",
    "bulk",
    "retard",
    "bake",
  ];

  return order
    .filter((id) => (durations.get(id) ?? 0) > 0)
    .map((id) => {
      const durationMs = durations.get(id) ?? 0;
      return {
        id,
        label: PHASE_META[id].label,
        durationMs,
        percent: (durationMs / total) * 100,
        colorClass: PHASE_META[id].colorClass,
      };
    });
}

export function formatSegmentDuration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} דק׳`;
  }
  if (hours < 10) {
    return `${Math.round(hours * 10) / 10} שע׳`;
  }
  return `${Math.round(hours)} שע׳`;
}
