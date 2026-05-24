"use client";

import {
  BeakerIcon,
  BoltIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import type { ScheduleOption } from "@/lib/scheduleOptions";
import { heContent, t } from "@/lib/content";
import { cn } from "@/lib/cn";

const sch = heContent.inputs.schedule;

interface PresetScheduleCardProps {
  option: ScheduleOption;
  selected: boolean;
  onSelect: () => void;
}

export function PresetScheduleCard({
  option,
  selected,
  onSelect,
}: PresetScheduleCardProps) {
  const starter = option.highlights[0];
  const finish = option.highlights[4] ?? option.highlights.at(-1);
  const expanded = selected && option.feasible;

  return (
    <button
      type="button"
      disabled={!option.feasible}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-right transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wheat focus-visible:ring-offset-2",
        !option.feasible &&
          "cursor-not-allowed border-warm-border/80 bg-stone-50/80 opacity-65",
        option.feasible && !selected && "brand-choice-idle hover:border-wheat/80",
        option.feasible && selected && "brand-choice-active shadow-md",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base font-semibold leading-snug text-stone-900 sm:text-lg">
            {option.title}
          </p>
          {option.isExpress && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-950">
              <BoltIcon className="h-3.5 w-3.5" aria-hidden />
              {sch.express}
            </span>
          )}
        </div>
        {selected && option.feasible && (
          <span className="shrink-0 rounded-full bg-crust px-2.5 py-1 text-xs font-bold text-dough">
            {sch.selected}
          </span>
        )}
      </div>

      {option.feasible && starter && finish ? (
        <div
          className={cn(
            "grid gap-2 sm:grid-cols-2",
            expanded && "rounded-xl bg-white/60 p-3 ring-1 ring-wheat/30",
          )}
        >
          <TimeHighlight
            icon={BeakerIcon}
            label={starter.label}
            time={starter.detail}
            tone="starter"
          />
          <TimeHighlight
            icon={FireIcon}
            label={finish.label}
            time={finish.detail}
            tone="bake"
          />
        </div>
      ) : (
        <p className="text-sm text-amber-900">{option.infeasibleReason}</p>
      )}

      {expanded && option.feasible && (
        <p className="mt-3 border-t border-wheat/40 pt-3 text-xs text-stone-500">
          {t(sch.totalHours, { hours: option.plan.summary.totalHours })}
        </p>
      )}
    </button>
  );
}

function TimeHighlight({
  icon: Icon,
  label,
  time,
  tone,
}: {
  icon: typeof BeakerIcon;
  label: string;
  time: string;
  tone: "starter" | "bake";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        tone === "starter"
          ? "border-amber-200/80 bg-amber-50/90"
          : "border-crust/25 bg-wheat-muted/80",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          tone === "starter" ? "bg-amber-200/80 text-amber-900" : "bg-crust/15 text-crust",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-600">{label}</p>
        <p
          className={cn(
            "truncate font-semibold tabular-nums",
            tone === "bake" ? "text-crust" : "text-stone-900",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
