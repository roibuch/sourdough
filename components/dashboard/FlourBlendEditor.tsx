"use client";

import { useMemo } from "react";
import { FlourPieChart } from "@/components/FlourPieChart";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { FLOUR_FIELDS, PRESET_OPTIONS, buildFlourMix } from "@/lib/flour";
import { FLOUR_TOTAL_TARGET, FLOUR_TOTAL_TOLERANCE } from "@/lib/validation/recipeValidation";
import { sumFlourPcts } from "@/lib/flourBalance";
import { heContent } from "@/lib/content";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { PresetKey } from "@/lib/types";
import { cn } from "@/lib/cn";

const fl = heContent.flour;

interface FlourBlendEditorProps {
  form: RecipeForm;
  flourTotalInvalid: boolean;
  flourTotalMessage?: string;
}

export function FlourBlendEditor({
  form,
  flourTotalInvalid,
  flourTotalMessage,
}: FlourBlendEditorProps) {
  const {
    preset,
    flourDraft,
    setFlourDraftPct,
    presetNote,
    applyPreset,
    setPreset,
  } = form;

  const draftMix = useMemo(() => buildFlourMix(flourDraft), [flourDraft]);
  const total = sumFlourPcts(flourDraft);
  const totalOk = Math.abs(total - FLOUR_TOTAL_TARGET) <= FLOUR_TOTAL_TOLERANCE;

  const handlePreset = (key: PresetKey) => {
    setPreset(key);
    applyPreset(key);
  };

  const handlePct = (index: number, value: number) => {
    setFlourDraftPct(index, value);
  };

  return (
    <div
      className={cn(
        "min-w-0 max-w-full",
        flourTotalInvalid &&
          !totalOk &&
          "rounded-xl ring-2 ring-amber-300/70 ring-offset-2",
      )}
    >
      <p className="mb-2 text-sm font-semibold text-slate-800">
        {heContent.inputs.fields.flourPreset}
      </p>
      <div className="mb-4 flex min-w-0 flex-wrap gap-2">
        {PRESET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePreset(opt.value)}
            className={cn(
              "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              preset === opt.value
                ? "border-crust bg-crust text-dough shadow-sm"
                : "border-warm-border bg-white/80 text-charcoal hover:bg-wheat-muted/50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mb-4 rounded-xl border px-3 py-2.5",
          totalOk
            ? "border-emerald-200/80 bg-emerald-50/60"
            : "border-amber-200/80 bg-amber-50/60",
        )}
      >
        <span className="text-sm font-semibold text-charcoal">
          {fl.totalLabel}:{" "}
          <span className="tabular-nums">{total.toFixed(1)}%</span>
        </span>
        {!totalOk && (
          <p className="mt-1 text-xs text-amber-900">
            {flourTotalMessage ?? "בלחיצה על «חישוב» תבחרו איך לעגל ל־100%."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 @2xl/panel:grid-cols-2">
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
            onChange={(v) => handlePct(i, v)}
            minusLabel={`הפחת ${field.label}`}
            plusLabel={`הוסף ${field.label}`}
            compact
          />
        ))}
      </div>

      <FlourPieChart mix={draftMix} className="mt-4 mb-2" />
      <p className="text-xs leading-relaxed text-stone-600">{presetNote}</p>
    </div>
  );
}
