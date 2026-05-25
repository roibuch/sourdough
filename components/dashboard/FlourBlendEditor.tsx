"use client";

import { FlourPieChart } from "@/components/FlourPieChart";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { Button } from "@/components/ui/Button";
import { FLOUR_FIELDS, PRESET_OPTIONS } from "@/lib/flour";
import { FLOUR_TOTAL_TARGET, FLOUR_TOTAL_TOLERANCE } from "@/lib/validation/recipeValidation";
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
    flourPcts,
    mix,
    presetNote,
    applyPreset,
    setPreset,
    setFlourPcts,
    balanceFlourBlend,
  } = form;

  const total = mix.totalPct;
  const totalOk = Math.abs(total - FLOUR_TOTAL_TARGET) <= FLOUR_TOTAL_TOLERANCE;

  const handlePreset = (key: PresetKey) => {
    setPreset(key);
    applyPreset(key);
  };

  const handlePct = (index: number, value: number) => {
    setPreset("custom");
    setFlourPcts((prev) => {
      const next = [...prev];
      next[index] = Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
      return next;
    });
  };

  return (
    <div
      className={cn(
        flourTotalInvalid && "rounded-xl ring-2 ring-red-300/70 ring-offset-2",
      )}
    >
      <p className="mb-2 text-sm font-semibold text-slate-800">
        {heContent.inputs.fields.flourPreset}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handlePreset(opt.value)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm",
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
          "mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5",
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
          <Button variant="ghost" type="button" onClick={balanceFlourBlend}>
            {fl.balanceTo100}
          </Button>
        )}
      </div>
      {flourTotalMessage && !totalOk && (
        <p className="mb-3 text-xs text-red-800">{flourTotalMessage}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FLOUR_FIELDS.map((field, i) => (
          <SmartNumberInput
            key={field.key}
            id={`flour-${field.key}`}
            label={`${field.label} (%)`}
            value={flourPcts[i] ?? 0}
            min={0}
            max={100}
            step={5}
            onChange={(v) => handlePct(i, v)}
            minusLabel={`הפחת ${field.label}`}
            plusLabel={`הוסף ${field.label}`}
            compact
          />
        ))}
      </div>

      <FlourPieChart mix={mix} className="mt-4 mb-2" />
      <p className="text-xs leading-relaxed text-stone-600">{presetNote}</p>
    </div>
  );
}
