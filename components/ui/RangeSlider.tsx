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
  const span = max - min;
  const fillPct =
    span > 0 ? Math.min(100, Math.max(0, ((value - min) / span) * 100)) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-baseline gap-2",
          label ? "justify-between" : "justify-end",
        )}
      >
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : (
          <span id={id} className="sr-only">
            {id}
          </span>
        )}
        <span
          className={cn(
            "font-serif text-lg font-light tabular-nums transition-colors duration-200 motion-reduce:transition-none",
            error ? "text-error" : "text-accent-gold",
          )}
        >
          {display}
        </span>
      </div>
      <div className="relative flex min-h-[44px] items-center py-1">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-border-subtle"
          aria-hidden
        >
          <div
            className="h-full bg-accent-gold/70 transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            "calc-range-track relative z-10",
            "[&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:bg-border-subtle",
            "[&::-webkit-slider-thumb]:mt-[-0.4375rem] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-accent-gold [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(17,16,15,0.8)]",
            "[&::-moz-range-track]:h-0.5 [&::-moz-range-track]:bg-border-subtle",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent-gold",
          )}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-invalid={error || undefined}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-text-muted">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
      {hint && (
        <p className={cn("text-xs", error ? "text-error" : "text-text-muted")}>
          {hint}
        </p>
      )}
    </div>
  );
}
