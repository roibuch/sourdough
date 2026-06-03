"use client";

import { useEffect, useMemo, useState } from "react";
import { FireIcon } from "@heroicons/react/24/outline";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { TemperatureInput } from "@/components/ui/TemperatureInput";
import { AnimatedStat } from "@/components/ui/AnimatedStat";
import { FieldLabelWithTip, InfoTooltip } from "@/components/ui/InfoTooltip";
import { ESTIMATED_ROOM_TEMP_C } from "@/lib/constants/recipeDefaults";
import { heContent, t } from "@/lib/content";
import {
  calculateWaterTempDDT,
  DDT_FRICTION_OPTIONS,
  DDT_TARGET_DEFAULT,
} from "@/lib/bakingMath";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

const d = heContent.ddt;

export function DoughTemperatureCalculator({ form }: { form: RecipeForm }) {
  const { results, showResults, roomTemp } = form;

  const [targetDdt, setTargetDdt] = useState(DDT_TARGET_DEFAULT);
  const [flourTemp, setFlourTemp] = useState(roomTemp);
  const [ambientTemp, setAmbientTemp] = useState(roomTemp);
  const [friction, setFriction] = useState(0);
  const [starterTemp, setStarterTemp] = useState(roomTemp);

  const [unknownAmbient, setUnknownAmbient] = useState(false);
  const [unknownFlour, setUnknownFlour] = useState(false);
  const [unknownStarter, setUnknownStarter] = useState(false);

  useEffect(() => {
    if (!unknownAmbient) setAmbientTemp(roomTemp);
    if (!unknownFlour) setFlourTemp(unknownAmbient ? ESTIMATED_ROOM_TEMP_C : roomTemp);
    if (!unknownStarter) setStarterTemp(unknownAmbient ? ESTIMATED_ROOM_TEMP_C : roomTemp);
  }, [roomTemp, unknownAmbient, unknownFlour, unknownStarter]);

  const effectiveAmbient = unknownAmbient ? ESTIMATED_ROOM_TEMP_C : ambientTemp;
  const effectiveFlour = unknownFlour ? effectiveAmbient : flourTemp;
  const effectiveStarter = unknownStarter ? effectiveAmbient : starterTemp;

  const flourG = results?.flour ?? 500;
  const waterG = results?.water ?? 350;
  const starterG = results?.starter ?? 100;
  const fromRecipe = showResults && !!results;
  const anyUnknown = unknownAmbient || unknownFlour || unknownStarter;

  const ddt = useMemo(
    () =>
      calculateWaterTempDDT({
        targetDoughTempC: targetDdt,
        flourTempC: effectiveFlour,
        roomTempC: effectiveAmbient,
        flourWeightG: flourG,
        waterWeightG: waterG,
        frictionFactorC: friction,
        starterWeightG: starterG,
        starterTempC: effectiveStarter,
      }),
    [
      targetDdt,
      effectiveFlour,
      effectiveAmbient,
      flourG,
      waterG,
      friction,
      starterG,
      effectiveStarter,
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
            {d.title}
            <InfoTooltip term="ddt" />
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            {d.subtitle}
          </p>
        </div>
      </div>

      {!fromRecipe && (
        <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          {d.sampleWeights}
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
            minusLabel={d.lowerTarget}
            plusLabel={d.raiseTarget}
            compact
          />
          <p className="mt-1 text-xs text-stone-500">{d.targetHint}</p>
        </div>
        <TemperatureInput
          id="ddt-room"
          label={d.roomTemp}
          suffix="°C"
          value={ambientTemp}
          min={16}
          max={32}
          step={1}
          onChange={setAmbientTemp}
          unknown={unknownAmbient}
          onUnknownChange={setUnknownAmbient}
          minusLabel={d.lower}
          plusLabel={d.raise}
          compact
        />
        <TemperatureInput
          id="ddt-flour-temp"
          label={d.flourTemp}
          suffix="°C"
          value={flourTemp}
          min={5}
          max={35}
          step={1}
          onChange={setFlourTemp}
          unknown={unknownFlour}
          onUnknownChange={setUnknownFlour}
          estimateC={effectiveAmbient}
          minusLabel={d.lower}
          plusLabel={d.raise}
          compact
        />
        <TemperatureInput
          id="ddt-starter-temp"
          label={d.starterTemp}
          suffix="°C"
          value={starterTemp}
          min={5}
          max={35}
          step={1}
          onChange={setStarterTemp}
          unknown={unknownStarter}
          onUnknownChange={setUnknownStarter}
          estimateC={effectiveAmbient}
          minusLabel={d.lower}
          plusLabel={d.raise}
          compact
        />
      </div>

      {anyUnknown && (
        <p className="mb-4 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs text-text-secondary">
          {t(d.estimateNote, { temp: ESTIMATED_ROOM_TEMP_C })}
        </p>
      )}

      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-semibold text-slate-800">
          {d.frictionLegend}
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
            label={d.pourWater}
            value={`${ddt.waterTempC}°C`}
            featured
            className={cn(
              ddt.band === "too_cold" && "border-blue-300",
              ddt.band === "too_hot" && "border-red-300",
            )}
          />
          <div className="flex flex-col justify-center rounded-2xl border border-stone-200/80 bg-white/80 p-4 text-sm text-stone-600">
            {ddt.warning && (
              <p className="text-amber-900">{ddt.warning}</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
