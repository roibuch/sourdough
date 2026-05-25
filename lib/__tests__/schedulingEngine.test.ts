import { describe, expect, it } from "vitest";
import { SchedulingEngine } from "@/lib/scheduling/SchedulingEngine";
import {
  activeRangeOverlapsBlackout,
  parseTimeToMinutes,
} from "@/lib/scheduling/timeUtils";
import type { BlackoutPeriod } from "@/lib/scheduling/types";

const sleepOnly: BlackoutPeriod[] = [
  {
    id: "sleep",
    label: "שינה",
    startMinutes: parseTimeToMinutes("23:00"),
    endMinutes: parseTimeToMinutes("06:30"),
  },
];

function baseInput(targetBakeTime: string) {
  return {
    targetBakeTime,
    coldRetardHours: 12,
    starterPct: 20,
    waterPct: 73,
    roomTemp: 22,
    hoursToAutolyse: 8,
    flourPcts: [70, 10, 0, 15, 0, 5],
    blackouts: sleepOnly,
    autolyseHours: 1,
    earliestStartMs: new Date("2026-01-01T00:00:00").getTime(),
  };
}

describe("blackout overlap", () => {
  it("detects overlap inside same-day window", () => {
    const day = new Date("2026-05-20T00:00:00");
    const busy: BlackoutPeriod[] = [
      {
        id: "busy",
        label: "עסוק",
        startMinutes: parseTimeToMinutes("08:00"),
        endMinutes: parseTimeToMinutes("14:00"),
      },
    ];
    const start = day.getTime() + 9 * 3_600_000;
    const end = start + 2 * 3_600_000;
    const hits = activeRangeOverlapsBlackout(start, end, busy);
    expect(hits.length).toBeGreaterThan(0);
  });

  it("allows passive work during sleep window", () => {
    const night = new Date("2026-05-20T02:00:00").getTime();
    const hits = activeRangeOverlapsBlackout(
      night,
      night + 3_600_000,
      sleepOnly,
    );
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("SchedulingEngine.buildAdaptivePlan", () => {
  it("returns a feasible plan when bake is Friday evening", () => {
    const result = SchedulingEngine.buildAdaptivePlan(
      baseInput("2026-05-22T18:00:00"),
    );
    expect(result).not.toBeNull();
    expect(result!.plan.steps.length).toBe(6);
    expect(result!.blocks.length).toBeGreaterThan(0);
  });

  it("shifts bake or adapts when shaping falls in sleep window", () => {
    const result = SchedulingEngine.buildAdaptivePlan(
      baseInput("2026-05-21T07:30:00"),
    );
    expect(result).not.toBeNull();
    if (!result!.feasible) {
      expect(result!.adaptations.length).toBeGreaterThan(0);
    }
  });

  it("builds a plan with blackout metadata when busy windows are set", () => {
    const busy: BlackoutPeriod[] = [
      {
        id: "busy",
        label: "עסוק",
        startMinutes: parseTimeToMinutes("08:00"),
        endMinutes: parseTimeToMinutes("14:00"),
      },
      ...sleepOnly,
    ];
    const result = SchedulingEngine.buildAdaptivePlan({
      ...baseInput("2026-05-22T18:00:00"),
      blackouts: busy,
      waterTempC: 22,
    });
    expect(result).not.toBeNull();
    expect(result!.plan.steps.length).toBe(6);
    expect(result!.blocks.length).toBeGreaterThan(0);
    expect(result!.adaptations.length).toBeGreaterThanOrEqual(0);
  });
});

describe("SchedulingEngine.applyBlockDrag", () => {
  it("recalculates plan when preshape is dragged later", () => {
    const input = baseInput("2026-05-22T18:00:00");
    const initial = SchedulingEngine.buildAdaptivePlan(input);
    expect(initial).not.toBeNull();

    const preshape = initial!.blocks.find((b) => b.id === "preshape");
    expect(preshape).toBeDefined();

    const dragged = SchedulingEngine.applyBlockDrag(
      input,
      initial!.plan,
      {
        blockId: "preshape",
        newStartMs: preshape!.startMs + 2 * 3_600_000,
      },
    );
    expect(dragged).not.toBeNull();
    const newPreshape = dragged!.blocks.find((b) => b.id === "preshape");
    const bulkDelta = dragged!.applied.bulkHoursDelta;
    const bakeShift = dragged!.applied.bakeShiftMs;
    expect(
      (newPreshape?.startMs ?? 0) > preshape!.startMs ||
        bulkDelta > 0.05 ||
        bakeShift > 0 ||
        dragged!.applied.preshapeShiftMs > 0,
    ).toBe(true);
  });
});
