"use client";

import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";

export interface SmartNumberInputProps {
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
  /** Allow clearing the field while typing; on blur empty → 0 or min */
  allowEmpty?: boolean;
  suffix?: string;
  error?: boolean;
  warning?: boolean;
  hint?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatStored(value: number, step: number): number {
  if (step < 1) return Math.round(value * 10) / 10;
  return Math.round(value);
}

function toDisplay(value: number, step: number): string {
  if (step < 1) return String(formatStored(value, step));
  return String(Math.round(value));
}

export function SmartNumberInput({
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
  allowEmpty = true,
  suffix,
  error,
  warning,
  hint,
}: SmartNumberInputProps) {
  const [text, setText] = useState(() => toDisplay(value, step));

  useEffect(() => {
    setText(toDisplay(value, step));
  }, [value, step]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === ".") {
      const fallback = allowEmpty ? 0 : min;
      onChange(clamp(fallback, min, max));
      setText(allowEmpty ? "" : toDisplay(fallback, step));
      return;
    }
    const n = parseFloat(trimmed.replace(",", "."));
    if (Number.isNaN(n)) {
      setText(toDisplay(value, step));
      return;
    }
    const next = clamp(formatStored(n, step), min, max);
    onChange(next);
    setText(toDisplay(next, step));
  };

  const adjust = (dir: "minus" | "plus") => {
    const base = text === "" ? value : parseFloat(text);
    const current = Number.isNaN(base) ? value : base;
    const delta = dir === "plus" ? step : -step;
    const next = clamp(formatStored(current + delta, step), min, max);
    onChange(next);
    setText(toDisplay(next, step));
  };

  const btnClass = cn(
    "flex shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white shadow-md shadow-emerald-900/20 transition",
    "hover:bg-emerald-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
    compact ? "h-11 w-11" : "h-12 w-12 sm:h-14 sm:w-14",
  );

  return (
    <div className="flex flex-col gap-2.5">
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-semibold",
          error ? "text-red-800" : warning ? "text-amber-900" : "text-stone-800",
        )}
      >
        {label}
        {suffix && (
          <span className="ms-1 font-normal text-stone-500">{suffix}</span>
        )}
      </label>
      {hint && (
        <p
          id={`${id}-hint`}
          role={error ? "alert" : undefined}
          className={cn(
            "-mt-1 text-xs leading-relaxed",
            error && "text-red-700",
            warning && !error && "text-amber-800",
            !error && !warning && "text-stone-500",
          )}
        >
          {hint}
        </p>
      )}
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
          type="text"
          inputMode={step < 1 ? "decimal" : "numeric"}
          autoComplete="off"
          aria-invalid={error || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            "min-w-0 flex-1 rounded-2xl border-2 bg-amber-50/70 text-center font-semibold text-stone-900 tabular-nums transition-colors duration-200",
            error
              ? "border-red-400 bg-red-50/80 focus:border-red-500 focus:ring-red-500/30"
              : warning
                ? "border-amber-400 bg-amber-50/90 focus:border-amber-500 focus:ring-amber-500/30"
                : "border-stone-200 focus:border-emerald-600",
            "focus:bg-white focus:outline-none focus:ring-2",
            error
              ? "focus:ring-red-500/30"
              : warning
                ? "focus:ring-amber-500/30"
                : "focus:ring-emerald-500/30",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            compact ? "px-3 py-3 text-lg" : "px-4 py-4 text-xl sm:text-2xl",
          )}
          value={text}
          placeholder="—"
          onChange={(e) => {
            const raw = e.target.value;
            if (/^-?\d*\.?\d*$/.test(raw) || raw === "") {
              setText(raw);
              if (raw !== "" && raw !== "-" && raw !== ".") {
                const n = parseFloat(raw);
                if (!Number.isNaN(n)) onChange(clamp(formatStored(n, step), min, max));
              }
            }
          }}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as HTMLInputElement).blur();
            }
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

/** @deprecated Use SmartNumberInput — kept for imports */
export const PercentStepper = SmartNumberInput;
export type PercentStepperProps = SmartNumberInputProps;
