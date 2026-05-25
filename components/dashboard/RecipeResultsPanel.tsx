"use client";

import { ScaleIcon } from "@heroicons/react/24/outline";
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

export function RecipeResultsPanel({ form }: { form: RecipeForm }) {
  const { results, showResults, mix, waterPct } = form;

  if (!showResults || !results) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center px-6 py-16 text-center">
        <ScaleIcon
          className="mb-4 h-12 w-12 text-stone-400"
          strokeWidth={1.25}
        />
        <p className="font-serif text-lg font-semibold text-charcoal">
          עדיין לא חושב מתכון
        </p>
        <p className="mt-2 max-w-sm text-sm text-stone-600">
          התאימו פרמטרים בצד (או בתחתית המסך) ולחצו «חישוב מרכיבים» — התוצאות
          יופיעו כאן מיד.
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
          icon={<ScaleIcon className="h-6 w-6" strokeWidth={1.75} />}
          title="תוצאות המתכון"
          subtitle="הידרציה אמיתית כוללת מים במחמצת (100% הידרציה)."
        />
        <p className="-mt-4 mb-6 flex items-center gap-1.5 text-sm text-stone-600">
          <span>מה זה הידרציה אמיתית?</span>
          <InfoTooltip term="true-hydration" />
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "קמח", value: results.flour },
            { label: "מים", value: results.water },
            { label: "מחמצת", value: results.starter },
            { label: "מלח", value: results.salt },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-wheat/50 bg-wheat-muted/40 px-3 py-3 text-center sm:px-4 sm:py-4"
            >
              <p className="text-xs font-medium text-stone-600">{item.label}</p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-charcoal sm:text-3xl">
                {item.value}
                <span className="ms-1 text-sm font-sans font-normal text-stone-500">
                  ג
                </span>
              </p>
            </div>
          ))}
        </div>

        {bassinage && (
          <MasterBakerTip className="mb-6">
            <strong>בסינאז׳:</strong> החזיקו{" "}
            <strong>{bassinage.holdG} גרם</strong> מים ({bassinage.minG}–
            {bassinage.maxG}) להוספה אחרי אוטוליזה.
          </MasterBakerTip>
        )}

        <div className="rounded-2xl border border-wheat/50 bg-wheat-muted/35 p-4 sm:p-5">
          <h4 className="mb-3 font-serif text-lg font-semibold text-charcoal">
            חלוקת קמח
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
                  className="rounded-xl border border-stone-200/80 bg-white/80 px-2 py-2 text-center"
                >
                  <p className="text-[11px] text-stone-600">{item.label}</p>
                  <p className="font-semibold tabular-nums text-charcoal">
                    {Math.round((results.flour * item.pct) / 100)} ג
                  </p>
                  <p className="text-xs text-stone-500">{item.pct}%</p>
                </div>
              ))}
          </div>
          <p className="mt-4 text-sm text-stone-600">
            {describeFlourMix(mix)}. טווח מומלץ: {hydration.low}%–
            {hydration.high}%.
          </p>
          <AdviceList items={warnings} />
        </div>
      </div>
    </Card>
  );
}
