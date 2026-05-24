import { describe, expect, it } from "vitest";
import {
  calculateDough,
  calculateDoughMasses,
  calculateWaterTempDDT,
  flourWeightFromTarget,
  getBassinageAmounts,
  getTrueHydration,
  totalBakersPercentFactor,
} from "@/lib/bakingMath";

describe("totalBakersPercentFactor", () => {
  it("sums flour (1) plus baker's percentages", () => {
    expect(
      totalBakersPercentFactor({ water: 73, starter: 20, salt: 2 }),
    ).toBeCloseTo(1.95, 5);
  });
});

describe("flourWeightFromTarget", () => {
  it("derives flour from target dough mass", () => {
    const flour = flourWeightFromTarget(1000, {
      water: 73,
      starter: 20,
      salt: 2,
    });
    expect(flour).toBeCloseTo(1000 / 1.95, 2);
  });

  it("returns 0 for invalid input", () => {
    expect(
      flourWeightFromTarget(0, { water: 73, starter: 20, salt: 2 }),
    ).toBe(0);
  });
});

describe("calculateDoughMasses / calculateDough", () => {
  const percentages = { water: 73, starter: 20, salt: 2 };

  it("masses sum approximately to target weight", () => {
    const result = calculateDoughMasses({
      targetDoughWeightG: 1000,
      percentages,
    });
    const sum = result.flour + result.water + result.starter + result.salt;
    expect(sum).toBeGreaterThanOrEqual(995);
    expect(sum).toBeLessThanOrEqual(1005);
  });

  it("matches deprecated calculateDough wrapper", () => {
    const fromMasses = calculateDoughMasses({
      targetDoughWeightG: 850,
      percentages,
    });
    const fromLegacy = calculateDough(850, 73, 20, 2);
    expect(fromLegacy).toEqual(fromMasses);
  });

  it("computes true hydration with starter at 100% hydration", () => {
    const { flour, water, starter, trueHydration } = calculateDough(
      1000,
      73,
      20,
      2,
    );
    expect(trueHydration).toBe(getTrueHydration(flour, water, starter));
    expect(trueHydration).toBeGreaterThan(70);
    expect(trueHydration).toBeLessThan(80);
  });
});

describe("getBassinageAmounts", () => {
  it("splits water into autolyse and hold bands", () => {
    const b = getBassinageAmounts(400);
    expect(b.minG).toBe(20);
    expect(b.maxG).toBe(40);
    expect(b.holdG).toBe(30);
    expect(b.autolyseG).toBe(370);
    expect(b.autolyseG + b.holdG).toBe(400);
  });
});

describe("calculateWaterTempDDT", () => {
  it("returns null when water mass is zero", () => {
    expect(
      calculateWaterTempDDT({
        targetDoughTempC: 25,
        flourTempC: 22,
        roomTempC: 22,
        flourWeightG: 500,
        waterWeightG: 0,
      }),
    ).toBeNull();
  });

  it("computes water temperature from heat balance", () => {
    const result = calculateWaterTempDDT({
      targetDoughTempC: 25,
      flourTempC: 22,
      roomTempC: 22,
      flourWeightG: 500,
      waterWeightG: 300,
      frictionFactorC: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.waterTempC).toBe(30);
    expect(result!.band).toBe("ok");
    expect(result!.totalMassG).toBe(800);
  });

  it("flags water that is too cold", () => {
    const result = calculateWaterTempDDT({
      targetDoughTempC: 5,
      flourTempC: 22,
      roomTempC: 22,
      flourWeightG: 500,
      waterWeightG: 500,
    });
    expect(result?.waterTempC).toBeLessThan(2);
    expect(result?.band).toBe("too_cold");
    expect(result?.warning).toBeTruthy();
  });

  it("flags water that is too hot", () => {
    const result = calculateWaterTempDDT({
      targetDoughTempC: 35,
      flourTempC: 28,
      roomTempC: 28,
      flourWeightG: 800,
      waterWeightG: 100,
      frictionFactorC: 4,
    });
    expect(result?.waterTempC).toBeGreaterThan(45);
    expect(result?.band).toBe("too_hot");
    expect(result?.warning).toBeTruthy();
  });

  it("includes starter mass in balance", () => {
    const without = calculateWaterTempDDT({
      targetDoughTempC: 25,
      flourTempC: 22,
      roomTempC: 22,
      flourWeightG: 500,
      waterWeightG: 300,
    });
    const withStarter = calculateWaterTempDDT({
      targetDoughTempC: 25,
      flourTempC: 22,
      roomTempC: 22,
      flourWeightG: 500,
      waterWeightG: 300,
      starterWeightG: 100,
      starterTempC: 24,
    });
    expect(withStarter!.waterTempC).not.toBe(without!.waterTempC);
    expect(withStarter!.totalMassG).toBe(900);
  });
});
