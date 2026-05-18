import type {
  AdviceType,
  FlourAdvice,
  FlourField,
  FlourKey,
  FlourMix,
  PresetKey,
} from "./types";

export const FLOUR_FIELDS: FlourField[] = [
  { key: "bread", label: "קמח לחם", hydration: 70, strength: 1.0 },
  { key: "whiteWheat", label: "חיטה לבנה רגילה", hydration: 68, strength: 0.82 },
  { key: "manitoba", label: "מניטובה", hydration: 74, strength: 1.25 },
  { key: "durum", label: "דורום / סולת", hydration: 62, strength: 1.05 },
  { key: "pizza", label: "קמח פיצה", hydration: 68, strength: 0.9 },
  { key: "allPurpose", label: "רב תכליתי", hydration: 66, strength: 0.72 },
  { key: "wholeWheat", label: "חיטה מלאה", hydration: 78, strength: 0.72 },
  { key: "wholeRye", label: "שיפון מלא", hydration: 82, strength: 0.25 },
  { key: "spelt", label: "כוסמין", hydration: 72, strength: 0.55 },
  { key: "buckwheat", label: "כוסמת מלאה", hydration: 84, strength: 0.0 },
];

export const PRESET_OPTIONS: { value: PresetKey; label: string }[] = [
  {
    value: "classic",
    label: "קלאסי יציב — 70% קמח לחם, 10% חיטה לבנה, 10% רב תכליתי, 10% מלא",
  },
  {
    value: "country",
    label: "כפרי מאוזן — 55% קמח לחם, 10% חיטה לבנה, 10% מניטובה, 20% מלא, 5% שיפון",
  },
  {
    value: "openCrumb",
    label: "פתוח וחזק — 50% קמח לחם, 25% מניטובה, 15% מלא, 5% שיפון",
  },
  {
    value: "pizzaSoft",
    label: "עדין ורך — 45% קמח פיצה, 35% קמח לחם, 10% חיטה לבנה, 5% רב תכליתי, 5% מלא",
  },
  {
    value: "nutty",
    label: "אגוזי — 50% קמח לחם, 10% מניטובה, 20% כוסמין, 10% מלא, 5% כוסמת",
  },
  {
    value: "whole",
    label: "יותר מלא — 40% קמח לחם, 15% מניטובה, 30% מלא, 10% שיפון",
  },
  {
    value: "buckwheatAccent",
    label: "נגיעת כוסמת — 55% קמח לחם, 10% מניטובה, 15% מלא, 5% שיפון, 10% כוסמת",
  },
  {
    value: "softHome",
    label: "ביתית — 35% קמח לחם, 25% חיטה לבנה, 25% רב תכליתי, 10% מלא, 5% כוסמין",
  },
  { value: "custom", label: "מותאם אישית" },
];

export const FLOUR_PRESETS: Record<
  Exclude<PresetKey, "custom">,
  { values: number[]; note: string }
