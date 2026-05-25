import { describe, expect, it } from "vitest";
import { buildBakingGuidePlan } from "@/lib/bakingGuidePlan";
import { buildFlourMix } from "@/lib/flour";

describe("buildBakingGuidePlan", () => {
  it("returns steps with approximate durations", () => {
    const mix = buildFlourMix([40, 40, 10, 10, 0, 0, 0]);
    const plan = buildBakingGuidePlan({
      mix,
      waterPct: 72,
      starterPct: 20,
      roomTempC: 22,
      hoursToAutolyse: 5,
      coldRetardHours: 12,
      fermentationPace: "standard",
    });
    expect(plan.steps.length).toBeGreaterThanOrEqual(6);
    expect(plan.totalHoursLabel).toMatch(/שעות/);
    expect(plan.workflow.foldCount).toBeTruthy();
    expect(plan.steps[0].duration).toMatch(/שעות|דק/);
  });

  it("shortens windows in express pace", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0, 0]);
    const standard = buildBakingGuidePlan({
      mix,
      waterPct: 70,
      starterPct: 20,
      roomTempC: 22,
      hoursToAutolyse: 6,
      coldRetardHours: 12,
      fermentationPace: "standard",
    });
    const express = buildBakingGuidePlan({
      mix,
      waterPct: 70,
      starterPct: 20,
      roomTempC: 22,
      hoursToAutolyse: 6,
      coldRetardHours: 12,
      fermentationPace: "express",
    });
    expect(express.adjusted.coldRetardHours).toBeLessThanOrEqual(
      standard.adjusted.coldRetardHours,
    );
  });
});
