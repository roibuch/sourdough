"use client";

import { useEffect, useMemo } from "react";
import {
  CalculatorIcon,
  LinkIcon,
  TrashIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { AlarmButtonGroup } from "@/components/AlarmButton";
import { PercentStepper } from "@/components/PercentStepper";
import { FlourPieChart } from "@/components/FlourPieChart";
import { WeatherPanel } from "@/components/WeatherPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatHighlight } from "@/components/ui/StatHighlight";
import { getBassinageAmounts } from "@/lib/dough";
import {
  FLOUR_FIELDS,
  PRESET_OPTIONS,
  describeFlourMix,
  getFermentationFactorWarning,
  getFlourWarnings,
  getHydrationRecommendation,
} from "@/lib/flour";
import { getDoughWorkflow } from "@/lib/workflow";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { PresetKey } from "@/lib/types";

export function RecipeCalculator({ form }: { form: RecipeForm }) {
  const {
    totalWeight,
    setTotalWeight,
    waterPct,
    setWaterPct,
    starterPct,
    setStarterPct,
    saltPct,
    setSaltPct,
    preset,
    setPreset,
    flourPcts,
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
    timelinePlan,
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

  const handleFlourPctChange = (index: number, value: number) => {
    setPreset("custom");
    form.setFlourPcts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setPresetNote(
      `עריכה ידנית: סך הקמחים כרגע ${mix.totalPct}% (יתעדכן). צריך להגיע ל־100%.`,
    );
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
  const workflow = showResults
    ? getDoughWorkflow(mix, waterPct, starterPct, form.roomTemp)
    : null;
  const bassinage = results ? getBassinageAmounts(results.water) : null;

  const bulkAlarms =
    timelinePlan?.schedule &&
    [...timelinePlan.schedule.folds, timelinePlan.schedule.endBulk];

  const handleAlarmResult = (type: "android" | "ics" | "invalid") => {
    if (type === "android") showToast("פותח/ת את שעון האנדרואיד…");
    else if (type === "ics") showToast("הורד קובץ .ics — ייבא/י ליומן.");
    else if (type === "invalid")
      showToast("אין שעה מתוכננת — בנו/י לוח זמנים קודם.");
  };

  const totalWeightNum = parseFloat(totalWeight);
  const displayTotal =
    showResults && results
      ? `${results.flour + results.water + results.starter + results.salt} גרם`
      : totalWeightNum > 0
        ? `~${totalWeight} גרם (יעד)`
        : "—";

  return (
    <>
      <Card className="mb-8 sm:mb-10">
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
            העתק/י קישור
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleClearStorage}
          >
            <TrashIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            איפוס שמירה
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
              className="w-full rounded-2xl border-2 border-stone-200 bg-amber-50/70 px-4 py-5 text-center text-2xl font-semibold text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="1000"
              min={1}
              step={1}
              inputMode="numeric"
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            />
          </div>

          <PercentStepper
            id="waterPct"
            label="מים (%)"
            value={waterPct}
            min={1}
            max={120}
            step={1}
            onChange={setWaterPct}
            minusLabel="הפחת מים"
            plusLabel="הוסף מים"
          />
          <PercentStepper
            id="starterPct"
            label="מחמצת (%)"
            value={starterPct}
            min={1}
            max={80}
            step={1}
            onChange={setStarterPct}
            minusLabel="הפחת מחמצת"
            plusLabel="הוסף מחמצת"
          />
          <PercentStepper
            id="saltPct"
            label="מלח (%)"
            value={saltPct}
            min={0.5}
            max={5}
            step={0.1}
            onChange={setSaltPct}
            minusLabel="הפחת מלח"
            plusLabel="הוסף מלח"
          />
        </div>

        <WeatherPanel form={form} />

        <Card nested className="mb-8 border-stone-200/80 bg-stone-50/50">
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
                className="w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-4 text-center text-base text-stone-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              <PercentStepper
                key={field.key}
                id={`flour-${field.key}`}
                label={`${field.label} (%)`}
                value={flourPcts[i] ?? 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handleFlourPctChange(i, v)}
                minusLabel={`הפחת ${field.label}`}
                plusLabel={`הוסף ${field.label}`}
                compact
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

        <Button variant="primary" fullWidth onClick={handleCalculate}>
          <ScaleIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          חישוב מרכיבים
        </Button>
      </Card>

      {showResults && results && (
        <Card id="recipe-results" aria-live="polite" className="mb-8 sm:mb-10">
          <SectionHeader
            icon={<ScaleIcon className="h-6 w-6" strokeWidth={1.75} />}
            title="תוצאות המתכון"
            subtitle="הידרציה אמיתית מחשבת את המים והקמח שבמחמצת (100% הידרציה)."
          />

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            <StatHighlight
              label="משקל בצק משוער"
              value={displayTotal}
              featured
              className="col-span-2 sm:col-span-1"
            />
            <StatHighlight
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
              <StatHighlight
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
                  <StatHighlight
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

          {workflow && (
            <Card nested className="border-emerald-100 bg-emerald-50/30">
              <h4 className="mb-4 font-serif text-lg font-semibold text-stone-900">
                המשך עבודה וקיפולים
              </h4>
              <AdviceList
                items={[
                  {
                    type: "good",
                    text: `אופי הבצק: ${workflow.profile}.`,
                  },
                  {
                    type: "good",
                    text: `קיפולים: ${workflow.foldCount} סטים של ${workflow.foldStyle}, כל ${workflow.foldEvery}.`,
                  },
                  {
                    type: "warning",
                    text: `Bulk משוער: כ־${workflow.bulkLow}–${workflow.bulkHigh} שעות (מחמצת ${starterPct}%).`,
                  },
                  {
                    type: "good",
                    text: `סימן לעצירה: ${workflow.riseTarget}. ${workflow.foldNote}`,
                  },
                ]}
              />
              {bulkAlarms && bulkAlarms.length > 0 && (
                <div className="mt-6 border-t border-emerald-200/80 pt-6">
                  <p className="mb-3 text-sm font-semibold text-stone-800">
                    התראות לקיפולים וסיום Bulk
                  </p>
                  <AlarmButtonGroup
                    alarms={bulkAlarms}
                    onResult={handleAlarmResult}
                  />
                </div>
              )}
            </Card>
          )}
        </Card>
      )}
    </>
  );
}
