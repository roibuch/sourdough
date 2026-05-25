import { estimateBulkFermentationHours } from "./fermentationTiming";
import { getHydrationRecommendation, pctOf } from "./flour";
import type { DoughWorkflow, FlourMix } from "./types";

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export function getDoughWorkflow(
  mix: FlourMix,
  currentWaterPct: number,
  starterPct: number,
  tempC = 22,
): DoughWorkflow {
  const whole = pctOf(mix, "wholeWheat");
  const rye = pctOf(mix, "wholeRye");
  const allPurpose = pctOf(mix, "allPurpose");
  const manitoba = pctOf(mix, "manitoba");
  const bread = pctOf(mix, "bread");
  const whiteWheat = pctOf(mix, "whiteWheat");
  const hydration = getHydrationRecommendation(mix);
  const wholePct = whole + rye;
  const fragilePct = rye + Math.max(0, allPurpose - 25) * 0.35;
  const structureScore = mix.items.reduce(
    (sum, item) => sum + (item.pct * item.strength) / 100,
    0,
  );
  const strongPct = bread + manitoba + whiteWheat * 0.55;
  const highHydration = currentWaterPct > hydration.high + 2;
  const lowHydration = currentWaterPct < hydration.low - 2;

  let foldCount = "3–4";
  let foldStyle = "מתיחה וקיפול או קיפול סליל עדין";
  let foldEvery = "30–45 דקות";
  let doughProfile = "מאוזן ונוח לעבודה";
  let foldNote = "אפשר להפסיק כשהבצק מרגיש חזק, חלק ואלסטי יותר.";

  if (fragilePct >= 28 || structureScore < 0.62) {
    foldCount = "2–3";
    foldStyle = "קיפולים עדינים / קיפול סליל";
    foldEvery = "35–50 דקות";
    doughProfile = "עדין וחלש יחסית";
    foldNote = "לא ללוש באגרסיביות; עדיף לחזק בעדינות.";
  } else if (highHydration && structureScore >= 0.78) {
    foldCount = "4–5";
    foldStyle = "בעיקר קיפול סליל";
    foldEvery = "25–35 דקות";
    doughProfile = "רטוב ואלסטי";
    foldNote = "אם הבצק נמרח אחרי 3 קיפולים — קיפול נוסף במקום קמח.";
  } else if (lowHydration) {
    foldCount = "2–3";
    foldStyle = "מתיחה וקיפול קצר";
    foldEvery = "40–50 דקות";
    doughProfile = "יציב יחסית";
    foldNote = "אם נוקשה — מנוחה ארוכה יותר.";
  } else if (manitoba >= 25 || strongPct >= 75) {
    foldCount = "3–4";
    foldStyle = "מתיחה וקיפול או קיפול סליל";
    foldEvery = "30–45 דקות";
    doughProfile = "חזק ואלסטי";
    foldNote = "אפשר לעצור מוקדם אם הבצק עומד יפה.";
  } else if (wholePct >= 35) {
    foldCount = "3–4";
    foldStyle = "קיפולים עדינים";
    foldEvery = "30–40 דקות";
    doughProfile = "מלא וכבד יותר";
    foldNote = "קמח מלא מאיץ תפיחה — עקבו אחרי נפח ותחושה.";
  }

  if (allPurpose >= 40) {
    foldNote += " רב תכליתי בכמות גבוהה — הידרציה בינונית.";
  }

  const bulkCenter = estimateBulkFermentationHours(starterPct, tempC, mix);
  const bulkLow = roundHalf(
    Math.max(2, estimateBulkFermentationHours(starterPct, tempC, mix, { riseFraction: 0.82 })),
  );
  const bulkHigh = roundHalf(
    Math.min(16, estimateBulkFermentationHours(starterPct, tempC, mix, { riseFraction: 1.28 })),
  );

  let riseTarget = "כ־50%–75% עליה בנפח";
  if (fragilePct >= 25) riseTarget = "כ־30%–50% עליה בנפח";
  else if (wholePct >= 35) riseTarget = "כ־40%–60% עליה בנפח";
  else if (structureScore >= 0.9 && currentWaterPct >= hydration.low) {
    riseTarget = "כ־60%–80% עליה בנפח";
  }

  return {
    profile: doughProfile,
    foldCount,
    foldStyle,
    foldEvery,
    foldNote,
    bulkLow,
    bulkHigh,
    riseTarget,
  };
}
