import type { TimelineStep } from "./types";

export type TimelineStepKind = "action" | "wait" | "milestone";

export function getTimelineStepKind(step: TimelineStep): TimelineStepKind {
  if (step.isTarget) return "milestone";
  if (step.alarms && step.alarms.length > 0) return "action";
  const title = step.title;
  if (
    title.includes("אוטוליזה") ||
    title.includes("מקרר") ||
    title.includes("התפחה איטית")
  ) {
    return "wait";
  }
  if (title.includes("אפייה") || title.includes("חימום")) return "milestone";
  return "action";
}

export const STEP_KIND_STYLES: Record<
  TimelineStepKind,
  { card: string; dot: string; badge: string }
> = {
  action: {
    card: "border-orange-200/80 bg-gradient-to-br from-orange-50/50 to-white",
    dot: "border-orange-400 bg-orange-100 text-orange-800",
    badge: "bg-orange-100 text-orange-900",
  },
  wait: {
    card: "border-stone-200 bg-stone-50/60",
    dot: "border-stone-300 bg-stone-100 text-stone-600",
    badge: "bg-stone-200/80 text-stone-700",
  },
  milestone: {
    card: "border-wheat bg-gradient-to-br from-wheat-muted to-white ring-1 ring-wheat/50",
    dot: "border-crust bg-crust text-dough shadow-md shadow-crust/25",
    badge: "bg-wheat-muted text-crust",
  },
};
