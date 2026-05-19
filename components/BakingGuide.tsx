"use client";

import { useMemo, useState } from "react";
import {
  BeakerIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { AlarmButtonGroup } from "@/components/AlarmButton";
import { AdviceList } from "@/components/AdviceList";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBassinageAmounts } from "@/lib/dough";
import { describeFlourMix } from "@/lib/flour";
import { calculateStarterFeed } from "@/lib/starter";
import type { StarterFeedResult } from "@/lib/starter";
import type { RecipeForm } from "@/hooks/useRecipeForm";

export function BakingGuide({ form }: { form: RecipeForm }) {
  const [starterResult, setStarterResult] = useState<StarterFeedResult | null>(
    null,
  );

  const {
    results,
    showResults,
    showGuide,
    starterOnlyMode,
    mix,
    timelinePlan,
    useRecipeStarter,
    setUseRecipeStarter,
    manualStarterG,
    setManualStarterG,
    keepInJarG,
    setKeepInJarG,
    roomTemp,
    setRoomTemp,
    hoursToAutolyse,
    setHoursToAutolyse,
    showToast,
  } = form;

  const bassinage = results ? getBassinageAmounts(results.water) : null;
  const starterNeedG = useRecipeStarter
    ? results?.starter ?? 0
    : parseFloat(manualStarterG) || 0;

  const workflow = timelinePlan?.workflow;
  const bulkAlarms =
    timelinePlan?.schedule &&
    [...timelinePlan.schedule.folds, timelinePlan.schedule.endBulk];

  const handleCalcStarter = () => {
    if (useRecipeStarter && (!results || results.starter <= 0)) {
      showToast("קודם חשב/י את מתכון הבצק ולחצ/י «חישוב מרכיבים».");
      return;
    }
    if (!useRecipeStarter && starterNeedG <= 0) {
      showToast("הזינו כמות מחמצת נדרשת (גרם).");
      return;
    }
    const feed = calculateStarterFeed({
      needG: starterNeedG,
      keepInJarG,
      roomTempC: roomTemp,
      hoursToAutolyse,
    });
    if (!feed) {
      showToast("לא ניתן לחשב האכלה — בדקו את הכמויות.");
      return;
    }
    setStarterResult(feed);
    setTimeout(() => {
      document.getElementById("starter-feed-results")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 80);
  };

  const foldAdvice = useMemo(() => {
    if (!workflow) return null;
    return [
      {
        type: "good" as const,
        text: `${workflow.foldCount} סטים של ${workflow.foldStyle}, כל ${workflow.foldEvery}.`,
      },
      { type: "good" as const, text: workflow.foldNote },
    ];
  }, [workflow]);

  if (!showGuide) return null;

  const hideLaterSteps = starterOnlyMode && !showResults;

  return (
    <Card id="baking-guide" className="mb-8 sm:mb-10">
      <SectionHeader
        icon={<SparklesIcon className="h-6 w-6" strokeWidth={1.75} />}
        title="מדריך אפייה — שלב אחר שלב"
        subtitle="האכלת מחמצת, אוטוליזה, קיפולים ואפייה — מותאם למתכון שלכם."
      />

      {starterOnlyMode && !showResults && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          מצב מחמצת בלבד — שאר השלבים יתמלאו אחרי חישוב מתכון הבצק.
        </p>
      )}

      {/* Step 1 — Starter */}
      <article className="step-card mb-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h3 className="font-serif text-xl font-semibold">1. האכלת המחמצת</h3>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-stone-600">
          {showResults ? (
            <>
              הוציאו מהמקרר והאכלו. לבצק תצטרכו{" "}
              <strong className="text-emerald-900">
                {results?.starter} גרם
              </strong>{" "}
              מחמצת בשיא. חכו לכפילות נפח (בדרך כלל 4–8 שעות).
            </>
          ) : (
            <>
              הוציאו מהמקרר והאכלו. חשבו מתכון למעלה לכמויות מדויקות, או הזינו
              ידנית כמה מחמצת נדרשת לבצק.
            </>
          )}
        </p>

        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5">
          <p className="mb-4 text-sm text-stone-600">
            כמה לשלוף מהמקרר ואיך להאכיל — לפי הזמן עד אוטוליזה וטמפרטורת החדר.
          </p>

          <label className="mb-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
              checked={useRecipeStarter}
              onChange={(e) => setUseRecipeStarter(e.target.checked)}
            />
            <span className="text-sm font-medium text-stone-800">
              השתמשו בכמות המחמצת מחישוב הבצק
            </span>
          </label>

          <div className="mb-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className={useRecipeStarter ? "pointer-events-none opacity-50" : ""}>
              <SmartNumberInput
                id="manualStarterG"
                label="מחמצת נדרשת לבצק"
                suffix="גרם"
                value={parseFloat(manualStarterG) || 0}
                min={0}
                max={2000}
                step={1}
                allowEmpty
                onChange={(v) => setManualStarterG(v > 0 ? String(v) : "")}
                minusLabel="הפחת מחמצת"
                plusLabel="הוסף מחמצת"
                compact
              />
            </div>
            <SmartNumberInput
              id="keepInJarG"
              label="לשמור בצנצנת אחרי"
              suffix="גרם"
              value={keepInJarG}
              min={0}
              max={500}
              step={5}
              onChange={setKeepInJarG}
              minusLabel="הפחת"
              plusLabel="הוסף"
              compact
            />
            <SmartNumberInput
              id="roomTempGuide"
              label="טמפרטורת חדר"
              suffix="°C"
              value={roomTemp}
              min={16}
              max={32}
              step={1}
              onChange={setRoomTemp}
              minusLabel="הפחת טמפרטורה"
              plusLabel="הוסף טמפרטורה"
              compact
            />
            <div className="col-span-full rounded-2xl border border-stone-200 bg-white p-4">
              <label
                htmlFor="hoursToAutolyseGuide"
                className="mb-2 block text-sm font-semibold text-stone-800"
              >
                שעות עד אוטוליזה:{" "}
                <span className="font-serif text-lg text-emerald-900">
                  {hoursToAutolyse}
                </span>
              </label>
              <input
                id="hoursToAutolyseGuide"
                type="range"
                min={2}
                max={16}
                step={0.5}
                value={hoursToAutolyse}
                className="h-2.5 w-full cursor-pointer accent-emerald-700"
                onChange={(e) =>
                  setHoursToAutolyse(parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          <Button variant="primary" fullWidth onClick={handleCalcStarter}>
            חישוב שליפה מהמקרר והאכלה
          </Button>

          {starterResult && (
            <div id="starter-feed-results" className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <h4 className="mb-2 font-serif font-semibold text-emerald-950">
                  יחס מומלץ (מחמצת : קמח : מים)
                </h4>
                <p className="inline-block rounded-full bg-white px-4 py-2 font-serif text-2xl font-bold text-emerald-900 shadow-sm">
                  {starterResult.ratioLabel}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">
                  {starterResult.explain}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-700">
                <h4 className="mb-2 font-semibold text-stone-900">
                  מה לשלוף מהמקרר
                </h4>
                <p>
                  שלפו בערך{" "}
                  <strong>{starterResult.seedG} גרם</strong> מחמצת קרה.
                </p>
                <p className="mt-2">
                  הוסיפו{" "}
                  <strong>{starterResult.flourAddG} גרם</strong> קמח ו־
                  <strong>{starterResult.waterAddG} גרם</strong> מים.
                </p>
                <p className="mt-2">
                  סה״כ אחרי ערבוב:{" "}
                  <strong>{starterResult.totalMixG} גרם</strong> — מכסה{" "}
                  <strong>{Math.round(starterNeedG)} גרם</strong> לבצק
                  {keepInJarG > 0 && (
                    <>
                      {" "}
                      ועוד <strong>{keepInJarG} גרם</strong> לצנצנת
                    </>
                  )}
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </article>

      {!hideLaterSteps && results && (
        <>
          <article className="step-card mb-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                🥣
              </span>
              <h3 className="font-serif text-xl font-semibold">2. אוטוליזה</h3>
            </div>
            <p className="text-sm leading-relaxed text-stone-600">
              מערבבים{" "}
              <strong>{results.flour} גרם</strong> קמח עם{" "}
              <strong>{bassinage?.autolyseG ?? results.water} גרם</strong> מים
              (בלי מחמצת ומלח).
              {bassinage && (
                <>
                  {" "}
                  <strong>בסינאז׳:</strong> החזיקו בצד כ־
                  <strong>{bassinage.holdG} גרם</strong> מים (
                  {bassinage.minG}–{bassinage.maxG}).
                </>
              )}{" "}
              כיסוי 30–60 דקות.
            </p>
            <p className="mt-2 text-xs text-stone-500">{describeFlourMix(mix)}</p>
          </article>

          <article className="step-card mb-5">
            <h3 className="mb-2 font-serif text-xl font-semibold">
              3. מחמצת, מלח ובסינאז׳
            </h3>
            <p className="text-sm text-stone-600">
              הוסיפו <strong>{results.starter} גרם</strong> מחמצת,{" "}
              <strong>{results.salt} גרם</strong> מלח
              {bassinage && (
                <>
                  , ו־<strong>{bassinage.holdG} גרם</strong> מי בסינאז׳
                </>
              )}
              . לשו עד אחידות.
            </p>
          </article>

          {workflow && (
            <>
              <article className="step-card mb-5">
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  4. קיפולים
                </h3>
                <p className="mb-3 text-sm text-stone-600">
                  {workflow.profile} — Bulk משוער{" "}
                  {workflow.bulkLow}–{workflow.bulkHigh} שעות.
                </p>
                {foldAdvice && <AdviceList items={foldAdvice} />}
                {bulkAlarms && bulkAlarms.length > 0 && (
                  <div className="mt-4">
                    <AlarmButtonGroup alarms={bulkAlarms} />
                  </div>
                )}
              </article>

              <article className="step-card mb-5">
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  5. Bulk ועיצוב
                </h3>
                <p className="text-sm text-stone-600">{workflow.riseTarget}</p>
              </article>
            </>
          )}

          <article className="step-card mb-5">
            <div className="mb-2 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-stone-500" />
              <h3 className="font-serif text-xl font-semibold">
                6. התפחה במקרר
              </h3>
            </div>
            <p className="text-sm text-stone-600">
              כיסוי הדוק, {form.coldRetardHours} שעות בקירור לאיטיות וטעם עמוק.
            </p>
          </article>

          <article className="step-card mb-5">
            <div className="mb-2 flex items-center gap-2">
              <FireIcon className="h-5 w-5 text-orange-700" />
              <h3 className="font-serif text-xl font-semibold">7. אפייה</h3>
            </div>
            <p className="text-sm text-stone-600">
              חימום מראש (~250°C), אדים בהתחלה, ללא טורבו אם נוטה לשרוף. הורידו
              חום אחרי קרום ראשוני.
            </p>
          </article>

          <article className="step-card">
            <h3 className="mb-2 font-serif text-xl font-semibold">8. קירור</h3>
            <p className="text-sm text-stone-600">
              לפחות 2–3 שעות על רשת לפני חיתוך.
            </p>
          </article>

          {bassinage && (
            <MasterBakerTip className="mt-6">
              בסינאז׳: החזיקו {bassinage.holdG} גרם מים להוספה בשלב 3 — משפר
              מרקם ושליטה בבצק.
            </MasterBakerTip>
          )}
        </>
      )}
    </Card>
  );
}
