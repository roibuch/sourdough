"use client";

import { useMemo } from "react";
import { FlourPieChart } from "@/components/FlourPieChart";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { FLOUR_FIELDS, PRESET_OPTIONS, buildFlourMix } from "@/lib/flour";
import type { FlourKey } from "@/lib/types";
import type { GlossaryTerm } from "@/lib/glossary";
import { FLOUR_TOTAL_TARGET, FLOUR_TOTAL_TOLERANCE } from "@/lib/validation/recipeValidation";
import { sumFlourPcts } from "@/lib/flourBalance";
import { heContent } from "@/lib/content";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { PresetKey } from "@/lib/types";
import { cn } from "@/lib/cn";

const fl = heContent.flour;

const FLOUR_TOOLTIP: Partial<Record<FlourKey, GlossaryTerm>> = {
  bread: "bread-flour",
  whiteWheat: "white-wheat",
  manitoba: "manitoba",
  wholeWheat: "whole-wheat",
  wholeRye: "whole-rye",
  allPurpose: "all-purpose",
};

interface FlourBlendEditorProps {
  form: RecipeForm;
  flourTotalInvalid: boolean;
  flourTotalMessage?: string;
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
          "rounded-lg border-2 border-red-400/70",
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
            : "border-red-300/80 bg-red-50/50",
        )}
      >
        <span
          className={cn(
            "text-sm font-medium",
            totalOk ? "text-text-primary" : "text-red-700",
          )}
        >
          {fl.totalLabel}:{" "}
          <span className="tabular-nums">{total.toFixed(1)}%</span>
        </span>
        {!totalOk && (
          <p className="mt-1 text-xs text-red-700">
            {flourTotalMessage ?? "סך הקמחים חייב להיות בדיוק 100%."}
          </p>
        )}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          !inSidebar && "@2xl/panel:grid-cols-2",
        )}
      >
        {FLOUR_FIELDS.map((field, i) => {
          const tip = FLOUR_TOOLTIP[field.key];
          return (
            <div key={field.key} className="min-w-0">
              <div className="mb-1 flex items-center gap-1">
                <span className="text-xs font-medium text-text-primary sm:text-sm">
                  {field.label}
                </span>
                {tip && <InfoTooltip term={tip} hover />}
              </div>
              <SmartNumberInput
                id={`flour-${field.key}`}
                label=""
                value={flourDraft[i] ?? 0}
                min={0}
                max={100}
                step={2}
                jumpStep={10}
                suffix="%"
                deferCommit
                onChange={(v) => handlePct(i, v)}
                minusLabel={`הפחת ${field.label}`}
                plusLabel={`הוסף ${field.label}`}
                compact
                narrow={inSidebar}
              />
            </div>
          );
        })}
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
