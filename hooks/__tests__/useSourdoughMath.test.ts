import { describe, expect, it } from "vitest";
import { getTrueHydration, starterFlourAndWater } from "@/lib/bakingMath";
import { computeSourdoughMath } from "@/lib/sourdoughMath";

describe("starterFlourAndWater", () => {
  it("splits 100% hydration starter equally", () => {
    const { flourG, waterG } = starterFlourAndWater(100, 100);
    expect(flourG).toBeCloseTo(50, 1);
    expect(waterG).toBeCloseTo(50, 1);
  });

  it("matches legacy getTrueHydration at 100%", () => {
    expect(getTrueHydration(500, 365, 100, 100)).toBe(
      getTrueHydration(500, 365, 100),
    );
  });
});

describe("computeSourdoughMath", () => {
  it("returns null without target weight", () => {
    expect(
      computeSourdoughMath({
        targetWeightG: null,
        waterPercent: 73,
        starterPercent: 20,
        saltPercent: 2,
        starterHydrationPercent: 100,
      }),
    ).toBeNull();
  });

  it("computes masses and true hydration", () => {
    const v = computeSourdoughMath({
      targetWeightG: 1000,
      waterPercent: 73,
      starterPercent: 20,
      saltPercent: 2,
      starterHydrationPercent: 100,
    });
    expect(v).not.toBeNull();
    expect(v!.totalDoughG).toBeGreaterThanOrEqual(995);
    expect(v!.totalDoughG).toBeLessThanOrEqual(1005);
    expect(v!.bakersWaterPercent).toBe(73);
    expect(v!.trueHydrationPercent).toBeGreaterThan(70);
    expect(v!.starterFlourG + v!.starterWaterG).toBeCloseTo(v!.starterG, 1);
  });

  it("raises true hydration when starter is wetter than 100%", () => {
    const dry = computeSourdoughMath({
      targetWeightG: 1000,
      waterPercent: 73,
      starterPercent: 20,
      saltPercent: 2,
      starterHydrationPercent: 100,
    });
    const wet = computeSourdoughMath({
      targetWeightG: 1000,
      waterPercent: 73,
      starterPercent: 20,
      saltPercent: 2,
      starterHydrationPercent: 150,
    });
    expect(wet!.trueHydrationPercent).toBeGreaterThan(dry!.trueHydrationPercent);
  });
});
