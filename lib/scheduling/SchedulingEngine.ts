/**
 * Constraint-based adaptive scheduling for sourdough baking.
 *
 * ## Blackout periods
 *
 * A blackout is a **recurring daily window** (e.g. 23:00–06:30) during which
 * **active** work must not occur: starter feed, autolyse, mixing, folds, shaping.
 * Passive steps (fridge retard, oven bake) may overlap blackouts.
 *
 * For each scheduled active block `[startMs, endMs]` the engine collects every
 * blackout interval on that calendar day (splitting midnight-spanning windows)
 * and tests overlap via `activeRangeOverlapsBlackout`. Folds inside bulk are
 * checked as separate active sub-blocks.
 *
 * ## Solving strategy (when violations exist)
 *
 * 1. **Bake shift** — move target bake end forward in 15-minute steps (up to ~36h)
 *    until active steps clear blackouts (similar to legacy `shiftBakeDateUntilFriendly`).
 * 2. **Fermentation temperature** — extend bulk by the exact hours needed to clear a
 *    blackout, then solve for dough temp (15% rate per °C) or starter % if temp is
 *    outside 4–30°C.
 * 3. **Preshape snap** — move shaping start to the next minute after the conflicting
 *    blackout ends, then rebuild backward.
 *
 * Suggestions in `adaptations[]` explain what was applied or what the baker can do manually.
 */

import {
  buildReverseTimeline,
  formatScheduleTime,
  getTimelineAnchors,
  type BuildTimelineInput,
} from "@/lib/timeline";
import type { TimelinePlan } from "@/lib/types";
import { heContent, t } from "@/lib/content";
import {
  calculateAdjustedTime,
  formatBlackoutBypassMessage,
  suggestBlackoutFermentationBypass,
} from "@/lib/scheduling/fermentationTemp";
import {
  activeRangeOverlapsBlackout,
  formatTimeShort,
  MS_H,
  MS_MIN,
  nextFreeMinuteAfterBlackout,
  parseTimeToMinutes,
} from "@/lib/scheduling/timeUtils";
import type {
  AdaptiveScheduleResult,
  BlackoutPeriod,
  BlackoutViolation,
  BlockDragInput,
  DraggableBlockId,
  ScheduledBlock,
  ScheduleAdaptation,
  SchedulingEngineInput,
} from "@/lib/scheduling/types";

const MS_15 = 15 * MS_MIN;
const PRESHAPE_H = 0.5;
const BAKE_H = 1;
const REFERENCE_BULK_TEMP_C = 22;

const STEP_KIND: Array<{
  index: number;
  kind: ScheduledBlock["kind"];
  activity: ScheduledBlock["activity"];
}> = [
  { index: 0, kind: "starter", activity: "active" },
  { index: 1, kind: "autolyse", activity: "active" },
  { index: 2, kind: "bulk", activity: "active" },
  { index: 3, kind: "preshape", activity: "active" },
  { index: 4, kind: "retard", activity: "passive" },
  { index: 5, kind: "bake", activity: "passive" },
];

const sch = heContent.scheduling;

export const DEFAULT_BLACKOUTS: BlackoutPeriod[] = [
  {
    id: "sleep",
    label: sch.blackouts.sleep,
    startMinutes: parseTimeToMinutes("23:00"),
    endMinutes: parseTimeToMinutes("06:30"),
  },
  {
    id: "work",
    label: sch.blackouts.work,
    startMinutes: parseTimeToMinutes("08:00"),
    endMinutes: parseTimeToMinutes("14:00"),
  },
];

function parseDurationHours(label: string): number {
  if (label.includes("30 דק")) return 0.5;
  const m = label.match(/([\d.]+)\s*שע/);
  if (m) return parseFloat(m[1]);
  return 1;
}

