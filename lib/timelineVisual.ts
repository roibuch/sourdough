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
    card: "border-border-subtle bg-surface-elevated shadow-sm",
    dot: "border-accent-gold/70 bg-accent-gold-muted text-accent-gold",
    badge: "bg-accent-gold-muted text-accent-gold",
  },
  wait: {
    card: "border-border-subtle bg-surface shadow-sm",
    dot: "border-border-subtle bg-surface-elevated text-text-secondary",
    badge: "bg-surface-elevated text-text-secondary",
  },
  milestone: {
    card: "border-accent-gold/50 bg-accent-gold-muted/40 ring-1 ring-accent-gold/25 shadow-sm",
    dot: "border-accent-gold bg-accent-gold text-background shadow-md shadow-accent-gold/20",
    badge: "bg-accent-gold-muted text-accent-gold",
  },
};
