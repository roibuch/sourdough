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
    card: "border-border-subtle bg-surface",
    dot: "border-accent/40 bg-accent-muted text-accent",
    badge: "bg-accent-muted text-accent",
  },
  wait: {
    card: "border-border-subtle bg-surface-elevated",
    dot: "border-border bg-stone-100 text-text-muted",
    badge: "bg-stone-100 text-text-secondary",
  },
  milestone: {
    card: "border-accent/30 bg-accent-muted ring-1 ring-accent/15",
    dot: "border-accent bg-accent text-white shadow-sm",
    badge: "bg-accent text-white",
  },
};