function planToBlocks(plan: TimelinePlan): ScheduledBlock[] {
  const blocks: ScheduledBlock[] = [];

  for (const meta of STEP_KIND) {
    const step = plan.steps[meta.index];
    if (!step) continue;
    const durationH = parseDurationHours(step.duration);
    const endMs = step.start + durationH * MS_H;
    blocks.push({
      id: meta.kind,
      kind: meta.kind,
      activity: meta.activity,
      label: step.title,
      startMs: step.start,
      endMs,
      stepIndex: meta.index,
    });

    if (meta.kind === "bulk" && plan.schedule?.folds.length) {
      plan.schedule.folds.forEach((fold, i) => {
        const foldEnd = fold.ts + 5 * MS_MIN;
        blocks.push({
          id: `fold-${i + 1}`,
          kind: "fold",
          activity: "active",
          label: fold.short || `קיפול ${i + 1}`,
          startMs: fold.ts,
          endMs: foldEnd,
          stepIndex: meta.index,
          foldIndex: i,
        });
      });
    }
  }

  return blocks;
}

function findViolations(
  blocks: ScheduledBlock[],
  blackouts: BlackoutPeriod[],
): BlackoutViolation[] {
  const violations: BlackoutViolation[] = [];

  for (const block of blocks) {
    if (block.activity !== "active") continue;
    const hits = activeRangeOverlapsBlackout(
      block.startMs,
      block.endMs,
      blackouts,
    );
    for (const hit of hits) {
      violations.push({
        blockId: block.id,
        blockLabel: block.label,
        blackoutId: hit.blackout.id,
        blackoutLabel: hit.blackout.label,
        overlapStartMs: hit.overlapStart,
        overlapEndMs: hit.overlapEnd,
      });
    }
  }

  return violations;
}

function resolveBaseDoughTempC(input: SchedulingEngineInput): number {
  return (
    input.waterTempC ??
    input.referenceBulkTempC ??
    input.roomTemp ??
    REFERENCE_BULK_TEMP_C
  );
}

function tryFermentationBlackoutBypass(
  input: SchedulingEngineInput,
  working: SchedulingEngineInput,
  plan: TimelinePlan,
  violations: BlackoutViolation[],
  applied: AdaptiveScheduleResult["applied"],
): {
  plan: TimelinePlan;
  working: SchedulingEngineInput;
  violations: BlackoutViolation[];
  adaptations: ScheduleAdaptation[];
} | null {
  const blocks = planToBlocks(plan);
  const preshapeBlock = blocks.find((b) => b.id === "preshape");
  const targetViolation =
    violations.find((v) => v.blockId === "preshape") ??
    violations.find((v) => v.blockId === "bulk" || v.blockId.startsWith("fold-")) ??
    violations[0];
  if (!targetViolation || !preshapeBlock) return null;

  const blackout = input.blackouts.find(
    (b) => b.id === targetViolation.blackoutId,
  );
  if (!blackout) return null;

  const freeStart = nextFreeMinuteAfterBlackout(
    preshapeBlock.startMs,
    blackout,
  );
  const anchors = getTimelineAnchors(working);
  if (!anchors) return null;

  const baseTempC = resolveBaseDoughTempC(input);
  const suggestion = suggestBlackoutFermentationBypass({
    blockStartMs: preshapeBlock.startMs,
    freeStartMs: freeStart,
    baseBulkHours: anchors.bulkH,
    baseTempC,
    starterPct: working.starterPct,
    flourPcts: working.flourPcts,
  });
  if (!suggestion) return null;

  const { title, message } = formatBlackoutBypassMessage(
    suggestion,
    blackout.label,
    formatScheduleTime(freeStart),
  );

  const adaptations: ScheduleAdaptation[] = [];

  if (suggestion.strategy === "temperature" && suggestion.requiredDoughTempC != null) {
    const verifiedBulkH = calculateAdjustedTime(
      suggestion.baseBulkHours,
      baseTempC,
      suggestion.requiredDoughTempC,
    );
    const tempInput: SchedulingEngineInput = {
      ...working,
      bulkHours: verifiedBulkH,
    };
    const tempPlan = buildReverseTimeline(tempInput);
    if (!tempPlan) return null;
    const v2 = findViolations(planToBlocks(tempPlan), input.blackouts);
    const bulkDelta = verifiedBulkH - anchors.bulkH;
    adaptations.push({
      id: "dough-temp-bypass",
      severity: "info",
      title,
      message,
      doughTempC: suggestion.requiredDoughTempC,
      waterTempDeltaC: suggestion.waterTempDeltaC,
      bulkHoursDelta: bulkDelta,
      proposedBlockId: "preshape",
      proposedStartMs: freeStart,
    });
    return {
      plan: tempPlan,
      working: tempInput,
      violations: v2,
      adaptations,
    };
  }

  adaptations.push({
    id: "starter-bypass",
    severity: "warning",
    title,
    message,
    doughTempC: suggestion.requiredDoughTempC,
    suggestedStarterPct: suggestion.suggestedStarterPct,
    bulkHoursDelta: suggestion.targetBulkHours - suggestion.baseBulkHours,
    proposedBlockId: "preshape",
    proposedStartMs: freeStart,
  });

  return {
    plan,
    working,
    violations,
    adaptations,
  };
}

