"use client";

import { useEffect, useMemo, useState } from "react";
import { FireIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { AnimatedStat } from "@/components/ui/AnimatedStat";
import { FieldLabelWithTip, InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  calculateWaterTempDDT,
  DDT_FRICTION_OPTIONS,
  DDT_TARGET_DEFAULT,
} from "@/lib/bakingMath";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

/**
 * DDT: desired dough temp + room/flour temps → exact water temperature.
 */
export function DoughTemperatureCalculator({ form }: { form: RecipeForm }) {
  const { results, showResults, roomTemp } = form;

  const [targetDdt, setTargetDdt] = useState(DDT_TARGET_DEFAULT);
  const [flourTemp, setFlourTemp] = useState(roomTemp);
  const [ambientTemp, setAmbientTemp] = useState(roomTemp);
  const [friction, setFriction] = useState(0);
  const [starterTemp, setStarterTemp] = useState(roomTemp);

  useEffect(() => {
    setAmbientTemp(roomTemp);
    setStarterTemp(roomTemp);
    setFlourTemp(roomTemp);
  }, [roomTemp]);

  const flourG = results?.flour ?? 500;
  const waterG = results?.water ?? 350;
  const starterG = results?.starter ?? 100;
  const fromRecipe = showResults && !!results;

  const ddt = useMemo(
    () =>
      calculateWaterTempDDT({
        targetDoughTempC: targetDdt,
        flourTempC: flourTemp,
        roomTempC: ambientTemp,
        flourWeightG: flourG,
        waterWeightG: waterG,
        frictionFactorC: friction,
        starterWeightG: starterG,
        starterTempC: starterTemp,
      }),
    [
      targetDdt,
      flourTemp,
      ambientTemp,
      flourG,
      waterG,
      friction,
      starterG,
      starterTemp,
    ],
  );

  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white/60 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wheat-100 text-amber-900">
          <FireIcon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="flex flex-wrap items-center gap-2 font-serif text-lg font-semibold text-charcoal">
            מחשבון טמפרטורת מים
            <InfoTooltip term="ddt" />
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            הזינו טמפרטורת חדר ויעד לבצק — נחשב בדיוק באיזו טמפרטורה לשפוך את
            המים.
          </p>
        </div>
      </div>

      {!fromRecipe && (
        <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          משקלים לדוגמה — אחרי «חישוב מרכיבים» יתעדכנו לפי המתכון שלכם.
        </p>
      )}

      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <FieldLabelWithTip term="ddt" />
          <SmartNumberInput
            id="ddt-target"
            label=""
            suffix="°C"
            value={targetDdt}
            min={20}
            max={28}
            step={0.5}
            onChange={setTargetDdt}
            minusLabel="הורד יעד בצק"
            plusLabel="העלה יעד בצק"
            compact
          />
          <p className="mt-1 text-xs text-stone-500">יעד בצק סופי (בדרך כלל 24–26°C)</p>
        </div>
        <SmartNumberInput
          id="ddt-room"
          label="טמפרטורת חדר"
          suffix="°C"
          value={ambientTemp}
          min={16}
          max={32}
          step={1}
          onChange={setAmbientTemp}
          minusLabel="הורד"
          plusLabel="העלה"
          compact
        />
        <SmartNumberInput
          id="ddt-flour-temp"
          label="טמפרטורת קמח"
          suffix="°C"
          value={flourTemp}
          min={5}
          max={35}
          step={1}
          onChange={setFlourTemp}
          minusLabel="הורד"
          plusLabel="העלה"
          compact
        />
        <SmartNumberInput
          id="ddt-starter-temp"
          label="טמפרטורת מחמצת"
          suffix="°C"
          value={starterTemp}
          min={5}
          max={35}
          step={1}
          onChange={setStarterTemp}
          minusLabel="הורד"
          plusLabel="העלה"
          compact
        />
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-semibold text-slate-800">
          חום מלישה
        </legend>
        <div className="flex flex-wrap gap-2">
          {DDT_FRICTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFriction(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                friction === opt.value
                  ? "border-crust bg-wheat-muted text-crust shadow-[0_0_10px_rgb(212_165_116_/_0.3)] ring-2 ring-wheat/50"
                  : "border-warm-border bg-white text-charcoal-muted hover:border-wheat",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {ddt && (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatedStat
            label="שפכו מים בטמפרטורה"
            value={`${ddt.waterTempC}°C`}
            featured
            className={cn(
              ddt.band === "too_cold" && "border-blue-300",
              ddt.band === "too_hot" && "border-red-300",
            )}
          />
          <div className="flex flex-col justify-center rounded-2xl border border-stone-200/80 bg-white/80 p-4 text-sm text-stone-600">
            <p className="flex items-center gap-2 font-medium text-slate-800">
              <BeakerIcon className="h-4 w-4" aria-hidden />
              לפי {Math.round(ddt.totalMassG)} גרם בבצק
            </p>
            <p className="mt-2 text-xs">
              חדר {ambientTemp}°C · יעד בצק {targetDdt}°C
              {fromRecipe && " · משקלים מהמתכון"}
            </p>
          </div>
        </div>
      )}

      {ddt?.warning && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {ddt.warning}
        </p>
      )}
    </article>
  );
}
