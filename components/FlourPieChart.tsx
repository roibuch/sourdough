"use client";

import { useMemo } from "react";
import { ChartPieIcon } from "@heroicons/react/24/outline";
import { getFlourColor } from "@/lib/flourChartColors";
import { cn } from "@/lib/cn";
import type { FlourMix } from "@/lib/types";

interface FlourPieChartProps {
  mix: FlourMix;
  /** Total flour grams — shows gram amounts in legend when set */
  flourGrams?: number;
  className?: string;
  compact?: boolean;
}

interface Slice {
  key: string;
  label: string;
  pct: number;
  color: string;
  grams?: number;
}

function buildConicGradient(slices: Slice[], remainderPct: number): string {
  if (!slices.length && remainderPct >= 100) {
    return "conic-gradient(from -90deg, #e7e5e4 0% 100%)";
  }

  const parts: string[] = [];
  let cursor = 0;

  for (const slice of slices) {
    const end = cursor + slice.pct;
    parts.push(`${slice.color} ${cursor}% ${end}%`);
    cursor = end;
  }

  if (remainderPct > 0.05) {
    parts.push(`#e7e5e4 ${cursor}% ${cursor + remainderPct}%`);
  }

  return `conic-gradient(from -90deg, ${parts.join(", ")})`;
}

export function FlourPieChart({
  mix,
  flourGrams,
  className,
  compact,
}: FlourPieChartProps) {
  const { slices, remainderPct, isComplete } = useMemo(() => {
    const active: Slice[] = mix.items
      .filter((item) => item.pct > 0)
      .map((item) => ({
        key: item.key,
        label: item.label,
        pct: item.pct,
        color: getFlourColor(item.key),
        grams:
          flourGrams != null
            ? Math.round((flourGrams * item.pct) / 100)
            : undefined,
      }));

    const used = active.reduce((s, i) => s + i.pct, 0);
    const remainder = Math.max(0, 100 - used);

    return {
      slices: active,
      remainderPct: remainder,
      isComplete: Math.abs(mix.totalPct - 100) < 0.15,
    };
  }, [mix, flourGrams]);

  const gradient = buildConicGradient(slices, remainderPct);
  const hasData = slices.length > 0;

  const chartSize = compact ? "h-36 w-36 sm:h-40 sm:w-40" : "h-44 w-44 sm:h-52 sm:w-52";
  const holeInset = compact ? "inset-[20%]" : "inset-[18%]";

  return (
    <div
      className={cn(
        "rounded-sm border border-border-subtle bg-surface p-4 sm:p-5",
        className,
      )}
      aria-label="תרשים תערובת קמחים"
    >
      <div className="mb-4 flex items-center gap-2">
        <ChartPieIcon
          className="h-5 w-5 text-accent-gold"
          strokeWidth={1.75}
          aria-hidden
        />
        <h4 className="font-serif text-base font-normal text-text-primary sm:text-lg">
          תרשים תערובת
        </h4>
      </div>

      {!hasData ? (
        <p className="py-6 text-center text-sm text-text-muted">
          הזינו אחוזים לסוגי הקמח כדי לראות את התרשים.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative shrink-0">
            <div
              className={cn("rounded-full shadow-inner", chartSize)}
              style={{ background: gradient }}
              role="img"
              aria-hidden
            />
            <div
              className={cn(
                "absolute flex flex-col items-center justify-center rounded-full bg-background shadow-sm",
                holeInset,
              )}
            >
              <span
                className={cn(
                  "font-serif font-semibold leading-none",
                  isComplete ? "text-accent-gold" : "text-text-secondary",
                  compact ? "text-xl" : "text-2xl sm:text-3xl",
                )}
              >
                {Math.round(mix.totalPct)}%
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs">
                {isComplete ? "מלא" : "סה״כ"}
              </span>
            </div>
          </div>

          <ul className="m-0 w-full min-w-0 flex-1 list-none space-y-2 p-0">
            {slices.map((slice) => (
              <li
                key={slice.key}
                className="flex items-center gap-2.5 text-sm text-text-secondary"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-1 ring-stone-300/60"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{slice.label}</span>
                <span className="shrink-0 font-medium tabular-nums text-text-primary">
                  {slice.pct}%
                  {slice.grams != null && (
                    <span className="ms-1 font-normal text-text-muted">
                      · {slice.grams} ג׳
                    </span>
                  )}
                </span>
              </li>
            ))}
            {remainderPct > 0.05 && (
              <li className="flex items-center gap-2.5 text-sm text-text-muted">
                <span
                  className="h-3 w-3 shrink-0 rounded-full bg-stone-200 ring-1 ring-stone-300/60"
                  aria-hidden
                />
                <span className="flex-1">לא משובץ</span>
                <span className="shrink-0 tabular-nums">
                  {Math.round(remainderPct)}%
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {!isComplete && hasData && (
        <p className="mt-4 border border-accent-gold/30 bg-accent-gold-muted/30 px-3 py-2 text-center text-xs text-text-secondary">
          האחוזים צריכים להסתכם ל־100% — כרגע {mix.totalPct}%.
        </p>
      )}
    </div>
  );
}
