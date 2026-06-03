"use client";

import { useEffect, useMemo } from "react";
import {
  BeakerIcon,
  CalculatorIcon,
  LinkIcon,
  TrashIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { FlourPieChart } from "@/components/FlourPieChart";
import { WeatherPanel } from "@/components/WeatherPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AnimatedStat } from "@/components/ui/AnimatedStat";
import { useRecipeValidation } from "@/hooks/useRecipeValidation";
import { cn } from "@/lib/cn";
import { getBassinageAmounts } from "@/lib/bakingMath";
import {
  FLOUR_FIELDS,
  PRESET_OPTIONS,
  describeFlourMix,
  getFermentationFactorWarning,
  getFlourWarnings,
  getHydrationRecommendation,
} from "@/lib/flour";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";
import type { PresetKey } from "@/lib/types";

const inp = heContent.inputs;

export function RecipeCalculator({ form }: { form: RecipeForm }) {
  const {
    totalWeight,
    setWeightDraftValue,
    commitTotalWeight,
    waterPct,
    setWaterPct,
    starterPct,
    setStarterPct,
    saltPct,
    setSaltPct,
    preset,
    setPreset,
    flourDraft,
    setFlourDraftPct,
    commitFlourPcts,
    needsFlourBalance,
    presetNote,
    setPresetNote,
    results,
    showResults,
    mix,
    applyPreset,
    schedulePersist,
    handleCalculate,
    handleCopyLink,
    handleClearStorage,
    openStarterOnlyGuide,
    showToast,
  } = form;

  const fermentationAlert = useMemo(
    () => getFermentationFactorWarning(mix),
    [mix],
  );

  const handlePresetChange = (key: PresetKey) => {
    setPreset(key);
    applyPreset(key);
    schedulePersist();
  };

  const validation = useRecipeValidation({
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    mix,
  });

  const handleFlourPctChange = (index: number, value: number) => {
    setFlourDraftPct(index, value);
  };

  const onCalculate = () => {
    commitTotalWeight();
    commitFlourPcts(flourDraft);
    if (needsFlourBalance(flourDraft)) {
      showToast(
        "סך הקמחים אינו 100% — עגלו בלוח הבקרה או התאימו את האחוזים.",
      );
      return;
    }
    if (!validation.canCalculate) {
      const first =
        validation.fields.totalWeight?.message ??
        validation.fields.flourTotal?.message ??
        validation.fields.waterPct?.message ??
        validation.fields.starterPct?.message ??
        validation.fields.saltPct?.message;
      showToast(first ?? heContent.validation.calculateBlocked);
      return;
    }
    handleCalculate();
  };

  useEffect(() => {
    if (preset === "custom") {
      setPresetNote(
        `עריכה ידנית: סך הקמחים כרגע ${mix.totalPct}%. צריך להגיע ל־100%.`,
      );
    }
  }, [mix.totalPct, preset, setPresetNote]);

  const warnings = showResults ? getFlourWarnings(mix, waterPct) : [];
  const hydration = getHydrationRecommendation(mix);
  const bassinage = results ? getBassinageAmounts(results.water) : null;

  const totalWeightNum = parseFloat(totalWeight);
  const displayTotal =
    showResults && results
      ? `${results.flour + results.water + results.starter + results.salt} גרם`
      : totalWeightNum > 0
        ? `~${totalWeight} גרם (יעד)`
        : "—";

  return (
    <>
      <Card nested className="border-0 bg-transparent p-0 shadow-none">
        <SectionHeader
          icon={<CalculatorIcon className="h-6 w-6" strokeWidth={1.75} />}
          title="מתכון הבצק"
          subtitle="הזינו משקל בצק סופי ואחוזים — הקמח תמיד 100%. המתכון נשמר אוטומטית וניתן לשיתוף."
        />

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleCopyLink}
          >
            <LinkIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {inp.actions.share}
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleClearStorage}
          >
            <TrashIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {inp.actions.clearStorage}
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <div className="col-span-full flex flex-col gap-2.5">
            <label
              htmlFor="totalWeight"
              className="text-sm font-semibold text-stone-800"
            >
              משקל הבצק הסופי הרצוי (גרם)
            </label>
            <input
              id="totalWeight"
              type="number"
              aria-invalid={validation.fields.totalWeight?.invalid || undefined}
              aria-describedby={
                validation.fields.totalWeight?.message
                  ? "totalWeight-hint"
                  : undefined
              }
              className={cn(
                "calc-field w-full rounded-2xl border-2 bg-amber-50/70 px-4 py-3 text-center font-semibold text-stone-900 transition-colors duration-200 focus:bg-white focus:outline-none focus:ring-2 sm:py-4 sm:text-2xl",
                validation.fields.totalWeight?.invalid
                  ? "border-red-400 bg-red-50/80 focus:border-red-500 focus:ring-red-500/30"
                  : "border-stone-200 focus:border-emerald-600 focus:ring-emerald-500/30",
              )}
              placeholder="1000"
              min={1}
              step={100}
              inputMode="numeric"
              value={totalWeight}
              onChange={(e) => setWeightDraftValue(e.target.value)}
              onBlur={() => commitTotalWeight()}
              onKeyDown={(e) => e.key === "Enter" && onCalculate()}
            />
            {validation.fields.totalWeight?.message && (
              <p
                id="totalWeight-hint"
                role="alert"
                className="text-xs text-red-700"
              >
                {validation.fields.totalWeight.message}
              </p>
            )}
          </div>

          <SmartNumberInput
            id="waterPct"
            allowEmpty
            label="מים (%)"
            value={waterPct}
            min={1}
            max={120}
            step={1}
            onChange={setWaterPct}
            minusLabel="הפחת מים"
            plusLabel="הוסף מים"
            error={validation.fields.waterPct?.invalid}
            warning={validation.fields.waterPct?.warning}
            hint={validation.fields.waterPct?.message}
          />
          <SmartNumberInput
            id="starterPct"
            allowEmpty
            label="מחמצת (%)"
            value={starterPct}
            min={1}
            max={80}
            step={1}
            onChange={setStarterPct}
            minusLabel="הפחת מחמצת"
            plusLabel="הוסף מחמצת"
            error={validation.fields.starterPct?.invalid}
            warning={validation.fields.starterPct?.warning}
            hint={validation.fields.starterPct?.message}
          />
          <SmartNumberInput
            id="saltPct"
            allowEmpty
            label="מלח (%)"
            value={saltPct}
            min={0.5}
            max={5}
            step={0.1}
            onChange={setSaltPct}
            minusLabel="הפחת מלח"
            plusLabel="הוסף מלח"
            error={validation.fields.saltPct?.invalid}
            warning={validation.fields.saltPct?.warning}
            hint={validation.fields.saltPct?.message}
          />
        </div>

        <WeatherPanel form={form} />

        <Card
          nested
          className={cn(
            "mb-8 border-stone-200/80 bg-stone-50/50",
            validation.flourTotalInvalid &&
              "ring-2 ring-red-300/80 ring-offset-2",
          )}
        >
          <h3 className="mb-2 font-serif text-xl font-semibold text-stone-900">
            תערובת קמחים
          </h3>
          <p className="mb-6 text-sm text-stone-600">
            בחרו תערובת מומלצת או ערכו ידנית — הסכום חייב להיות 100%.
          </p>

          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="col-span-full">
              <label
                htmlFor="flourPreset"
                className="mb-2 block text-sm font-semibold text-stone-800"
              >
                תערובת מומלצת
              </label>
              <select
                id="flourPreset"
                className="glass-input w-full text-center text-stone-900 focus:border-emerald-600 focus:ring-emerald-500/30"
                value={preset}
                onChange={(e) =>
                  handlePresetChange(e.target.value as PresetKey)
                }
              >
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {FLOUR_FIELDS.map((field, i) => (
              <SmartNumberInput
                key={field.key}
                id={`flour-${field.key}`}
                label={`${field.label} (%)`}
                value={flourDraft[i] ?? 0}
                min={0}
                max={100}
                step={5}
                deferCommit
                exactCommit
                onChange={(v) => handleFlourPctChange(i, v)}
                minusLabel={`הפחת ${field.label}`}
                plusLabel={`הוסף ${field.label}`}
                compact
                error={validation.flourTotalInvalid}
                hint={
                  i === 0 && validation.fields.flourTotal?.message
                    ? validation.fields.flourTotal.message
                    : undefined
                }
              />
            ))}
          </div>

          <FlourPieChart mix={mix} className="mb-6 mt-2" />

          <p className="text-sm text-stone-600">{presetNote}</p>

          {fermentationAlert && (
            <div className="mt-4">
              <AdviceList items={[fermentationAlert]} />
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            fullWidth
            onClick={onCalculate}
            disabled={!validation.canCalculate}
          >
            <ScaleIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {inp.actions.calculate}
          </Button>
          <Button variant="ghost" fullWidth onClick={openStarterOnlyGuide}>
            <BeakerIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {inp.actions.starterOnly}
          </Button>
        </div>
      </Card>

      {showResults && results && (
        <Card
          id="recipe-results"
          aria-live="polite"
          className="recipe-results-enter mb-8 sm:mb-10"
          key={`${results.flour}-${results.water}-${results.starter}-${results.salt}`}
        >
          <SectionHeader
            icon={<ScaleIcon className="h-6 w-6" strokeWidth={1.75} />}
            title="תוצאות המתכון"
            subtitle="הידרציה אמיתית מחשבת את המים והקמח שבמחמצת (100% הידרציה)."
          />

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            <AnimatedStat
              label="משקל בצק משוער"
              value={displayTotal}
              featured
              className="col-span-2 sm:col-span-1"
            />
            <AnimatedStat
              label="הידרציה אמיתית"
              value={`${results.trueHydration}%`}
              sublabel="כולל מחמצת"
              featured
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { label: "קמח", value: `${results.flour} גרם` },
              { label: "מים", value: `${results.water} גרם` },
              { label: "מחמצת", value: `${results.starter} גרם` },
              { label: "מלח", value: `${results.salt} גרם` },
            ].map((item) => (
              <AnimatedStat
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>

          {bassinage && (
            <MasterBakerTip className="mb-8">
              <strong>בסינאז׳ (Bassinage):</strong> החזיקו בצד כ־
              <strong>{bassinage.holdG} גרם</strong> מים (
              {bassinage.minG}–{bassinage.maxG} גרם) להוספה לאחר האוטוליזה —
              כך תשמרו מרקם ושליטה בבצק.
            </MasterBakerTip>
          )}

          <Card nested className="mb-8 bg-stone-50/80">
            <h4 className="mb-4 font-serif text-lg font-semibold text-stone-900">
              חלוקת הקמח
            </h4>
            <FlourPieChart
              mix={mix}
              flourGrams={results.flour}
              className="mb-6 border-0 bg-transparent p-0 shadow-none"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {mix.items
                .filter((item) => item.pct > 0)
                .map((item) => (
                  <AnimatedStat
                    key={item.key}
                    label={`${item.label} (${item.pct}%)`}
                    value={`${Math.round((results.flour * item.pct) / 100)} גרם`}
                  />
                ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-stone-600">
              {describeFlourMix(mix)}. טווח הידרציה מומלץ: {hydration.low}%–
              {hydration.high}%.
            </p>
            <AdviceList items={warnings} />
          </Card>

          <p className="mt-6 text-center text-sm text-stone-600">
            המשך האפייה, קיפולים והתראות — במדריך השלבים למטה ↓
          </p>
        </Card>
      )}
    </>
  );
}
