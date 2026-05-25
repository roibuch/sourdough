"use client";

import { cn } from "@/lib/cn";

export interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
  error?: boolean;
  hint?: string;
}

export function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = "%",
  onChange,
  formatValue,
  className,
  error,
  hint,
}: RangeSliderProps) {
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-baseline gap-2",
          label ? "justify-between" : "justify-end",
        )}
      >
        {label ? (
          <label htmlFor={id} className="text-sm font-semibold text-charcoal">
            {label}
          </label>
        ) : (
          <span id={id} className="sr-only">
            {id}
          </span>
        )}
        <span
          className={cn(
            "font-serif text-lg font-semibold tabular-nums transition-colors duration-200",
            error ? "text-red-700" : "text-crust",
          )}
        >
          {display}
        </span>
      </div>
      <div className="relative flex min-h-11 items-center py-0.5">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-warm-border shadow-inner"
          aria-hidden
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "relative z-10 h-11 w-full min-w-0 cursor-pointer appearance-none bg-transparent",
            "accent-crust",
            "[&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full",
            "[&::-webkit-slider-runnable-track]:bg-warm-border",
            "[&::-webkit-slider-thumb]:mt-[-0.375rem] [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-crust [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-crust/30",
            "[&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-wheat-light",
            "[&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-warm-border",
            "[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-crust",
            "[&::-moz-range-thumb]:shadow-md",
          )}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
          aria-invalid={error || undefined}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-charcoal-muted">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {hint && (
        <p className={cn("text-xs", error ? "text-red-700" : "text-charcoal-muted")}>
          {hint}
        </p>
      )}
    </div>
  );
}
