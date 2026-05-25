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
    card: "border-border-subtle bg-surface-elevated/80",
    dot: "border-accent-gold/60 bg-accent-gold-muted text-accent-gold",
    badge: "bg-accent-gold-muted text-accent-gold",
  },
  wait: {
    card: "border-border-subtle bg-surface/90",
    dot: "border-text-muted/40 bg-surface-elevated text-text-secondary",
    badge: "bg-surface-elevated text-text-secondary",
  },
  milestone: {
    card: "border-accent-gold/40 bg-accent-gold-muted/30 ring-1 ring-accent-gold/20",
    dot: "border-accent-gold bg-accent-gold text-background shadow-md shadow-accent-gold/20",
    badge: "bg-accent-gold-muted text-accent-gold",
  },
};
