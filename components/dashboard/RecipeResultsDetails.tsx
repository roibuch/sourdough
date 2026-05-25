"use client";

import { AdviceList } from "@/components/AdviceList";
import { FlourPieChart } from "@/components/FlourPieChart";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
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

export function RecipeResultsDetails({ form }: { form: RecipeForm }) {
  const { results, showResults, mix, waterPct } = form;

  if (!showResults || !results) return null;

  const warnings = getFlourWarnings(mix, waterPct);
  const hydration = getHydrationRecommendation(mix);
  const bassinage = getBassinageAmounts(results.water);

  return (
    <div className="space-y-6 text-text-secondary">
      <p className="flex items-center gap-1.5 text-sm">
        <span>מה זה «{res.trueHydration}»?</span>
        <InfoTooltip term="true-hydration" />
      </p>

      {bassinage && (
        <MasterBakerTip>
          <strong>הוספת מים הדרגתית (בסינאז׳):</strong> החזיקו{" "}
          <strong>{bassinage.holdG} גרם</strong> מים ({bassinage.minG}–
          {bassinage.maxG}) להוספה אחרי המנוחה הראשונית.
        </MasterBakerTip>
      )}

      <div className="glass-card p-4 sm:p-5">
        <h4 className="mb-3 font-serif text-lg font-normal text-text-primary">
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
                className="border border-border-subtle bg-surface px-2 py-2 text-center"
              >
                <p className="text-[11px] text-text-muted">{item.label}</p>
                <p className="font-medium tabular-nums text-text-primary">
                  {Math.round((results.flour * item.pct) / 100)} ג
                </p>
                <p className="text-xs text-text-muted">{item.pct}%</p>
              </div>
            ))}
        </div>
        <p className="mt-4 text-sm">
          {describeFlourMix(mix)}. טווח מומלץ: {hydration.low}%–
          {hydration.high}% נוזלים.
        </p>
        <AdviceList items={warnings} />
      </div>
    </div>
  );
}
