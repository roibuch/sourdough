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
  allowEmpty?: boolean;
  deferCommit?: boolean;
  exactCommit?: boolean;
  onDeferredBlur?: () => void;
  suffix?: string;
  jumpStep?: number;
  /** Sidebar / narrow column — tighter stepper, no clipping */
  narrow?: boolean;
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

  const stepBtn = cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-primary shadow-sm",
    "hover:border-accent/40 hover:bg-accent-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    narrow
      ? "h-10 w-10 min-h-10 min-w-10"
      : "touch-target min-h-11 min-w-11",
  );

  const jumpPillClass = cn(
    "rounded-lg border border-border-subtle bg-surface-elevated text-xs font-semibold text-text-secondary",
    "hover:border-accent/40 hover:bg-accent-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    narrow ? "min-h-10 flex-1 px-2 py-2" : "touch-target min-h-[44px] px-3",
  );

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "block leading-snug",
            narrow ? "text-xs font-medium" : "text-sm font-medium",
            error ? "text-error" : warning ? "text-accent" : "text-text-primary",
          )}
        >
          {label}
          {suffix && !narrow && (
            <span className="ms-1 font-normal text-text-muted">{suffix}</span>
          )}
        </label>
      ) : suffix ? (
        <span className="sr-only" id={`${id}-label`}>
          {suffix}
        </span>
      ) : null}
      {label && suffix && narrow && (
        <span className="-mt-1 block text-xs text-text-muted">{suffix}</span>
      )}
      {hint && (
        <p
          id={`${id}-hint`}
          role={error ? "alert" : undefined}
          className={cn(
            "text-xs leading-relaxed",
            error && "text-error",
            warning && !error && "text-accent",
            !error && !warning && "text-text-muted",
          )}
        >
          {hint}
        </p>
      )}
      <div
        className={cn(
          "flex w-full min-w-0 max-w-full items-center",
          narrow ? "gap-1.5" : "gap-2 @container/stepper",
        )}
      >
        <button type="button" className={stepBtn} onClick={() => adjust("minus")} aria-label={minusLabel}>
          <MinusIcon className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2} />
        </button>
        <input
          id={id}
          type="text"
          inputMode={step < 1 ? "decimal" : "numeric"}
          autoComplete="off"
          aria-invalid={error || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            "glass-input min-w-0 flex-1",
            error && "border-error focus:border-error focus:ring-red-200",
            warning && !error && "border-amber-300 focus:border-accent",
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
        <button type="button" className={stepBtn} onClick={() => adjust("plus")} aria-label={plusLabel}>
          <PlusIcon className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2} />
        </button>
      </div>
      {jumpStep != null && jumpStep > 0 && (
        <div className={cn("flex gap-2", narrow ? "w-full" : "justify-center")}>
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

export const PercentStepper = SmartNumberInput;
export type PercentStepperProps = SmartNumberInputProps;
