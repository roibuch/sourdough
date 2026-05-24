import type { BuildTimelineInput } from "@/lib/timeline";
import type { TimelinePlan, TimelineStep } from "@/lib/types";

/** Recurring daily window — active work must not overlap this interval */
export interface BlackoutPeriod {
  id: string;
  label: string;
  /** Minutes from local midnight, 0–1439 */
  startMinutes: number;
  /** Minutes from local midnight; if < startMinutes, window crosses midnight */
  endMinutes: number;
}

export type ScheduleBlockKind =
  | "starter"
  | "autolyse"
  | "bulk"
  | "fold"
  | "preshape"
  | "retard"
  | "bake";

/** Whether the baker must be present / hands-on */
export type BlockActivity = "active" | "passive";

export interface ScheduledBlock {
  id: string;
  kind: ScheduleBlockKind;
  activity: BlockActivity;
  label: string;
  startMs: number;
  endMs: number;
  /** Link back to plan step index when applicable */
  stepIndex?: number;
  /** Fold index inside bulk */
  foldIndex?: number;
}

export interface BlackoutViolation {
  blockId: string;
  blockLabel: string;
  blackoutId: string;
  blackoutLabel: string;
  overlapStartMs: number;
  overlapEndMs: number;
}

export interface ScheduleAdaptation {
  id: string;
  severity: "info" | "warning";
  title: string;
  message: string;
  /** Suggested parameter deltas applied by the solver */
  waterTempDeltaC?: number;
  bulkHoursDelta?: number;
  roomTempDeltaC?: number;
  /** Target dough / water temperature (°C) from fermentation model */
  doughTempC?: number;
  /** Suggested starter % when dough temp is out of safe range */
  suggestedStarterPct?: number;
  proposedBlockId?: string;
  proposedStartMs?: number;
}

export interface SchedulingEngineInput extends BuildTimelineInput {
  blackouts: BlackoutPeriod[];
  /** Earliest moment the schedule may begin (default: now) */
  earliestStartMs?: number;
  /** Reference dough temp for bulk duration scaling (°C) */
  referenceBulkTempC?: number;
  /** Current planned water temp from DDT calc, if any */
  waterTempC?: number;
}

export interface AdaptiveScheduleResult {
  plan: TimelinePlan;
  blocks: ScheduledBlock[];
  violations: BlackoutViolation[];
  adaptations: ScheduleAdaptation[];
  /** Applied deltas vs raw backward timeline */
  applied: {
    bakeShiftMs: number;
    bulkHoursDelta: number;
    waterTempDeltaC: number;
    preshapeShiftMs: number;
  };
  feasible: boolean;
}

export type DraggableBlockId =
  | "starter"
  | "autolyse"
  | "bulk"
  | "preshape";

export interface BlockDragInput {
  blockId: DraggableBlockId;
  newStartMs: number;
}
