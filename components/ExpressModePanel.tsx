"use client";

import { BoltIcon, FireIcon } from "@heroicons/react/24/outline";
import {
  STARTER_RATIO_OPTIONS,
  expressModeSummary,
  getWarmZoneRecommendation,
  type FermentationPace,
  type StarterRatioPreset,
} from "@/lib/expressMode";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

export function ExpressModePanel({ form }: { form: RecipeForm }) {
  const {
    fermentationPace,
    setFermentationPace,
    starterRatioPreset,
    setStarterRatioPreset,
    hoursToAutolyse,
    schedulePersist,
  } = form;

  const warmZone = getWarmZoneRecommendation(
    hoursToAutolyse,
    fermentationPace,
    starterRatioPreset,
  );

  const summary = expressModeSummary(fermentationPace);

  const setPace = (pace: FermentationPace) => {
    setFermentationPace(pace);
    schedulePersist();
  };

  const setRatio = (preset: StarterRatioPreset) => {
    setStarterRatioPreset(preset);
    schedulePersist();
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
          <BoltIcon className="h-5 w-5 text-amber-600" aria-hidden />
          קצב התהליך
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPace("standard")}
            className={cn(
              "rounded-xl border-2 px-3 py-3 text-sm font-semibold transition",
              fermentationPace === "standard"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
            )}
          >
            רגיל
          </button>
          <button
            type="button"
            onClick={() => setPace("express")}
            className={cn(
              "rounded-xl border-2 px-3 py-3 text-sm font-semibold transition",
              fermentationPace === "express"
                ? "border-amber-500 bg-amber-50 text-amber-950"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
            )}
          >
            ⚡ מואץ — אין מספיק זמן
          </button>
        </div>
        {summary && (
          <p className="mt-3 text-xs leading-relaxed text-amber-900">{summary}</p>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-stone-800">
          יחס האכלת מחמצת (מחמצת : קמח : מים)
        </p>
        <div className="flex flex-wrap gap-2">
          {STARTER_RATIO_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRatio(opt.id)}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm font-medium transition",
                starterRatioPreset === opt.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                  : "border-stone-200 text-stone-600 hover:border-emerald-300",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {
            STARTER_RATIO_OPTIONS.find((r) => r.id === starterRatioPreset)
              ?.note
          }
        </p>
      </div>

      {warmZone && (
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-4">
          <p className="mb-2 flex items-center gap-2 font-semibold text-orange-950">
            <FireIcon className="h-5 w-5" aria-hidden />
            חימום מקומי מומלץ — {warmZone.title}
          </p>
          <p className="mb-2 text-sm text-orange-900">
            יעד טמפרטורה: <strong>{warmZone.targetTemp}</strong>
          </p>
          <ol className="list-decimal space-y-1 pr-4 text-sm leading-relaxed text-stone-700">
            {warmZone.steps.map((step) => (
              <li key={step}>{step.replace(/\*\*/g, "")}</li>
            ))}
          </ol>
          {warmZone.warning && (
            <p className="mt-3 text-xs font-semibold text-red-800">
              {warmZone.warning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
