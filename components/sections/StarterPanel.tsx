"use client";

import { useMemo, useState } from "react";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { pickRatio } from "@/lib/starter";
import { calculateStarterFeed } from "@/lib/starter";
import type { StarterFeedResult } from "@/lib/starter";
import { useRecipeNav } from "@/components/dashboard/RecipeNavContext";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

export function StarterPanel({
  form,
  inSidebar = false,
}: {
  form: RecipeForm;
  inSidebar?: boolean;
}) {
  const [starterResult, setStarterResult] = useState<StarterFeedResult | null>(
    null,
  );
  const recipeNav = useRecipeNav();

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

  const goToGuide = () => {
    openStarterOnlyGuide();
    recipeNav?.navigateToGuide();
  };

  const starterNeedG = useRecipeStarter
    ? results?.starter ?? 0
    : parseFloat(manualStarterG) || 0;

  const ratioPreview = useMemo(
    () => pickRatio(hoursToAutolyse, roomTemp),
    [hoursToAutolyse, roomTemp],
  );

  const handleCalcStarter = () => {
    if (useRecipeStarter && (!results || results.starter <= 0)) {
      showToast("קודם לחצו «יצירת מתכון», ואז נחשב את המחמצת.");
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
    <article className="glass-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent">
            <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h3 className="font-serif text-xl font-normal text-text-primary">
            האכלת המחמצת
          </h3>
        </div>
        <Button variant="ghost" onClick={goToGuide}>
          מחמצת בלבד
        </Button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-text-secondary">
        {showResults ? (
          <>
            הוציאו מהמקרר והאכלו. לבצק תצטרכו{" "}
            <strong className="font-semibold text-accent tabular-nums">
              {results?.starter} גרם
            </strong>{" "}
            מחמצת בשיא. חכו לכפילות נפח לפי יחס ההאכלה (בדרך כלל 4–12 שעות @
            22°C).
          </>
        ) : (
          <>הוציאו מהמקרר והאכלו. צרו מתכון קודם לכמויות מדויקות.</>
        )}
      </p>

      <div className="space-y-4 border-t border-border-subtle pt-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded-sm border-border-subtle bg-transparent text-accent focus:ring-accent focus:ring-offset-background"
            checked={useRecipeStarter}
            onChange={(e) => setUseRecipeStarter(e.target.checked)}
          />
          <span className="text-sm font-medium text-text-primary">
            השתמשו בכמות המחמצת מחישוב הבצק
          </span>
        </label>

        <div
          className={cn(
            "grid grid-cols-1 gap-5",
            !inSidebar && "sm:grid-cols-2",
          )}
        >
          <div
            className={cn(
              useRecipeStarter && "pointer-events-none opacity-50",
            )}
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
              narrow={inSidebar}
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
            narrow={inSidebar}
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
            narrow={inSidebar}
          />
          <div className="col-span-full">
            <RangeSlider
              id="hoursToAutolyseGuide"
              label="שעות מההאכלה עד מנוחת בצק (אוטוליזה)"
              value={hoursToAutolyse}
              min={4}
              max={16}
              step={0.5}
              unit=" שע׳"
              formatValue={(v) => `${v} שע׳`}
              onChange={setHoursToAutolyse}
            />
            <p className="mt-2 border border-border-subtle bg-surface px-3 py-2 text-xs leading-relaxed text-text-secondary">
              יחס אוטומטי מומלץ:{" "}
              <strong className="text-accent">
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
          <div id="starter-feed-results" className="space-y-4 border-t border-border-subtle pt-4">
            <div className="glass-card p-4">
              <h4 className="mb-2 font-serif text-lg font-normal text-text-primary">
                יחס מומלץ (מחמצת : קמח : מים)
              </h4>
              <p className="inline-block border border-accent/30 bg-accent-muted px-4 py-2 font-serif text-2xl font-light text-accent">
                {starterResult.ratioLabel}
              </p>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                שיא צפוי: כ־{starterResult.expectedPeakHours} שעות
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {starterResult.explain}
              </p>
            </div>
            <div className="border border-border-subtle bg-surface p-4 text-sm leading-relaxed text-text-secondary">
              <h4 className="mb-2 font-medium text-text-primary">
                מה לשלוף מהמקרר
              </h4>
              <p>
                שלפו בערך{" "}
                <strong className="text-text-primary">
                  {starterResult.seedG} גרם
                </strong>{" "}
                מחמצת קרה.
              </p>
              <p className="mt-2">
                הוסיפו{" "}
                <strong className="text-text-primary">
                  {starterResult.flourAddG} גרם
                </strong>{" "}
                קמח ו־
                <strong className="text-text-primary">
                  {starterResult.waterAddG} גרם
                </strong>{" "}
                מים.
              </p>
              <p className="mt-2">
                סה״כ אחרי ערבוב:{" "}
                <strong className="text-text-primary">
                  {starterResult.totalMixG} גרם
                </strong>{" "}
                — מכסה{" "}
                <strong className="tabular-nums text-text-primary">
                  {Math.round(starterNeedG)} גרם
                </strong>{" "}
                לבצק
                {keepInJarG > 0 && (
                  <>
                    {" "}
                    ועוד{" "}
                    <strong className="text-text-primary">
                      {keepInJarG} גרם
                    </strong>{" "}
                    לצנצנת
                  </>
                )}
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
