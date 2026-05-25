import { heContent, t } from "@/lib/content";
import type {
  AdviceType,
  FlourAdvice,
  FlourField,
  FlourKey,
  FlourMix,
  PresetKey,
} from "./types";

const fl = heContent.flour;

export const FLOUR_FIELDS: FlourField[] = [
  { key: "bread", label: fl.fields.bread, hydration: 70, strength: 1.0 },
  { key: "whiteWheat", label: fl.fields.whiteWheat, hydration: 68, strength: 0.82 },
  { key: "manitoba", label: fl.fields.manitoba, hydration: 74, strength: 1.25 },
  { key: "wholeWheat", label: fl.fields.wholeWheat, hydration: 78, strength: 0.72 },
  { key: "wholeRye", label: fl.fields.wholeRye, hydration: 82, strength: 0.25 },
  { key: "allPurpose", label: fl.fields.allPurpose, hydration: 66, strength: 0.72 },
];

export const PRESET_OPTIONS: { value: PresetKey; label: string }[] = [
  { value: "classic", label: fl.presets.classic },
  { value: "country", label: fl.presets.country },
  { value: "whole", label: fl.presets.whole },
  { value: "custom", label: fl.presets.custom },
];

export const FLOUR_PRESETS: Record<
  Exclude<PresetKey, "custom">,
  { values: number[]; note: string }
> = {
  classic: { values: [70, 10, 0, 15, 0, 5], note: fl.presetNotes.classic },
  country: { values: [55, 10, 10, 20, 5, 0], note: fl.presetNotes.country },
  whole: { values: [35, 5, 10, 40, 10, 0], note: fl.presetNotes.whole },
};

/** Map legacy 10-flour CSV (old URLs) into 6-flour model */
export function migrateLegacyFlourPcts(pcts: number[]): number[] {
  if (pcts.length === FLOUR_FIELDS.length) {
    return pcts.map((n) => Math.min(100, Math.max(0, n)));
  }
  if (pcts.length !== 10) {
    return [...FLOUR_PRESETS.classic.values];
  }
  const [
    bread,
    white,
    manitoba,
    durum,
    pizza,
    allPurpose,
    whole,
    rye,
    spelt,
    buckwheat,
  ] = pcts;
  const other = durum + pizza + allPurpose + spelt + buckwheat;
  return [bread, white, manitoba, whole, rye, other];
}

export function defaultFlourPcts(): number[] {
  return [...FLOUR_PRESETS.classic.values];
}

export function buildFlourMix(pcts: number[]): FlourMix {
  const items = FLOUR_FIELDS.map((field, i) => ({
    ...field,
    pct: Number.isFinite(pcts[i]) ? pcts[i] : 0,
  }));
  const totalPct = items.reduce((sum, item) => sum + item.pct, 0);
  return { items, totalPct };
}

export function pctOf(mix: FlourMix, key: FlourKey): number {
  return mix.items.find((x) => x.key === key)?.pct ?? 0;
}

export function describeFlourMix(mix: FlourMix): string {
  return mix.items
    .filter((item) => item.pct > 0)
    .map((item) => `${item.label} ${item.pct}%`)
    .join(", ");
}

export function getHydrationRecommendation(mix: FlourMix) {
  const weighted = mix.items.reduce(
    (sum, item) => sum + (item.pct * item.hydration) / 100,
    0,
  );
  const wholePct =
    pctOf(mix, "wholeWheat") + pctOf(mix, "wholeRye");
  const weakPct =
    pctOf(mix, "wholeRye") +
    Math.max(0, pctOf(mix, "allPurpose") - 30) * 0.4;
  let low = Math.round(weighted - 3);
  let high = Math.round(weighted + 3);
  if (wholePct >= 45 || weakPct >= 25) {
    low -= 2;
    high -= 2;
  }
  return {
    center: Math.round(weighted),
    low: Math.max(58, low),
    high: Math.min(88, high),
  };
}

export function getFermentationFactorWarning(mix: FlourMix): FlourAdvice | null {
  const wholeGrains = pctOf(mix, "wholeWheat") + pctOf(mix, "wholeRye");
  if (wholeGrains <= 15) return null;
  return {
    type: "warning",
    text: t(heContent.alerts.flour.wholeGrainFast, { wholeGrains }),
  };
}

export function getFlourWarnings(
  mix: FlourMix,
  currentWaterPct: number,
): FlourAdvice[] {
  const warnings: FlourAdvice[] = [];
  const whole = pctOf(mix, "wholeWheat");
  const rye = pctOf(mix, "wholeRye");
  const wholeGrains = whole + rye;

  if (wholeGrains > 15) {
    warnings.push({
      type: "warning",
      text: t(heContent.alerts.flour.wholeGrainFast, { wholeGrains }),
    });
  }

  const allPurpose = pctOf(mix, "allPurpose");
  const manitoba = pctOf(mix, "manitoba");
  const bread = pctOf(mix, "bread");
  const whiteWheat = pctOf(mix, "whiteWheat");
  const glutenFreeLike = rye;
  const structureScore = mix.items.reduce(
    (sum, item) => sum + (item.pct * item.strength) / 100,
    0,
  );
  const hydration = getHydrationRecommendation(mix);

  const af = heContent.alerts.flour;
  warnings.push({
    type: "good",
    text: t(af.hydrationRangeGood, {
      low: hydration.low,
      high: hydration.high,
    }),
  });

  if (currentWaterPct < hydration.low - 3) {
    warnings.push({
      type: "warning",
      text: t(af.hydrationLow, {
        current: currentWaterPct,
        low: hydration.low,
        high: hydration.high,
      }),
    });
  } else if (currentWaterPct > hydration.high + 3) {
    warnings.push({
      type: "warning",
      text: t(af.hydrationHigh, {
        current: currentWaterPct,
        low: hydration.low,
        high: hydration.high,
      }),
    });
  }

  if (rye > 30) {
    warnings.push({ type: "danger", text: "שיפון מלא מעל 30% — בצק דביק וכבד מאוד." });
  } else if (rye > 15) {
    warnings.push({
      type: "warning",
      text: "שיפון מלא מעל 15% — מחליש מבנה, עבודה עם ידיים רטובות.",
    });
  }

  if (whole > 45) {
    warnings.push({
      type: "warning",
      text: "חיטה מלאה מעל 45% — סופחת מים ומזרזת תסיסה.",
    });
  }

  if (allPurpose > 40) {
    warnings.push({
      type: "warning",
      text: "רב תכליתי/אחר מעל 40% — חלש יותר מקמח לחם.",
    });
  }

  if (whiteWheat > 65) {
    warnings.push({
      type: "warning",
      text: "חיטה לבנה מעל 65% — פחוש מבנה מקמח לחם.",
    });
  }

  if (manitoba > 55) {
    warnings.push({
      type: "warning",
      text: "מניטובה מעל 55% — חזקה מאוד, עלולה להיות לעיס.",
    });
  }

  if (glutenFreeLike > 25 && bread + manitoba + whiteWheat * 0.5 < 60) {
    warnings.push({
      type: "danger",
      text: "הרבה קמחים חלשים בלי מספיק קמח חזק — חזקו עם קמח לחם/מניטובה.",
    });
  } else if (structureScore < 0.65) {
    warnings.push({
      type: "warning",
      text: "התערובת יחסית חלשה מבחינת מבנה.",
    });
  }

  return warnings;
}

export function adviceClass(type: AdviceType): string {
  const map: Record<AdviceType, string> = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-orange-200 bg-orange-50 text-orange-950",
    danger: "border-red-200 bg-red-50 text-red-900",
  };
  return map[type];
}
