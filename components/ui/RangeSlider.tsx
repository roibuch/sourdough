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
      <div className="flex min-h-11 items-center py-0.5">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "calc-range-track",
            "rounded-full bg-warm-border/80 accent-crust",
            "[&::-webkit-slider-runnable-track]:h-2.5 [&::-webkit-slider-runnable-track]:rounded-full",
            "[&::-webkit-slider-thumb]:mt-[-0.375rem] [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-crust [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-crust/30",
            "[&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-wheat-light",
            "[&::-moz-range-track]:h-2.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-warm-border/80",
            "[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-crust",
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
