"use client";

import { useMemo } from "react";
import { ClockIcon, FireIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { AlarmButtonGroup, alarmToastMessage } from "@/components/AlarmButton";
import { AdviceList } from "@/components/AdviceList";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBassinageAmounts } from "@/lib/bakingMath";
import { describeFlourMix } from "@/lib/flour";
import type { RecipeForm } from "@/hooks/useRecipeForm";

export function BakingGuide({ form }: { form: RecipeForm }) {
  const {
    results,
    showResults,
    showGuide,
    starterOnlyMode,
    mix,
    timelinePlan,
    showToast,
  } = form;

  const bassinage = results ? getBassinageAmounts(results.water) : null;
  const workflow = timelinePlan?.workflow;
  const bulkAlarms =
    timelinePlan?.schedule &&
    [...timelinePlan.schedule.folds, timelinePlan.schedule.endBulk];

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
    <Card nested className="border-0 bg-transparent p-0 shadow-none">
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

      {!hideLaterSteps && results && (
        <>
          <article className="step-card mb-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                🥣
              </span>
              <h3 className="font-serif text-xl font-semibold">1. אוטוליזה</h3>
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
              2. מחמצת, מלח ובסינאז׳
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
                  3. קיפולים
                </h3>
                <p className="mb-3 text-sm text-stone-600">
                  {workflow.profile} — Bulk משוער{" "}
                  {workflow.bulkLow}–{workflow.bulkHigh} שעות.
                </p>
                {foldAdvice && <AdviceList items={foldAdvice} />}
                {bulkAlarms && bulkAlarms.length > 0 && (
                  <div className="mt-4">
                    <AlarmButtonGroup
                      alarms={bulkAlarms}
                      onResult={(t) => showToast(alarmToastMessage(t))}
                    />
                  </div>
                )}
              </article>

              <article className="step-card mb-5">
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  4. Bulk ועיצוב
                </h3>
                <p className="text-sm text-stone-600">{workflow.riseTarget}</p>
              </article>
            </>
          )}

          <article className="step-card mb-5">
            <div className="mb-2 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-stone-500" />
              <h3 className="font-serif text-xl font-semibold">
                5. התפחה במקרר
              </h3>
            </div>
            <p className="text-sm text-stone-600">
              כיסוי הדוק, {form.coldRetardHours} שעות בקירור לאיטיות וטעם עמוק.
            </p>
          </article>

          <article className="step-card mb-5">
            <div className="mb-2 flex items-center gap-2">
              <FireIcon className="h-5 w-5 text-orange-700" />
              <h3 className="font-serif text-xl font-semibold">6. אפייה</h3>
            </div>
            <p className="text-sm text-stone-600">
              חימום מראש (~250°C), אדים בהתחלה, ללא טורבו אם נוטה לשרוף. הורידו
              חום אחרי קרום ראשוני.
            </p>
          </article>

          <article className="step-card">
            <h3 className="mb-2 font-serif text-xl font-semibold">7. קירור</h3>
            <p className="text-sm text-stone-600">
              לפחות 2–3 שעות על רשת לפני חיתוך.
            </p>
          </article>

          {bassinage && (
            <MasterBakerTip className="mt-6">
              בסינאז׳: החזיקו {bassinage.holdG} גרם מים להוספה בשלב 2 — משפר
              מרקם ושליטה בבצק.
            </MasterBakerTip>
          )}
        </>
      )}
    </Card>
  );
}