function buildResult(
  plan: TimelinePlan,
  blackouts: BlackoutPeriod[],
  applied: AdaptiveScheduleResult["applied"],
  adaptations: ScheduleAdaptation[],
): AdaptiveScheduleResult {
  const blocks = planToBlocks(plan);
  const violations = findViolations(blocks, blackouts);
  return {
    plan,
    blocks,
    violations,
    adaptations,
    applied,
    feasible: violations.length === 0,
  };
}

function emptyApplied(): AdaptiveScheduleResult["applied"] {
  return {
    bakeShiftMs: 0,
    bulkHoursDelta: 0,
    waterTempDeltaC: 0,
    preshapeShiftMs: 0,
  };
}

function cloneInput(input: SchedulingEngineInput): SchedulingEngineInput {
  return {
    ...input,
    blackouts: [...input.blackouts],
    flourPcts: [...input.flourPcts],
  };
}

function withBakeTime(input: SchedulingEngineInput, bake: Date): SchedulingEngineInput {
  const y = bake.getFullYear();
  const mo = String(bake.getMonth() + 1).padStart(2, "0");
  const d = String(bake.getDate()).padStart(2, "0");
  const h = String(bake.getHours()).padStart(2, "0");
  const mi = String(bake.getMinutes()).padStart(2, "0");
  return {
    ...input,
    targetBakeTime: `${y}-${mo}-${d}T${h}:${mi}`,
  };
}

export class SchedulingEngine {
  /**
   * Build a backward timeline, then resolve blackout conflicts with adaptive adjustments.
   */
  static buildAdaptivePlan(
    input: SchedulingEngineInput,
  ): AdaptiveScheduleResult | null {
    const base = buildReverseTimeline(input);
    if (!base) return null;

    const applied = emptyApplied();
    const adaptations: ScheduleAdaptation[] = [];
    let working = cloneInput(input);
    let plan = base;

    let blocks = planToBlocks(plan);
    let violations = findViolations(blocks, input.blackouts);

    if (violations.length === 0) {
      return buildResult(plan, input.blackouts, applied, adaptations);
    }

    const bakeEndMs = plan.summary.bakeEnd;
    const maxBakeShifts = 96;

    for (let i = 1; i <= maxBakeShifts; i++) {
      const shiftedBake = new Date(bakeEndMs + i * MS_15);
      const candidateInput = withBakeTime(working, shiftedBake);
      const candidatePlan = buildReverseTimeline(candidateInput);
      if (!candidatePlan) continue;
      const v = findViolations(
        planToBlocks(candidatePlan),
        input.blackouts,
      );
      if (v.length === 0) {
        applied.bakeShiftMs = i * MS_15;
        adaptations.push({
          id: "bake-shift",
          severity: "info",
          title: sch.adaptations.bakeShift.title,
          message: t(sch.adaptations.bakeShift.message, {
            minutes: Math.round((i * 15) / 60),
          }),
        });
        return buildResult(
          candidatePlan,
          input.blackouts,
          applied,
          adaptations,
        );
      }
    }

    const fermentationBypass = tryFermentationBlackoutBypass(
      input,
      working,
      plan,
      violations,
      applied,
    );
    if (fermentationBypass) {
      const prevCount = violations.length;
      working = fermentationBypass.working;
      plan = fermentationBypass.plan;
      violations = fermentationBypass.violations;
      adaptations.push(...fermentationBypass.adaptations);
      const tempAdapt = fermentationBypass.adaptations.find(
        (a) => a.id === "dough-temp-bypass",
      );
      if (tempAdapt) {
        applied.bulkHoursDelta = tempAdapt.bulkHoursDelta ?? 0;
        applied.waterTempDeltaC = tempAdapt.waterTempDeltaC ?? 0;
      }
      if (violations.length === 0) {
        return buildResult(plan, input.blackouts, applied, adaptations);
      }
      if (violations.length < prevCount) {
        /* continue with remaining violations */
      }
    }

    if (violations.length > 0) {
      const target =
        violations.find((v) => v.blockId === "preshape") ?? violations[0];
      const block = planToBlocks(plan).find((b) => b.id === target.blockId);
      const blackout = input.blackouts.find((b) => b.id === target.blackoutId);
      if (block && blackout) {
        const freeStart = nextFreeMinuteAfterBlackout(
          block.startMs,
          blackout,
        );
        const shiftMs = freeStart - block.startMs;
        if (shiftMs > 0) {
          const dragged = SchedulingEngine.applyBlockDrag(
            { ...working, blackouts: input.blackouts },
            plan,
            { blockId: target.blockId as DraggableBlockId, newStartMs: freeStart },
          );
          if (dragged && dragged.violations.length < violations.length) {
            applied.preshapeShiftMs = shiftMs;
            adaptations.push({
              id: "preshape-snap",
              severity: "warning",
              title: sch.adaptations.preshapeSnap.title,
              message: t(sch.adaptations.preshapeSnap.message, {
                block: block.label,
                time: `${formatTimeShort(freeStart)} (${formatScheduleTime(freeStart)})`,
                blackout: blackout.label,
              }),
              proposedBlockId: block.id,
              proposedStartMs: freeStart,
            });
            return dragged;
          }
        }
      }
    }

    adaptations.push({
      id: "unresolved",
      severity: "warning",
      title: sch.adaptations.unresolved.title,
      message: sch.adaptations.unresolved.message,
    });

    return buildResult(plan, input.blackouts, applied, adaptations);
  }

