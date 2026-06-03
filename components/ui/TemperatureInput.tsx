"use client";

import { SmartNumberInput, type SmartNumberInputProps } from "@/components/SmartNumberInput";
import { ESTIMATED_ROOM_TEMP_C } from "@/lib/constants/recipeDefaults";
import { heContent, t } from "@/lib/content";
import { cn } from "@/lib/cn";

const copy = heContent.temperature;

type TemperatureInputProps = Omit<
  SmartNumberInputProps,
  "value" | "onChange"
> & {
  value: number;
  onChange: (value: number) => void;
  unknown?: boolean;
  onUnknownChange?: (unknown: boolean) => void;
  estimateC?: number;
};

export function TemperatureInput({
  value,
  onChange,
  unknown = false,
  onUnknownChange,
  estimateC = ESTIMATED_ROOM_TEMP_C,
  className,
  ...inputProps
}: TemperatureInputProps & { className?: string }) {
  const canToggleUnknown = !!onUnknownChange;

  const setUnknown = (next: boolean) => {
    if (!onUnknownChange) return;
    onUnknownChange(next);
    if (next) onChange(estimateC);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <SmartNumberInput
        {...inputProps}
        value={value}
        onChange={(v) => {
          onUnknownChange?.(false);
          onChange(v);
        }}
        disabled={unknown}
        hint={
          unknown
            ? t(copy.unknownActive, { temp: estimateC })
            : inputProps.hint
        }
      />
      {canToggleUnknown && (
        <button
          type="button"
          aria-pressed={unknown}
          onClick={() => setUnknown(!unknown)}
          className={cn(
            "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            unknown
              ? "brand-choice-active"
              : "brand-choice-idle",
          )}
        >
          {copy.unknown}
        </button>
      )}
      {unknown && (
        <p className="text-xs leading-relaxed text-text-muted">
          {t(copy.unknownHint, { temp: estimateC })}
        </p>
      )}
    </div>
  );
}
