import { describe, expect, it } from "vitest";
import { buildForwardTimelineFromNow } from "@/lib/timeline";

describe("buildForwardTimelineFromNow", () => {
  it("builds chronological steps from startMs", () => {
    const start = new Date("2026-05-20T08:00:00").getTime();
    const plan = buildForwardTimelineFromNow({
      targetBakeTime: "",
      coldRetardHours: 12,
      starterPct: 20,
      waterPct: 73,
      roomTemp: 22,
      hoursToAutolyse: 6,
      flourPcts: [100, 0, 0, 0, 0, 0],
      startMs: start,
    });

    expect(plan.steps.length).toBe(6);
    expect(plan.steps[0].start).toBe(start);
    expect(plan.summary.bakeEnd).toBeGreaterThan(start);
    expect(plan.summary.totalHours).toBeGreaterThan(10);

    const bulk = plan.steps.find((s) => s.title.includes("התפחה ראשונית"));
    expect(bulk?.alarms?.length).toBeGreaterThan(0);
  });
});