  /**
   * User dragged an active block — map to `BuildTimelineInput` overrides the backward builder understands.
   */
  static applyBlockDrag(
    input: SchedulingEngineInput,
    currentPlan: TimelinePlan,
    drag: BlockDragInput,
  ): AdaptiveScheduleResult | null {
    const anchors = getTimelineAnchors(input);
    if (!anchors) return null;

    const bakeEndMs = currentPlan.summary.bakeEnd;
    const bulkH0 = anchors.bulkH;
    const starterPeakH = anchors.starterPeakH;
    const currentBlocks = planToBlocks(currentPlan);
    const draggedBlock = currentBlocks.find((b) => b.id === drag.blockId);
    const oldBlockStart =
      draggedBlock?.startMs ?? currentPlan.steps[3]?.start ?? anchors.tBulkEnd;

    let modified: SchedulingEngineInput = { ...input };
    let bulkH = bulkH0;
    let bakeShiftMs = 0;

    switch (drag.blockId) {
      case "starter": {
        const gapH = (anchors.tAutolyseStart - drag.newStartMs) / MS_H;
        if (gapH < 2) {
          return buildResult(currentPlan, input.blackouts, emptyApplied(), [
            {
              id: "drag-infeasible",
              severity: "warning",
              title: sch.adaptations.dragInfeasibleTitle,
              message: sch.adaptations.dragInfeasibleStarter,
            },
          ]);
        }
        modified = {
          ...modified,
          hoursToAutolyse: Math.round(gapH * 10) / 10,
          starterPeakHours: Math.round(gapH * 10) / 10,
        };
        break;
      }
      case "autolyse": {
        const newStarter = drag.newStartMs - starterPeakH * MS_H;
        const gapH = (drag.newStartMs - newStarter) / MS_H;
        modified = {
          ...modified,
          hoursToAutolyse: Math.max(2, Math.round(gapH * 10) / 10),
          starterPeakHours: Math.max(2, Math.round(gapH * 10) / 10),
        };
        break;
      }
      case "bulk": {
        const newBulkH = (anchors.tBulkEnd - drag.newStartMs) / MS_H;
        if (newBulkH < 2) {
          return buildResult(currentPlan, input.blackouts, emptyApplied(), [
            {
              id: "drag-infeasible",
              severity: "warning",
              title: sch.adaptations.dragInfeasibleTitle,
              message: sch.adaptations.dragInfeasibleBulk,
            },
          ]);
        }
        bulkH = newBulkH;
        modified = { ...modified, bulkHours: Math.round(bulkH * 10) / 10 };
        break;
      }
      case "preshape": {
        const deltaMs = drag.newStartMs - oldBlockStart;
        if (Math.abs(deltaMs) < MS_MIN) break;

        let newBakeEndMs = bakeEndMs + deltaMs;
        const tRetardStart = drag.newStartMs + PRESHAPE_H * MS_H;
        let tBakeStart = newBakeEndMs - BAKE_H * MS_H;
        let requiredRetardH = (tBakeStart - tRetardStart) / MS_H;
        if (requiredRetardH < 4) {
          const extraMs = (4 - requiredRetardH) * MS_H;
          newBakeEndMs += extraMs;
          bakeShiftMs = deltaMs + extraMs;
          tBakeStart = newBakeEndMs - BAKE_H * MS_H;
          requiredRetardH = (tBakeStart - tRetardStart) / MS_H;
        } else {
          bakeShiftMs = deltaMs;
        }
        modified = withBakeTime(modified, new Date(newBakeEndMs));
        modified = {
          ...modified,
          coldRetardHours: Math.max(
            4,
            Math.round(Math.max(requiredRetardH, 4) * 10) / 10,
          ),
        };
        break;
      }
      default:
        return null;
    }

    const earliest = input.earliestStartMs ?? Date.now();
    const preview = buildReverseTimeline(modified);
    if (!preview) return null;
    if (preview.summary.starterFeed < earliest) {
      return buildResult(currentPlan, input.blackouts, emptyApplied(), [
        {
          id: "drag-too-early",
          severity: "warning",
          title: sch.adaptations.dragTooEarlyTitle,
          message: t(sch.adaptations.dragTooEarly, {
            time: formatTimeShort(earliest),
          }),
        },
      ]);
    }

    const solved =
      drag.blockId === "preshape" || drag.blockId === "bulk"
        ? null
        : SchedulingEngine.buildAdaptivePlan(modified);
    const plan =
      drag.blockId === "preshape" || drag.blockId === "bulk"
        ? preview
        : (solved?.plan ?? preview);

    const adaptations: ScheduleAdaptation[] = [
      ...(solved?.adaptations.filter((a) => a.id !== "unresolved") ?? []),
      {
        id: "drag-applied",
        severity: "info",
        title: sch.adaptations.dragApplied.title,
        message: t(sch.adaptations.dragApplied.message, {
          block: drag.blockId,
          time: formatTimeShort(drag.newStartMs),
          bakeEnd: formatScheduleTime(plan.summary.bakeEnd),
        }),
        proposedBlockId: drag.blockId,
        proposedStartMs: drag.newStartMs,
      },
    ];

    if (Math.abs(bulkH - bulkH0) > 0.05) {
      adaptations.push({
        id: "drag-bulk-length",
        severity: "info",
        title: sch.adaptations.dragBulkLength.title,
        message: t(sch.adaptations.dragBulkLength.message, {
          hours: bulkH.toFixed(1),
          before: bulkH0.toFixed(1),
        }),
        bulkHoursDelta: bulkH - bulkH0,
      });
    }

    const preshapeShiftMs =
      drag.blockId === "preshape" ? drag.newStartMs - oldBlockStart : 0;

    const dragUsesPreview =
      drag.blockId === "preshape" || drag.blockId === "bulk";

    return buildResult(plan, input.blackouts, {
      bakeShiftMs: dragUsesPreview
        ? bakeShiftMs
        : bakeShiftMs + (solved?.applied.bakeShiftMs ?? 0),
      bulkHoursDelta: dragUsesPreview
        ? bulkH - bulkH0
        : bulkH - bulkH0 + (solved?.applied.bulkHoursDelta ?? 0),
      waterTempDeltaC: solved?.applied.waterTempDeltaC ?? 0,
      preshapeShiftMs,
    }, adaptations);
  }

  static defaultBlackouts(): BlackoutPeriod[] {
    return DEFAULT_BLACKOUTS.map((b) => ({ ...b }));
  }

  static referenceBulkTempC(): number {
    return REFERENCE_BULK_TEMP_C;
  }
}
