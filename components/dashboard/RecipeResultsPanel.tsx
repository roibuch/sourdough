"use client";

import { CakeIcon } from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { FlourPieChart } from "@/components/FlourPieChart";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { getBassinageAmounts } from "@/lib/bakingMath";
import {
  describeFlourMix,
  getFlourWarnings,
  getHydrationRecommendation,
} from "@/lib/flour";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";

const res = heContent.inputs.results;

export function RecipeResultsPanel({ form }: { form: RecipeForm }) {
  const { results, showResults, mix, waterPct } = form;

  if (!showResults || !results) {
    return (
      <div
        className="glass-panel animate-section-in flex min-h-[min(22rem,50vh)] flex-col items-center justify-center rounded-2xl bg-white/80 px-6 py-16 text-center backdrop-blur-md lg:min-h-[min(32rem,60vh)]"
        aria-labelledby="welcome-empty-title"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100/90 ring-2 ring-amber-200/90">
          <CakeIcon
            className="h-11 w-11 text-amber-700"
            strokeWidth={1.25}
            aria-hidden
          />
        </div>
        <h2
          id="welcome-empty-title"
          className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl"
        >
          {res.emptyTitle}
        </h2>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-stone-700">
          <span className="hidden lg:inline">{res.emptyBodyDesktop}</span>
          <span className="lg:hidden">{res.emptyBody}</span>
        </p>
      </div>
    );
  }

  const warnings = getFlourWarnings(mix, waterPct);
  const hydration = getHydrationRecommendation(mix);
  const bassinage = getBassinageAmounts(results.water);
  return (
    <Card
      id="recipe-results"
      aria-live="polite"
      className="recipe-results-enter glass-panel border-0 p-0 shadow-none"
      nested
    >
      <div className="min-w-0 p-3 sm:p-6 md:p-8">
        <SectionHeader
          icon={<CakeIcon className="h-6 w-6" strokeWidth={1.75} />}
          title="תוצאות המתכון"
          subtitle="כמה נוזלים באמת בבצק — כולל מים במחמצת."
        />
        <p className="-mt-4 mb-6 flex items-center gap-1.5 text-sm text-stone-700">
          <span>מה זה «כמה נוזלים באמת»?</span>
          <InfoTooltip term="true-hydration" />
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: res.flour, value: results.flour },
            { label: res.water, value: results.water },
            { label: res.starter, value: results.starter },
            { label: res.salt, value: results.salt },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-3 py-3 text-center sm:px-4 sm:py-4"
            >
              <p className="text-xs font-medium text-stone-700">{item.label}</p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-stone-900 sm:text-3xl">
                {item.value}
                <span className="ms-1 text-sm font-sans font-normal text-stone-600">
                  ג
                </span>
              </p>
            </div>
          ))}
        </div>

        {bassinage && (
          <MasterBakerTip className="mb-6">
            <strong>הוספת מים הדרגתית (בסינאז׳):</strong> החזיקו{" "}
            <strong>{bassinage.holdG} גרם</strong> מים ({bassinage.minG}–
            {bassinage.maxG}) להוספה אחרי המנוחה הראשונית.
          </MasterBakerTip>
        )}

        <div className="rounded-2xl border border-amber-200/50 bg-white/70 p-4 sm:p-5">
          <h4 className="mb-3 font-serif text-lg font-semibold text-stone-900">
            {res.flourSplit}
          </h4>
          <FlourPieChart
            mix={mix}
            flourGrams={results.flour}
            className="mb-4 border-0 bg-transparent p-0 shadow-none"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mix.items
              .filter((item) => item.pct > 0)
              .map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-stone-200/80 bg-white/90 px-2 py-2 text-center"
                >
                  <p className="text-[11px] text-stone-600">{item.label}</p>
                  <p className="font-semibold tabular-nums text-stone-900">
                    {Math.round((results.flour * item.pct) / 100)} ג
                  </p>
                  <p className="text-xs text-stone-500">{item.pct}%</p>
                </div>
              ))}
          </div>
          <p className="mt-4 text-sm text-stone-700">
            {describeFlourMix(mix)}. טווח מומלץ: {hydration.low}%–
            {hydration.high}% נוזלים.
          </p>
          <AdviceList items={warnings} />
        </div>
      </div>
    </Card>
  );
}
