import { applyExpressToTimeline } from "@/lib/expressMode";
import type { FermentationPace } from "@/lib/expressMode";
import {
  estimateBulkFermentationHours,
  pickStarterFeedRatio,
} from "@/lib/fermentationTiming";
import { describeFlourMix, getHydrationRecommendation } from "@/lib/flour";
import { getDoughWorkflow } from "@/lib/workflow";
import type { DoughWorkflow, FlourMix } from "@/lib/types";

export interface GuideStepDetail {
  title: string;
  body: string;
}

export interface BakingGuideStep {
  id: string;
  icon: string;
  title: string;
  duration: string;
  /** Approximate timer length in minutes (for «הפעל טיימר») */
  timerMinutes?: number;
  summary: string;
  details: GuideStepDetail[];
}

export interface BakingGuidePlan {
  steps: BakingGuideStep[];
  workflow: DoughWorkflow;
  totalHoursLabel: string;
  pace: FermentationPace;
  adjusted: {
    hoursToAutolyse: number;
    coldRetardHours: number;
    roomTempC: number;
    autolyseHours: number;
    bulkHoursCenter: number;
  };
}

function formatHoursRange(low: number, high: number): string {
  const lo = Math.round(low * 10) / 10;
  const hi = Math.round(high * 10) / 10;
  if (lo === hi) return `כ־${lo} שעות`;
  return `כ־${lo}–${hi} שעות`;
}

function formatMinutesHours(hours: number): string {
  if (hours < 1) return `כ־${Math.round(hours * 60)} דק׳`;
  if (hours === 1) return "כ־שעה";
  return `כ־${Math.round(hours * 10) / 10} שעות`;
}

