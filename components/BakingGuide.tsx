"use client";

import { useMemo } from "react";
import { ClockIcon, FireIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { AlarmButtonGroup, alarmToastMessage } from "@/components/AlarmButton";
import { AdviceList } from "@/components/AdviceList";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { heContent, t } from "@/lib/content";
import { getBassinageAmounts } from "@/lib/bakingMath";
import { describeFlourMix } from "@/lib/flour";
import type { RecipeForm } from "@/hooks/useRecipeForm";

const g = heContent.guide;

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
        title={g.title}
        subtitle={g.subtitle}
      />

      {starterOnlyMode && !showResults && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {g.starterOnly}
        </p>
      )}

      {!hideLaterSteps && results && (
        <>
          <article className="step-card mb-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                🥣
              </span>
              <h3 className="font-serif text-xl font-semibold">
                {g.steps.autolyse.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-stone-600">
              {t(g.steps.autolyse.body, {
                flour: results.flour,
                water: bassinage?.autolyseG ?? results.water,
              })}
              {bassinage &&
                t(g.steps.autolyse.bassinage, {
                  hold: bassinage.holdG,
                  min: bassinage.minG,
                  max: bassinage.maxG,
                })}
              {g.steps.autolyse.rest}
            </p>
            <p className="mt-2 text-xs text-stone-500">{describeFlourMix(mix)}</p>
          </article>

          <article className="step-card mb-5">
            <h3 className="mb-2 font-serif text-xl font-semibold">
              {g.steps.finalMix.title}
            </h3>
            <p className="text-sm text-stone-600">
              {t(g.steps.finalMix.body, {
                starter: results.starter,
                salt: results.salt,
                bassinage: bassinage
                  ? t(g.steps.finalMix.bassinage, { hold: bassinage.holdG })
                  : "",
              })}
            </p>
          </article>

          {workflow && (
            <>
              <article className="step-card mb-5">
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  {g.steps.folds.title}
                </h3>
                <p className="mb-3 text-sm text-stone-600">
                  {t(g.steps.folds.profile, {
                    profile: workflow.profile,
                    low: workflow.bulkLow,
                    high: workflow.bulkHigh,
                  })}
                </p>
                {foldAdvice && <AdviceList items={foldAdvice} />}
                {bulkAlarms && bulkAlarms.length > 0 && (
                  <div className="mt-4">
                    <AlarmButtonGroup
                      alarms={bulkAlarms}
                      onResult={(type) => showToast(alarmToastMessage(type))}
                    />
                  </div>
                )}
              </article>

              <article className="step-card mb-5">
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  {g.steps.bulkShape.title}
                </h3>
                <p className="text-sm text-stone-600">{workflow.riseTarget}</p>
              </article>
            </>
          )}

          <article className="step-card mb-5">
            <div className="mb-2 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-stone-500" />
              <h3 className="font-serif text-xl font-semibold">
                {g.steps.coldRetard.title}
              </h3>
            </div>
            <p className="text-sm text-stone-600">
              {t(g.steps.coldRetard.body, { hours: form.coldRetardHours })}
            </p>
          </article>

          <article className="step-card mb-5">
            <div className="mb-2 flex items-center gap-2">
              <FireIcon className="h-5 w-5 text-orange-700" />
              <h3 className="font-serif text-xl font-semibold">
                {g.steps.bake.title}
              </h3>
            </div>
            <p className="text-sm text-stone-600">{g.steps.bake.body}</p>
          </article>

          <article className="step-card">
            <h3 className="mb-2 font-serif text-xl font-semibold">
              {g.steps.cool.title}
            </h3>
            <p className="text-sm text-stone-600">{g.steps.cool.body}</p>
          </article>

          {bassinage && (
            <MasterBakerTip className="mt-6">
              {t(g.tipBassinage, { hold: bassinage.holdG })}
            </MasterBakerTip>
          )}
        </>
      )}
    </Card>
  );
}
