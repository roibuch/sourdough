"use client";

import { useMemo } from "react";
import { ChartPieIcon } from "@heroicons/react/24/outline";
import { getFlourColor } from "@/lib/flourChartColors";
import { cn } from "@/lib/cn";
import type { FlourMix } from "@/lib/types";

interface FlourPieChartProps {
  mix: FlourMix;
  flourGrams?: number;
  className?: string;
  /** Narrow sidebar: stack chart + legend vertically, no horizontal row */
  stacked?: boolean;
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
  stacked = false,
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

  const chartSize = stacked
    ? "h-28 w-28 mx-auto"
    : "h-40 w-40 sm:h-44 sm:w-44";

  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated p-3",
        className,
      )}
      aria-label="תרשים תערובת קמחים"
    >
      <div className="mb-3 flex items-center gap-2">
        <ChartPieIcon className="h-4 w-4 text-accent" strokeWidth={1.75} aria-hidden />
        <h4 className="text-sm font-medium text-text-primary">תרשים תערובת</h4>
      </div>

      {!hasData ? (
        <p className="py-4 text-center text-xs text-text-muted">
          הזינו אחוזים לסוגי הקמח.
        </p>
      ) : (
        <div
          className={cn(
            "flex min-w-0 flex-col items-center gap-4",
            !stacked && "sm:flex-row sm:items-start sm:gap-6",
          )}
        >
          <div className={cn("relative shrink-0", chartSize)}>
            <div
              className="h-full w-full rounded-full shadow-inner"
              style={{ background: gradient }}
              role="img"
              aria-hidden
            />
            <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-background shadow-sm">
              <span
                className={cn(
                  "font-serif text-xl font-semibold leading-none tabular-nums",
                  isComplete ? "text-accent" : "text-text-secondary",
                )}
              >
                {Math.round(mix.totalPct)}%
              </span>
              <span className="mt-0.5 text-[10px] text-text-muted">
                {isComplete ? "מלא" : "סה״כ"}
              </span>
            </div>
          </div>

          <ul className="m-0 w-full min-w-0 list-none space-y-1.5 p-0">
            {slices.map((slice) => (
              <li
                key={slice.key}
                className="flex min-w-0 items-center gap-2 text-xs text-text-secondary"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{slice.label}</span>
                <span className="shrink-0 tabular-nums font-medium text-text-primary">
                  {slice.pct}%
                </span>
              </li>
            ))}
            {remainderPct > 0.05 && (
              <li className="flex items-center gap-2 text-xs text-text-muted">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-stone-200" aria-hidden />
                <span className="flex-1">לא משובץ</span>
                <span className="tabular-nums">{Math.round(remainderPct)}%</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {!isComplete && hasData && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center text-[11px] text-amber-900">
          סה״כ {mix.totalPct}% — צריך 100%
        </p>
      )}
    </div>
  );
}