export function buildBakingGuidePlan(input: {
  mix: FlourMix;
  waterPct: number;
  starterPct: number;
  roomTempC: number;
  hoursToAutolyse: number;
  coldRetardHours: number;
  fermentationPace: FermentationPace;
}): BakingGuidePlan {
  const adj = applyExpressToTimeline({
    targetBakeTime: "",
    coldRetardHours: input.coldRetardHours,
    starterPct: input.starterPct,
    waterPct: input.waterPct,
    roomTemp: input.roomTempC,
    hoursToAutolyse: input.hoursToAutolyse,
    flourPcts: input.mix.items.map((i) => i.pct),
    fermentationPace: input.fermentationPace,
  });

  const workflow = getDoughWorkflow(
    input.mix,
    input.waterPct,
    adj.starterPct,
    adj.roomTemp,
  );

  const starterPick = pickStarterFeedRatio(adj.hoursToAutolyse, adj.roomTemp);
  const starterTimerMin = Math.round(starterPick.peakHours * 60);
  const autolyseTimerMin = Math.max(15, Math.round(adj.autolyseHours * 60));
  const bulkCenter = estimateBulkFermentationHours(
    adj.starterPct,
    adj.roomTemp,
    input.mix,
  );
  const hydration = getHydrationRecommendation(input.mix);
  const flourNote = describeFlourMix(input.mix);

  const paceNote =
    input.fermentationPace === "express"
      ? "מצב מואץ: חלונות קצרים יותר — עקבו אחרי נפח ותחושת הבצק, לא רק אחרי השעון."
      : "קצב רגיל: אפשר להאריך כל שלב אם הבצק עדיין שטוח או קר מדי.";

  const steps: BakingGuideStep[] = [
    {
      id: "starter",
      icon: "🦠",
      title: "האכלת מחמצת",
      timerMinutes: starterTimerMin,
      duration: formatHoursRange(
        Math.max(2, starterPick.peakHours - 0.5),
        starterPick.peakHours + 1,
      ),
      summary: `${starterPick.note} מבחן ציפה לפני השילוב בבצק.`,
      details: [
        {
          title: "להאיץ",
          body: "יחס 1:1:1, אזור חם (28–32°C) — מיקרוגל כבוי או אור תנור. קצרו את חלון ההמתנה רק אם המחמצת בשיא.",
        },
        {
          title: "להאט",
          body: "יחס 1:3:3 או 1:4:4, טמפרטורת חדר נמוכה (18–20°C). מתאים לאפייה למחרת.",
        },
        {
          title: "לפי הקמחים",
          body: flourNote,
        },
      ],
    },
    {
      id: "autolyse",
      icon: "🥣",
      title: "מנוחת בצק ראשונית (אוטוליזה)",
      timerMinutes: autolyseTimerMin,
      duration: formatMinutesHours(adj.autolyseHours),
      summary: "קמח + מים בלבד, בלי מחמצת ובלי מלח. מחזקים את הגלוטן לפני הלישה הסופית.",
      details: [
        {
          title: "להאריך",
          body: "30–90 דקות לרוב המתכונים; בצקים עם הרבה מלא או קמח חלש — עד 2 שעות.",
        },
        {
          title: "לפי ההידרציה",
          body: `טווח מומלץ לתערובת: ${hydration.low}–${hydration.high}% (הגדרתכם ${input.waterPct}%).`,
        },
        {
          title: input.fermentationPace === "express" ? "קצב מואץ" : "קצב רגיל",
          body: paceNote,
        },
      ],
    },
    {
      id: "mix",
      icon: "🧂",
      title: "מחמצת, מלח ולישה סופית",
      timerMinutes: 15,
      duration: "כ־10–20 דק׳",
      summary: "שילוב מחמצת (אחרי מבחן ציפה), מלח ומים שנותרו. מתחילה ההתפחה בקערה.",
      details: [
        {
          title: "בסינאז׳",
          body: "בהידרציה גבוהה — החזיקו חלק מהמים להוספה כאן לשליטה טובה יותר.",
        },
      ],
    },
    {
      id: "bulk",
      icon: "🧂",
      title: "התפחה ראשונית בקערה",
      timerMinutes: Math.round(bulkCenter * 60),
      duration: formatHoursRange(workflow.bulkLow, workflow.bulkHigh),
      summary: `${workflow.profile} · ${workflow.foldCount} סטים ${workflow.foldStyle}, כל ${workflow.foldEvery}. ${workflow.riseTarget}.`,
      details: [
        {
          title: "קיפולים",
          body: workflow.foldNote,
        },
        {
          title: "להאריך התפחה",
          body: `אם הבצק לא הגיע ל${workflow.riseTarget} — הוסיפו 30–60 דק׳. בטמפרטורה נמוכה (${adj.roomTemp}°C) לעיתים צריך עוד שעה.`,
        },
        {
          title: "לקצר",
          body: `מחמצת גבוהה יותר (${adj.starterPct}%) או חום עדין מקצרים — בדקו נפח לפני עיצוב.`,
        },
        {
          title: "לפי הקמחים",
          body: flourNote,
        },
      ],
    },
    {
      id: "shape",
      icon: "✋",
      title: "עיצוב ראשוני",
      duration: "כ־20–40 דק׳",
      summary: workflow.riseTarget + " — עיצוב עדין, מנוחה קצרה לפני המקרר.",
      details: [
        {
          title: "טיפ",
          body: "פחות קמח על המשטח; בצק רטוב — מריחת מים על הידיים.",
        },
      ],
    },
    {
      id: "retard",
      icon: "❄️",
      title: "התפחה שנייה במקרר",
      timerMinutes: Math.round(adj.coldRetardHours * 60),
      duration: formatHoursRange(
        Math.max(4, adj.coldRetardHours - 2),
        adj.coldRetardHours + 2,
      ),
      summary: `כיסוי הדוק, ${adj.coldRetardHours} שעות בקירור (4–12°C) לפיתוח טעם ולמבנה.`,
      details: [
        {
          title: "להאריך",
          body: "12–18 שעות לטעם עמוק יותר; 24–48 שעות לפרופיל חמוץ יותר (בדקו שהבצק לא דוחף את המכסה).",
        },
        {
          title: "לקצר",
          body: "מינימום ~4 שעות אם צריכים לאפות באותו יום — פחות טעם, יותר נוחות.",
        },
      ],
    },
    {
      id: "bake",
      icon: "🔥",
      title: "אפייה",
      duration: "כ־45–60 דק׳",
      summary: "חימום מראש (~250°C), אדים בהתחלה. הורידו חום אחרי קרום ראשוני.",
      details: [],
    },
    {
      id: "cool",
      icon: "🍞",
      title: "קירור",
      duration: "כ־2–3 שעות",
      summary: "על רשת לפני חיתוך — הכוכב צריך להתייצב.",
      details: [],
    },
  ];

  const totalLow =
    starterPick.peakHours +
    adj.autolyseHours +
    0.3 +
    workflow.bulkLow +
    0.5 +
    adj.coldRetardHours +
    1 +
    2;
  const totalHigh =
    starterPick.peakHours +
    1.5 +
    adj.autolyseHours +
    0.5 +
    workflow.bulkHigh +
    1 +
    adj.coldRetardHours +
    2 +
    1 +
    3;

  return {
    steps,
    workflow,
    totalHoursLabel: formatHoursRange(totalLow, totalHigh),
    pace: input.fermentationPace,
    adjusted: {
      hoursToAutolyse: adj.hoursToAutolyse,
      coldRetardHours: adj.coldRetardHours,
      roomTempC: adj.roomTemp,
      autolyseHours: adj.autolyseHours,
      bulkHoursCenter: bulkCenter,
    },
  };
}
