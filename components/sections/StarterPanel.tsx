"use client";

import { useMemo, useState } from "react";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { pickRatio } from "@/lib/starter";
import { Card } from "@/components/ui/Card";
import { calculateStarterFeed } from "@/lib/starter";
import type { StarterFeedResult } from "@/lib/starter";
import type { RecipeForm } from "@/hooks/useRecipeForm";

export function StarterPanel({ form }: { form: RecipeForm }) {
  const [starterResult, setStarterResult] = useState<StarterFeedResult | null>(
    null,
  );

  const {
    results,
    showResults,
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
    starterRatioPreset,
    showToast,
    openStarterOnlyGuide,
  } = form;

  const starterNeedG = useRecipeStarter
    ? results?.starter ?? 0
    : parseFloat(manualStarterG) || 0;

  const ratioPreview = useMemo(
    () => pickRatio(hoursToAutolyse, roomTemp),
    [hoursToAutolyse, roomTemp],
  );

  const handleCalcStarter = () => {
    if (useRecipeStarter && (!results || results.starter <= 0)) {
      showToast("קודם לחצו «צור מתכון עכשיו» למעלה, ואז נחשב את המחמצת.");
      return;
    }
    if (!useRecipeStarter && starterNeedG <= 0) {
      showToast("הזינו כמות מחמצת נדרשת בגרמים.");
      return;
    }
    const feed = calculateStarterFeed({
      needG: starterNeedG,
      keepInJarG,
      roomTempC: roomTemp,
      hoursToAutolyse,
      ratioPreset: starterRatioPreset,
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

  return (
    <Card nested className="border-0 bg-transparent p-0 shadow-none">
      <article className="step-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-wheat-muted text-crust">
              <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="font-serif text-xl font-semibold">האכלת המחמצת</h3>
          </div>
          <Button variant="ghost" onClick={openStarterOnlyGuide}>
            מחמצת בלבד
          </Button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-stone-600">
          {showResults ? (
            <>
              הוציאו מהמקרר והאכלו. לבצק תצטרכו{" "}
              <strong className="text-crust">
                {results?.starter} גרם
              </strong>{" "}
              מחמצת בשיא. חכו לכפילות נפח לפי יחס ההאכלה (בדרך כלל 4–12 שעות @ 22°C).
            </>
          ) : (
            <>
              הוציאו מהמקרר והאכלו. חשבו מתכון בקטע «מרכיבי בצק» לכמויות מדויקות.
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
            <div
              className={
                useRecipeStarter ? "pointer-events-none opacity-50" : ""
              }
            >
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
            <div className="col-span-full">
              <RangeSlider
                id="hoursToAutolyseGuide"
                label="שעות מההאכלה עד תחילת אוטוליזה"
                value={hoursToAutolyse}
                min={4}
                max={16}
                step={0.5}
                unit=" שע׳"
                formatValue={(v) => `${v} שע׳`}
                onChange={setHoursToAutolyse}
              />
              <p className="mt-2 rounded-xl border border-wheat/60 bg-wheat-muted/40 px-3 py-2 text-xs leading-relaxed text-stone-700">
                יחס אוטומטי מומלץ:{" "}
                <strong className="text-crust">
                  1 : {ratioPreview.flourMult} : {ratioPreview.waterMult}
                </strong>
                {" · "}
                שיא ~{ratioPreview.peakHours} שע׳ @ {Math.round(roomTemp)}°C
              </p>
            </div>
          </div>

          <Button variant="primary" fullWidth onClick={handleCalcStarter}>
            חישוב שליפה מהמקרר והאכלה
          </Button>

          {starterResult && (
            <div id="starter-feed-results" className="mt-5 space-y-4">
              <div className="rounded-2xl border border-wheat/60 bg-wheat-muted/50 p-4">
                <h4 className="mb-2 font-serif font-semibold text-crust-dark">
                  יחס מומלץ (מחמצת : קמח : מים)
                </h4>
                <p className="inline-block rounded-full bg-white px-4 py-2 font-serif text-2xl font-bold text-crust shadow-sm">
                  {starterResult.ratioLabel}
                </p>
                <p className="mt-2 text-sm font-medium text-crust-dark">
                  שיא צפוי: כ־{starterResult.expectedPeakHours} שעות
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
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
    </Card>
  );
}
