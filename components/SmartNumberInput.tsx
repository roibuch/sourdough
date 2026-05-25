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
  /** Only notify parent on blur / ± — keeps typed text while editing */
  deferCommit?: boolean;
  /** On blur: keep the parsed number as typed (no extra rounding) */
  exactCommit?: boolean;
  /** Called after blur commit (e.g. sync draft to URL) */
  onDeferredBlur?: () => void;
  suffix?: string;
  /** Large quick jump (e.g. ±100g dough, ±5% flour) — separate from step */
  jumpStep?: number;
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

function toDisplay(value: number, step: number, exact: boolean): string {
  if (!Number.isFinite(value)) return "";
  if (exact) return String(value);
  if (step < 1) return String(formatStored(value, step));
  return String(Math.round(value));
}

function displayFromRaw(raw: string, exact: boolean): string {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "" || trimmed === "-" || trimmed === ".") return trimmed;
  const n = parseFloat(trimmed);
  if (Number.isNaN(n)) return raw;
  return exact ? String(n) : raw;
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
  deferCommit = false,
  exactCommit = false,
  onDeferredBlur,
  suffix,
  jumpStep,
  error,
  warning,
  hint,
}: SmartNumberInputProps) {
  const exact = exactCommit || deferCommit;
  const [text, setText] = useState(() => toDisplay(value, step, exact));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused && deferCommit) return;
    setText(toDisplay(value, step, exact));
  }, [value, step, focused, deferCommit, exact]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === ".") {
      const fallback = allowEmpty ? 0 : min;
      onChange(clamp(fallback, min, max));
      setText(allowEmpty ? "" : toDisplay(fallback, step, exact));
      return;
    }
    const n = parseFloat(trimmed.replace(",", "."));
    if (Number.isNaN(n)) {
      setText(toDisplay(value, step, exact));
      return;
    }
    const next = exact
      ? clamp(n, min, max)
      : clamp(formatStored(n, step), min, max);
    onChange(next);
    setText(exact ? displayFromRaw(trimmed, true) : toDisplay(next, step, false));
  };

  const applyDelta = (delta: number) => {
    const base = text === "" ? value : parseFloat(text.replace(",", "."));
    const current = Number.isNaN(base) ? value : base;
    const next = exact
      ? clamp(current + delta, min, max)
      : clamp(formatStored(current + delta, step), min, max);
    onChange(next);
    setText(toDisplay(next, step, exact));
  };

  const adjust = (dir: "minus" | "plus") => {
    applyDelta(dir === "plus" ? step : -step);
  };

  const jumpPillClass =
    "touch-target min-h-[44px] rounded-sm border border-border-subtle bg-surface-elevated px-3 text-xs font-medium text-text-secondary motion-safe:transition-colors hover:border-accent-gold/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const btnClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-gold text-background motion-safe:transition-colors",
    "hover:bg-accent-gold-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "min-h-[44px] min-w-[44px]",
  );

  return (
    <div className="flex flex-col gap-2.5">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-semibold",
            error ? "text-error" : warning ? "text-accent-gold" : "text-text-primary",
          )}
        >
          {label}
          {suffix && (
            <span className="ms-1 font-normal text-text-muted">{suffix}</span>
          )}
        </label>
      ) : suffix ? (
        <span className="sr-only" id={`${id}-label`}>
          {suffix}
        </span>
      ) : null}
      {hint && (
        <p
          id={`${id}-hint`}
          role={error ? "alert" : undefined}
          className={cn(
            "-mt-1 text-xs leading-relaxed",
            error && "text-error",
            warning && !error && "text-accent-gold",
            !error && !warning && "text-text-muted",
          )}
        >
          {hint}
        </p>
      )}
      <div className="@container/stepper flex w-full min-w-0 items-center gap-1.5 @min-[17.5rem]/stepper:gap-2 @min-[20rem]/stepper:gap-3">
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
            "glass-input min-w-0 flex-1 text-center font-light transition-colors duration-200",
            error && "border-error/70 focus:border-error",
            warning && !error && "border-accent-gold/50",
            compact ? "text-lg" : "text-xl",
          )}
          value={text}
          placeholder="—"
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            const raw = e.target.value;
            if (/^-?\d*\.?\d*$/.test(raw) || raw === "") {
              setText(raw);
              if (deferCommit) return;
              if (raw !== "" && raw !== "-" && raw !== ".") {
                const n = parseFloat(raw.replace(",", "."));
                if (!Number.isNaN(n)) {
                  onChange(
                    exact
                      ? clamp(n, min, max)
                      : clamp(formatStored(n, step), min, max),
                  );
                }
              }
            }
          }}
          onBlur={() => {
            setFocused(false);
            commit(text);
            if (deferCommit) onDeferredBlur?.();
          }}
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
      {jumpStep != null && jumpStep > 0 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            className={jumpPillClass}
            onClick={() => applyDelta(-jumpStep)}
            aria-label={`הפחת ${jumpStep}${suffix ? ` ${suffix}` : ""}`}
          >
            −{jumpStep}
            {suffix ? ` ${suffix}` : ""}
          </button>
          <button
            type="button"
            className={jumpPillClass}
            onClick={() => applyDelta(jumpStep)}
            aria-label={`הוסף ${jumpStep}${suffix ? ` ${suffix}` : ""}`}
          >
            +{jumpStep}
            {suffix ? ` ${suffix}` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

/** @deprecated Use SmartNumberInput — kept for imports */
export const PercentStepper = SmartNumberInput;
export type PercentStepperProps = SmartNumberInputProps;