> = {
  classic: {
    values: [70, 10, 0, 0, 0, 10, 10, 0, 0, 0],
    note: "תערובת יציבה וסלחנית, מתאימה ללחם ראשון או לבצק עם הידרציה בינונית.",
  },
  country: {
    values: [55, 10, 10, 0, 0, 0, 20, 5, 0, 0],
    note: "תערובת כפרית עם טעם עמוק יותר, אבל עדיין נוחה לעבודה ולמתיחה.",
  },
  openCrumb: {
    values: [50, 5, 25, 0, 0, 0, 15, 5, 0, 0],
    note: "מניטובה מחזקת את הבצק ועוזרת לנפח, במיוחד כשיש קמחים מלאים.",
  },
  pizzaSoft: {
    values: [35, 10, 0, 0, 45, 5, 5, 0, 0, 0],
    note: "קמח פיצה נותן בצק גמיש ורך. טוב ללחם עדין, פחות מתאים לעומס קמחים מלאים.",
  },
  nutty: {
    values: [50, 5, 10, 0, 0, 0, 10, 0, 20, 5],
    note: "כוסמין וכוסמת מוסיפים ארומה אגוזית; כדאי להישאר בהידרציה מבוקרת.",
  },
  whole: {
    values: [40, 5, 15, 0, 0, 0, 30, 10, 0, 0],
    note: "יותר טעם וסיבים, אבל הבצק יהיה כבד ודביק יותר.",
  },
  buckwheatAccent: {
    values: [55, 5, 10, 0, 0, 0, 15, 5, 0, 10],
    note: "כוסמת מלאה נותנת טעם עמוק — עדיף כתוספת, לא כבסיס.",
  },
  softHome: {
    values: [35, 25, 0, 0, 0, 25, 10, 0, 5, 0],
    note: "תערובת ביתית וסלחנית עם קמח רב תכליתי.",
  },
};

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
    pctOf(mix, "wholeWheat") + pctOf(mix, "wholeRye") + pctOf(mix, "buckwheat");
  const weakPct =
    pctOf(mix, "wholeRye") +
    pctOf(mix, "buckwheat") +
    Math.max(0, pctOf(mix, "spelt") - 25) * 0.5;
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
    text: `זוהתה אחוז גבוה של קמחים מלאים (חיטה מלאה + שיפון: ${wholeGrains}%). ההתפחה תהיה מהירה מהרגיל — עקבו/י אחרי הבצק מקרוב.`,
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
      text: `זוהתה אחוז גבוה של קמחים מלאים (חיטה מלאה + שיפון: ${wholeGrains}%). ההתפחה תהיה מהירה מהרגיל — עקבו/י אחרי הבצק מקרוב.`,
    });
  }

  const buckwheat = pctOf(mix, "buckwheat");
  const spelt = pctOf(mix, "spelt");
  const allPurpose = pctOf(mix, "allPurpose");
  const pizza = pctOf(mix, "pizza");
  const manitoba = pctOf(mix, "manitoba");
  const bread = pctOf(mix, "bread");
  const whiteWheat = pctOf(mix, "whiteWheat");
  const durum = pctOf(mix, "durum");
  const glutenFreeLike = rye + buckwheat;
  const structureScore = mix.items.reduce(
    (sum, item) => sum + (item.pct * item.strength) / 100,
    0,
  );
  const hydration = getHydrationRecommendation(mix);

  warnings.push({
    type: "good",
    text: `לפי התערובת הזו מומלץ להתחיל סביב ${hydration.low}%–${hydration.high}% הידרציה. אם זו אפייה ראשונה, עדיף לשמור 20–30 גרם מים בצד.`,
  });

  if (currentWaterPct < hydration.low - 3) {
    warnings.push({
      type: "warning",
      text: `ההידרציה שבחרת (${currentWaterPct}%) נמוכה מהטווח המומלץ לתערובת.`,
    });
  } else if (currentWaterPct > hydration.high + 3) {
    warnings.push({
      type: "warning",
      text: `ההידרציה שבחרת (${currentWaterPct}%) גבוהה מהטווח המומלץ לתערובת.`,
    });
  }

  if (buckwheat > 25) {
    warnings.push({
      type: "danger",
      text: "כוסמת מלאה מעל 25% — אין גלוטן, עלול לתת לחם מתפורר.",
    });
  } else if (buckwheat > 12) {
    warnings.push({
      type: "warning",
      text: "כוסמת מלאה מעל 12% — עבודה עדינה, נפח מוגבל.",
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

  if (spelt > 40) {
    warnings.push({ type: "danger", text: "כוסמין מעל 40% — נטייה להיקרע ולהשתטח." });
  } else if (spelt > 25) {
    warnings.push({ type: "warning", text: "כוסמין מעל 25% — קיפולים עדינים." });
  }

  if (whole > 45) {
    warnings.push({
      type: "warning",
      text: "חיטה מלאה מעל 45% — סופחת מים ומזרזת תסיסה.",
    });
  }

  if (allPurpose > 60) {
    warnings.push({
      type: "warning",
      text: "רב תכליתי מעל 60% — חלש יותר מקמח לחם.",
    });
  }

  if (whiteWheat > 65) {
    warnings.push({
      type: "warning",
      text: "חיטה לבנה מעל 65% — פחות חזקה מקמח לחם.",
    });
  }

  if (pizza > 60) {
    warnings.push({
      type: "warning",
      text: "קמח פיצה בכמות גבוהה — עלול להשתטח בהתפחה ארוכה.",
    });
  }

  if (manitoba > 55) {
    warnings.push({
      type: "warning",
      text: "מניטובה מעל 55% — חזקה מאוד, עלולה להיות לעיס.",
    });
  }

  if (durum > 30) {
    warnings.push({
      type: "warning",
      text: "דורום/סולת מעל 30% — צבע עשיר, דורש מספיק מים.",
    });
  } else if (durum > 15) {
    warnings.push({
      type: "good",
      text: `דורום/סולת ב־${durum}% — מרקם מחוספס נעים.`,
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
