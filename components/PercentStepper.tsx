"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

export interface PercentStepperProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  minusLabel: string;
  plusLabel: string;
  compact?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatValue(value: number, step: number): number {
  if (step < 1) return Math.round(value * 10) / 10;
  return Math.round(value);
}

export function PercentStepper({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  minusLabel,
  plusLabel,
  compact,
}: PercentStepperProps) {
  const adjust = (dir: "minus" | "plus") => {
    const delta = dir === "plus" ? step : -step;
    onChange(clamp(formatValue(value + delta, step), min, max));
  };

  const btnClass = cn(
    "flex shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white shadow-md shadow-emerald-900/20 transition",
    "hover:bg-emerald-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
    compact ? "h-11 w-11" : "h-12 w-12 sm:h-14 sm:w-14",
  );

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="text-sm font-semibold text-stone-800">
        {label}
      </label>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className={btnClass}
          onClick={() => adjust("minus")}
          aria-label={minusLabel}
        >
          <MinusIcon className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.5} />
        </button>
        <input
          id={id}
          type="number"
          className={cn(
            "min-w-0 flex-1 rounded-2xl border-2 border-stone-200 bg-amber-50/70 text-center font-semibold text-stone-900",
            "focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
            compact ? "px-3 py-3 text-lg" : "px-4 py-4 text-xl sm:text-2xl",
          )}
          value={value}
          min={min}
          max={max}
          step={step}
          inputMode={step < 1 ? "decimal" : "numeric"}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n, min, max));
          }}
        />
        <button
          type="button"
          className={btnClass}
          onClick={() => adjust("plus")}
          aria-label={plusLabel}
        >
          <PlusIcon className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
