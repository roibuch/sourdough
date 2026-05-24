import { describe, expect, it } from "vitest";
import { buildFlourMix } from "@/lib/flour";
import {
  calculateAdjustedTime,
  calculateRequiredStarterPct,
  calculateRequiredTemp,
  FERMENTATION_RATE_PER_C,
  isDoughTempInSafeRange,
  suggestBlackoutFermentationBypass,
} from "@/lib/scheduling/fermentationTemp";

describe("calculateAdjustedTime", () => {
  it("returns base time when temps match", () => {
    expect(calculateAdjustedTime(6, 22, 22)).toBe(6);
  });

  it("lengthens bulk when target temp is cooler", () => {
    const t = calculateAdjustedTime(6, 22, 20);
    expect(t).toBeCloseTo(6 * Math.pow(FERMENTATION_RATE_PER_C, 2), 2);
  });

  it("shortens bulk when target temp is warmer", () => {
    const t = calculateAdjustedTime(6, 22, 24);
    expect(t).toBeCloseTo(6 * Math.pow(FERMENTATION_RATE_PER_C, -2), 2);
  });
});

describe("calculateRequiredTemp", () => {
  it("inverts calculateAdjustedTime", () => {
    const baseH = 6;
    const baseT = 22;
    const targetT = 19.5;
    const targetH = calculateAdjustedTime(baseH, baseT, targetT);
    const back = calculateRequiredTemp(baseH, baseT, targetH);
    expect(back).toBeCloseTo(targetT, 1);
  });

  it("returns base temp when target time equals base time", () => {
    expect(calculateRequiredTemp(6, 22, 6)).toBe(22);
  });
});

describe("suggestBlackoutFermentationBypass", () => {
  it("suggests lower dough temp when delay fits safe range", () => {
    const start = new Date("2026-05-22T12:00:00").getTime();
    const free = new Date("2026-05-22T14:30:00").getTime();
    const s = suggestBlackoutFermentationBypass({
      blockStartMs: start,
      freeStartMs: free,
      baseBulkHours: 5,
      baseTempC: 22,
      starterPct: 20,
      flourPcts: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    expect(s).not.toBeNull();
    expect(s!.strategy).toBe("temperature");
    expect(s!.requiredDoughTempC).toBeLessThan(22);
    expect(isDoughTempInSafeRange(s!.requiredDoughTempC!)).toBe(true);
    expect(s!.targetBulkHours).toBeCloseTo(7.5, 1);
  });

  it("falls back to starter when required temp is below minimum", () => {
    const start = new Date("2026-05-22T08:00:00").getTime();
    const free = new Date("2026-05-25T08:00:00").getTime();
    const s = suggestBlackoutFermentationBypass({
      blockStartMs: start,
      freeStartMs: free,
      baseBulkHours: 4,
      baseTempC: 22,
      starterPct: 20,
      flourPcts: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    expect(s).not.toBeNull();
    expect(s!.strategy).toBe("starter");
    expect(s!.suggestedStarterPct).toBeDefined();
    expect(s!.requiredDoughTempC!).toBeLessThan(4);
  });
});

describe("calculateRequiredStarterPct", () => {
  it("suggests lower inoculation for longer bulk", () => {
    const mix = buildFlourMix([100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const pct = calculateRequiredStarterPct(8, mix);
    expect(pct).toBeLessThan(15);
  });
});
