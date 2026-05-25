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
  /** Sidebar column — single column, compact chart */
  inSidebar?: boolean;
}

export function FlourBlendEditor({
  form,
  flourTotalInvalid,
  flourTotalMessage,
  inSidebar = false,
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
          "rounded-lg border-2 border-amber-400/80",
      )}
    >
      <p className="mb-2 text-sm font-medium text-text-primary">
        {heContent.inputs.fields.flourPreset}
      </p>
      <div className="mb-4 flex min-w-0 flex-wrap gap-2">
        {PRESET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePreset(opt.value)}
            className={cn(
              "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              inSidebar && "px-2.5 py-2 text-xs",
              preset === opt.value
                ? "brand-choice-active"
                : "brand-choice-idle",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mb-4 border px-3 py-2.5",
          totalOk
            ? "border-accent-gold/30 bg-accent-gold-muted/20"
            : "border-accent-gold/50 bg-accent-gold-muted/30",
        )}
      >
        <span className="text-sm font-medium text-text-primary">
          {fl.totalLabel}:{" "}
          <span className="tabular-nums">{total.toFixed(1)}%</span>
        </span>
        {!totalOk && (
          <p className="mt-1 text-xs text-text-secondary">
            {flourTotalMessage ?? "בלחיצה על «יצירת מתכון» תבחרו איך לעגל ל־100%."}
          </p>
        )}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          !inSidebar && "@2xl/panel:grid-cols-2",
        )}
      >
        {FLOUR_FIELDS.map((field, i) => (
          <SmartNumberInput
            key={field.key}
            id={`flour-${field.key}`}
            label={`${field.label} (%)`}
            value={flourDraft[i] ?? 0}
            min={0}
            max={100}
            step={5}
            jumpStep={5}
            suffix="%"
            deferCommit
            onChange={(v) => handlePct(i, v)}
            minusLabel={`הפחת ${field.label}`}
            plusLabel={`הוסף ${field.label}`}
            compact
            narrow={inSidebar}
          />
        ))}
      </div>

      <FlourPieChart
        mix={draftMix}
        stacked={inSidebar}
        className="mt-3 mb-1"
      />
      <p className="text-xs leading-relaxed text-text-muted">{presetNote}</p>
    </div>
  );
}
