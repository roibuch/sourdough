import { heContent } from "@/lib/content";
import type { BuildTimelineInput } from "./timeline";

const expressCopy = heContent.express;

export type FermentationPace = "standard" | "express";

/** Starter feed ratio presets */
export type StarterRatioPreset = "auto" | "equal" | "half" | "peak";

export type WarmZoneId = "room" | "oven-light" | "microwave-off" | "warm-corner";

export interface StarterRatioOption {
  id: StarterRatioPreset;
  label: string;
  ratioLabel: string;
  flourMult: number;
  waterMult: number;
  typicalPeakHours: number;
  note: string;
}

const RATIO_MULT: Record<
  StarterRatioPreset,
  Pick<StarterRatioOption, "flourMult" | "waterMult">
> = {
  auto: { flourMult: -1, waterMult: -1 },
  equal: { flourMult: 1, waterMult: 1 },
  half: { flourMult: 0.5, waterMult: 0.5 },
  peak: { flourMult: 0, waterMult: 0 },
};

export const STARTER_RATIO_OPTIONS: StarterRatioOption[] =
  expressCopy.starterRatios.map((r) => ({
    ...r,
    ...RATIO_MULT[r.id],
  }));

export interface WarmZoneRecommendation {
  id: WarmZoneId;
  title: string;
  targetTemp: string;
  steps: string[];
  warning?: string;
}

export interface ExpressTimelineAdjustments {
  hoursToAutolyse: number;
  coldRetardHours: number;
  autolyseHours: number;
  bulkHours?: number;
  roomTemp: number;
  starterPct: number;
}

/** Shorten fermentation blocks when user enables express pace */
export function applyExpressToTimeline(
  input: BuildTimelineInput,
): ExpressTimelineAdjustments {
  const baseHta = input.hoursToAutolyse;
  const baseRetard = input.coldRetardHours;
  const baseStarter = input.starterPct;

  if (input.fermentationPace !== "express") {
    return {
      hoursToAutolyse: baseHta,
      coldRetardHours: baseRetard,
      autolyseHours: input.autolyseHours ?? 1,
      bulkHours: input.bulkHours,
      roomTemp: input.roomTemp,
      starterPct: baseStarter,
    };
  }

  return {
    hoursToAutolyse: Math.max(2.5, Math.min(baseHta, 4)),
    coldRetardHours: Math.max(4, Math.min(baseRetard, 8)),
    autolyseHours: 0.5,
    bulkHours: input.bulkHours
      ? Math.max(2.5, Math.round(input.bulkHours * 0.8 * 10) / 10)
      : undefined,
    roomTemp: Math.min(28, input.roomTemp + 3),
    starterPct: Math.min(35, baseStarter + 3),
  };
}

export function buildTimelineInputWithPace(
  input: BuildTimelineInput,
): BuildTimelineInput {
  const adj = applyExpressToTimeline(input);
  return {
    ...input,
    hoursToAutolyse: adj.hoursToAutolyse,
    coldRetardHours: adj.coldRetardHours,
    autolyseHours: adj.autolyseHours,
    bulkHours: adj.bulkHours,
    roomTemp: adj.roomTemp,
    starterPct: adj.starterPct,
    starterPeakHours: adj.hoursToAutolyse,
  };
}

export function getWarmZoneRecommendation(
  hoursToAutolyse: number,
  pace: FermentationPace,
  ratioPreset: StarterRatioPreset,
): WarmZoneRecommendation | null {
  const ratio = STARTER_RATIO_OPTIONS.find((r) => r.id === ratioPreset);
  const peakH =
    ratioPreset === "auto"
      ? hoursToAutolyse
      : ratio?.typicalPeakHours ?? hoursToAutolyse;

  const needsHeat =
    pace === "express" || hoursToAutolyse <= 5 || peakH <= 4;

  if (!needsHeat) return null;

  if (hoursToAutolyse <= 3 || ratioPreset === "half" || ratioPreset === "peak") {
    const z = expressCopy.warmZones.microwave;
    return {
      id: z.id,
      title: z.title,
      targetTemp: z.targetTemp,
      steps: [...z.steps],
      warning: z.warning,
    };
  }

  if (hoursToAutolyse <= 5 || pace === "express") {
    const z = expressCopy.warmZones.ovenLight;
    return { id: z.id, title: z.title, targetTemp: z.targetTemp, steps: [...z.steps] };
  }

  const z = expressCopy.warmZones.warmCorner;
  return { id: z.id, title: z.title, targetTemp: z.targetTemp, steps: [...z.steps] };
}

export function expressModeSummary(pace: FermentationPace): string | null {
  if (pace !== "express") return null;
  return expressCopy.summary;
}
