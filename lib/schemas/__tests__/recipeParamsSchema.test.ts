import { describe, expect, it } from "vitest";
import { FLOUR_PRESETS } from "@/lib/flour";
import { RECIPE_DEFAULTS } from "@/lib/constants/recipeDefaults";
import {
  isFlourBlendValid,
  isHydrationValid,
  normalizeFlourPercentages,
  parseRecipeParamsFromRecord,
  parseRecipeParamsFromSearch,
  urlRecipeParamsRawSchema,
} from "@/lib/schemas/recipeParamsSchema";

describe("normalizeFlourPercentages", () => {
  it("scales arbitrary blend to 100%", () => {
    const normalized = normalizeFlourPercentages([50, 25, 25, 0, 0, 0, 0, 0, 0, 0]);
    const total = normalized.reduce((s, p) => s + p, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it("leaves already-valid totals unchanged (within tolerance)", () => {
    const classic = [...FLOUR_PRESETS.classic.values];
    expect(normalizeFlourPercentages(classic)).toEqual(classic);
  });

  it("returns classic preset when total is zero", () => {
    expect(normalizeFlourPercentages([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toEqual(
      [...FLOUR_PRESETS.classic.values],
    );
  });
});

describe("urlRecipeParamsRawSchema", () => {
  it("parses calc flag and useRecipeStarter", () => {
    const on = urlRecipeParamsRawSchema.parse({ calc: "1", urs: "0" });
    expect(on.calc).toBe(true);
    expect(on.urs).toBe(false);

    const off = urlRecipeParamsRawSchema.parse({ calc: "0" });
    expect(off.calc).toBe(false);
  });

  it("accepts water percent in valid range", () => {
    expect(urlRecipeParamsRawSchema.parse({ wa: "80" }).wa).toBe(80);
  });

  it("rejects water percent outside 1–120", () => {
    expect(urlRecipeParamsRawSchema.safeParse({ wa: "0" }).success).toBe(false);
    expect(urlRecipeParamsRawSchema.safeParse({ wa: "150" }).success).toBe(false);
  });

  it("accepts comma decimal in percents", () => {
    expect(urlRecipeParamsRawSchema.parse({ sa: "2,5" }).sa).toBe(2.5);
  });
});

describe("rawParamsToRecipeState defaults", () => {
  it("fills missing keys from RECIPE_DEFAULTS", () => {
    const { state } = parseRecipeParamsFromRecord({});
    expect(state.waterPercent).toBe(RECIPE_DEFAULTS.waterPercent);
    expect(state.starterPercent).toBe(RECIPE_DEFAULTS.starterPercent);
    expect(state.saltPercent).toBe(RECIPE_DEFAULTS.saltPercent);
    expect(state.flourBlend.preset).toBe(RECIPE_DEFAULTS.preset);
    expect(state.calculated).toBe(false);
    expect(state.starter.useFromRecipe).toBe(true);
  });
});

describe("parseRecipeParamsFromSearch", () => {
  it("returns defaults when search is empty", () => {
    const { state, flourAdjusted, issues } = parseRecipeParamsFromSearch("");
    expect(issues).toHaveLength(0);
    expect(flourAdjusted).toBe(false);
    expect(state.waterPercent).toBe(RECIPE_DEFAULTS.waterPercent);
    expect(state.totalWeightG).toBeNull();
  });

  it("parses a full recipe URL fragment", () => {
    const classicCsv = FLOUR_PRESETS.classic.values.join(",");
    const qs = new URLSearchParams({
      w: "900",
      wa: "75",
      st: "18",
      sa: "2",
      fp: "classic",
      fl: classicCsv,
      calc: "1",
      bake: "2026-05-20T08:00",
    }).toString();

    const { state, flourAdjusted, issues } = parseRecipeParamsFromSearch(qs);
    expect(issues).toHaveLength(0);
    expect(flourAdjusted).toBe(false);
    expect(state.totalWeightG).toBe(900);
    expect(state.waterPercent).toBe(75);
    expect(state.starterPercent).toBe(18);
    expect(state.calculated).toBe(true);
    expect(state.flourBlend.preset).toBe("classic");
    expect(isFlourBlendValid(state.flourBlend)).toBe(true);
  });
});

describe("parseRecipeParamsFromRecord", () => {
  it("normalizes flour CSV that does not sum to 100", () => {
    const { state, flourAdjusted } = parseRecipeParamsFromRecord({
      fl: "55,30,25,0,0,0,0,0,0,0",
    });
    expect(flourAdjusted).toBe(true);
    expect(state.flourBlend.totalPercent).toBeCloseTo(100, 1);
  });

  it("falls back preset via catch on invalid fp", () => {
    const { state, issues } = parseRecipeParamsFromRecord({
      fp: "not-a-preset",
    });
    expect(issues).toHaveLength(0);
    expect(state.flourBlend.preset).toBe(RECIPE_DEFAULTS.preset);
  });

  it("falls back when a numeric field is out of schema range", () => {
    const { state, issues } = parseRecipeParamsFromRecord({
      retard: "99",
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(state.schedule.coldRetardHours).toBe(RECIPE_DEFAULTS.coldRetardHours);
  });

  it("uses default water percent when wa is not numeric", () => {
    const { state, issues } = parseRecipeParamsFromRecord({ wa: "not-a-number" });
    expect(issues).toHaveLength(0);
    expect(state.waterPercent).toBe(RECIPE_DEFAULTS.waterPercent);
  });

  it("parses manual starter grams", () => {
    const { state } = parseRecipeParamsFromRecord({ ms: "120" });
    expect(state.starter.manualGrams).toBe(120);
  });
});

describe("validation helpers", () => {
  it("isHydrationValid enforces 1–120%", () => {
    expect(isHydrationValid(73)).toBe(true);
    expect(isHydrationValid(0)).toBe(false);
    expect(isHydrationValid(121)).toBe(false);
  });

  it("isFlourBlendValid checks total near 100%", () => {
    const { state } = parseRecipeParamsFromSearch(
      `fl=${FLOUR_PRESETS.classic.values.join(",")}`,
    );
    expect(isFlourBlendValid(state.flourBlend)).toBe(true);
  });
});
