import { describe, expect, it } from "vitest";
import {
  adjustFermentationTimeQ10,
  calculateAutolyseStartTime,
  getBaseBulkFermentationHours,
  getBaseTimeToPeakHours,
  getBulkFermentationHours,
  getTimeToPeakHours,
  pickFeedingRatioForWindow,
  recommendFeedingRatio,
  REFERENCE_TEMP_C,
} from "@/lib/sourdoughFermentation";

describe("getBaseTimeToPeakHours", () => {
  it("matches table at 22°C anchors", () => {
    expect(getBaseTimeToPeakHours(1)).toBe(4);
    expect(getBaseTimeToPeakHours(2)).toBe(6);
    expect(getBaseTimeToPeakHours(3)).toBe(7.5);
    expect(getBaseTimeToPeakHours(4)).toBe(9);
    expect(getBaseTimeToPeakHours(5)).toBe(11);
  });
});

describe("adjustFermentationTimeQ10", () => {
  it("applies Q10 2.1 from 22°C to 26°C (faster)", () => {
    const t22 = 5;
    const t26 = adjustFermentationTimeQ10(t22, 22, 26);
    expect(t26).toBeLessThan(t22);
    expect(t26).toBeCloseTo(t22 * Math.pow(2.1, -0.4), 2);
  });

  it("is identity when temps match", () => {
    expect(adjustFermentationTimeQ10(6, 22, 22)).toBe(6);
  });
});

describe("getBaseBulkFermentationHours", () => {
  it("matches starter % table", () => {
    expect(getBaseBulkFermentationHours(10)).toBe(7);
    expect(getBaseBulkFermentationHours(15)).toBe(6);
    expect(getBaseBulkFermentationHours(20)).toBe(5);
    expect(getBaseBulkFermentationHours(25)).toBe(4);
  });
});

describe("getBulkFermentationHours", () => {
  it("shortens bulk at warmer dough temp", () => {
    const cold = getBulkFermentationHours(20, 18).hours;
    const warm = getBulkFermentationHours(20, 26).hours;
    expect(warm).toBeLessThan(cold);
  });
});

describe("calculateAutolyseStartTime", () => {
  it("subtracts autolyse duration from peak time", () => {
    const peak = new Date("2026-05-20T10:00:00");
    const start = calculateAutolyseStartTime({
      expectedStarterPeakTime: peak,
      autolyseDurationHours: 1,
    });
    expect(start.getTime()).toBe(peak.getTime() - 3_600_000);
  });

  it("supports minutes", () => {
    const peak = new Date("2026-05-20T10:00:00");
    const start = calculateAutolyseStartTime({
      expectedStarterPeakTime: peak,
      autolyseDurationMinutes: 30,
    });
    expect(start.getTime()).toBe(peak.getTime() - 30 * 60 * 1000);
  });
});

describe("recommendFeedingRatio", () => {
  it("recommends 1:2:2 for ~6h", () => {
    const r = recommendFeedingRatio(6, REFERENCE_TEMP_C);
    expect(r.ratio.flourMultiplier).toBe(2);
  });

  it("recommends 1:3:3 with alternate for ~8h", () => {
    const r = recommendFeedingRatio(8, REFERENCE_TEMP_C);
    expect(r.ratio.flourMultiplier).toBe(3);
    expect(r.alternate?.ratio.flourMultiplier).toBe(4);
  });

  it("recommends 1:5:5 for ~10h", () => {
    const r = recommendFeedingRatio(10, REFERENCE_TEMP_C);
    expect(r.ratio.flourMultiplier).toBe(5);
  });

  it("recommends 1:6:6 for ~12h", () => {
    const r = recommendFeedingRatio(12, REFERENCE_TEMP_C);
    expect(r.ratio.flourMultiplier).toBe(6);
  });
});

describe("pickFeedingRatioForWindow", () => {
  it("fits peak inside 8h window at 22°C", () => {
    const p = pickFeedingRatioForWindow(8, 22);
    expect(p.peakHours).toBeLessThanOrEqual(7.5);
    expect(p.ratio.flourMultiplier).toBeGreaterThanOrEqual(2);
  });
});

describe("getTimeToPeakHours", () => {
  it("returns 4h for 1:1:1 at 22°C", () => {
    expect(getTimeToPeakHours(1, 22).hours).toBe(4);
  });
});
