"use client";

import { useState } from "react";
import { CalendarIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { RangeSlider } from "@/components/ui/RangeSlider";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { formatScheduleTime } from "@/lib/timeline";
import { heContent } from "@/lib/content";
import { cn } from "@/lib/cn";

const copy = heContent.optionalSchedule;

export function OptionalSchedulePanel({ form }: { form: RecipeForm }) {
  const [open, setOpen] = useState(false);
  const {
    targetBakeTime,
    setTargetBakeTime,
    coldRetardHours,
    setColdRetardHours,
    hoursToAutolyse,
    setHoursToAutolyse,
    timelinePlan,
    buildSimpleTimeline,
    showToast,
  } = form;

  const handleBuild = () => {
    const plan = buildSimpleTimeline();
    if (plan) setOpen(true);
    else if (!targetBakeTime.trim()) {
      showToast(copy.needBakeTime);
    }
  };

  return (
    <section className="glass-panel min-w-0 overflow-x-clip">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 border-b border-stone-200/70 px-4 py-3.5 text-start sm:px-6"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wheat-muted text-crust">
          <CalendarIcon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-charcoal sm:text-base">
            {copy.title}
          </span>
          <span className="mt-0.5 block text-xs text-stone-500">
            {copy.subtitle}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 shrink-0 text-stone-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 p-4 sm:p-6">
          <label className="block text-sm font-semibold text-charcoal">
            {copy.bakeEnd}
            <input
              type="datetime-local"
              className="glass-input mt-2 w-full"
              value={targetBakeTime}
              onChange={(e) => setTargetBakeTime(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SmartNumberInput
              id="opt-cold-retard"
              label={copy.coldRetard}
              suffix="שעות"
              value={coldRetardHours}
              min={4}
              max={24}
              step={1}
              onChange={setColdRetardHours}
              minusLabel="הפחת"
              plusLabel="הוסף"
              compact
            />
            <RangeSlider
              id="opt-hta"
              label={copy.hoursToAutolyse}
              value={hoursToAutolyse}
              min={2}
              max={12}
              step={0.5}
              unit=" ש׳"
              formatValue={(v) => `${v} שע׳`}
              onChange={setHoursToAutolyse}
            />
          </div>

          <Button variant="secondary" fullWidth onClick={handleBuild}>
            {copy.build}
          </Button>

          {timelinePlan && (
            <ol className="m-0 list-none space-y-2 rounded-xl border border-warm-border/80 bg-dough/50 p-3 text-sm">
              {timelinePlan.steps.map((step) => (
                <li
                  key={`${step.title}-${step.start}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-200/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-medium text-charcoal">{step.title}</span>
                  <span className="tabular-nums text-stone-600">
                    {formatScheduleTime(step.start)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
