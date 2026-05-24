export type FlourKey =
  | "bread"
  | "whiteWheat"
  | "manitoba"
  | "durum"
  | "pizza"
  | "allPurpose"
  | "wholeWheat"
  | "wholeRye"
  | "spelt"
  | "buckwheat";

export type PresetKey =
  | "classic"
  | "country"
  | "openCrumb"
  | "pizzaSoft"
  | "nutty"
  | "whole"
  | "buckwheatAccent"
  | "softHome"
  | "custom";

export type AdviceType = "good" | "warning" | "danger";

export interface FlourField {
  key: FlourKey;
  label: string;
  hydration: number;
  strength: number;
}

export interface FlourMixItem extends FlourField {
  pct: number;
}

export interface FlourMix {
  items: FlourMixItem[];
  totalPct: number;
}

export interface FlourAdvice {
  type: AdviceType;
  text: string;
}

export interface DoughResult {
  flour: number;
  water: number;
  starter: number;
  salt: number;
  trueHydration: number;
}

export interface BassinageAmounts {
  minG: number;
  maxG: number;
  holdG: number;
  autolyseG: number;
}

export interface DoughWorkflow {
  profile: string;
  foldCount: string;
  foldStyle: string;
  foldEvery: string;
  foldNote: string;
  bulkLow: number;
  bulkHigh: number;
  riseTarget: string;
}

/**
 * Legacy URL / localStorage record (short keys).
 * Domain model: {@link import("@/lib/types/recipe").RecipeState}
 */
export interface RecipeState {
  w: string;
  wa: string;
  st: string;
  sa: string;
  fp: PresetKey;
  fl: string;
  bake?: string;
  retard?: string;
  hta?: string;
  rt?: string;
  jar?: string;
  urs?: string;
  ms?: string;
  pace?: string;
  sr?: string;
  calc?: string;
}

export interface AlarmEvent {
  ts: number;
  message: string;
  short: string;
}

export interface WorkflowSchedule {
  bulkStart: number;
  bulkEnd: number;
  folds: AlarmEvent[];
  endBulk: AlarmEvent;
}

export interface TimelineStep {
  icon: string;
  title: string;
  start: number;
  duration: string;
  meta: string;
  isTarget?: boolean;
  alarms?: AlarmEvent[];
}

export interface TimelinePlan {
  steps: TimelineStep[];
  summary: {
    starterFeed: number;
    bakeEnd: number;
    totalHours: number;
    bulkHours: number;
    starterPct: number;
  };
  workflow: DoughWorkflow;
  schedule: WorkflowSchedule | null;
}

export interface WeatherRecommendation {
  tier: "hot" | "ideal" | "cold" | "error";
  pct: number;
  range: string;
  title: string;
  body: string;
}
