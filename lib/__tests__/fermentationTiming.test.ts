import { describe, expect, it } from "vitest";
import { buildFlourMix } from "@/lib/flour";
import {
  estimateBulkFermentationHours,
  pickStarterFeedRatio,
  starterPeakHours,
  starterPctForBulkHours,
} from "@/lib/fermentationTiming";
import { calculateStarterFeed, pickRatio } from "@/lib/starter";
import { getTimelineBulkHours } from "@/lib/timeline";

describe("starterPeakHours", () => {
  it("1:1:1 peaks ~5h at 22°C", () => {
    expect(starterPeakHours(1, 22)).toBe(5);
  });

  it("1:5:5 peaks ~12h at 22°C", () => {
    expect(starterPeakHours(5, 22)).toBe(12);
  });

  it("warmer kitchen shortens peak time", () => {
    expect(starterPeakHours(1, 26)).toBeLessThan(starterPeakHours(1, 22));
  });
});

describe("pickStarterFeedRatio", () => {
  it("picks 1:1:1 for short windows", () => {
    const p = pickStarterFeedRatio(4, 22);
    expect(p.flourMult).toBe(1);
  });

  it("picks 1:2:2 for ~8h at 22°C", () => {
    const p = pickStarterFeedRatio(8, 22);
    expect(p.flourMult).toBe(2);
  });

  it("picks 1:3:3 for ~9h at 22°C", () => {
    const p = pickStarterFeedRatio(9, 22);
    expect(p.flourMult).toBe(3);
  });

  it("picks 1:5:5 for long overnight windows", () => {
    const p = pickStarterFeedRatio(12, 22);
    expect(p.flourMult).toBe(5);
  });
});

describe("estimateBulkFermentationHours", () => {
  it("20% starter @ 22°C is ~7.5h", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0]);
    expect(estimateBulkFermentationHours(20, 22, mix)).toBe(7.5);
  });

  it("warmer dough ferments faster", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0]);
    expect(estimateBulkFermentationHours(20, 26, mix)).toBeLessThan(
      estimateBulkFermentationHours(20, 22, mix),
    );
  });

  it("lower inoculation lengthens bulk", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0]);
    expect(estimateBulkFermentationHours(10, 22, mix)).toBeGreaterThan(
      estimateBulkFermentationHours(20, 22, mix),
    );
  });
});

describe("getTimelineBulkHours", () => {
  it("matches fermentation timing model", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0]);
    expect(getTimelineBulkHours(20, mix, 22)).toBe(7.5);
  });
});

describe("calculateStarterFeed", () => {
  it("covers recipe need with buffer", () => {
    const feed = calculateStarterFeed({
      needG: 100,
      keepInJarG: 30,
      roomTempC: 22,
      hoursToAutolyse: 8,
      ratioPreset: "auto",
    });
    expect(feed).not.toBeNull();
    expect(feed!.totalMixG).toBeGreaterThanOrEqual(130);
    expect(feed!.expectedPeakHours).toBeGreaterThan(0);
    expect(feed!.ratioLabel).toContain("1");
  });

  it("pickRatio aligns with auto feed", () => {
    const r = pickRatio(8, 22);
    expect(r.flourMult).toBe(2);
    expect(r.peakHours).toBe(7);
  });
});

describe("starterPctForBulkHours", () => {
  it("suggests less starter for longer bulk targets", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0]);
    expect(starterPctForBulkHours(10, 22, mix)).toBeLessThan(
      starterPctForBulkHours(6, 22, mix),
    );
  });
});
