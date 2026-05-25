"use client";

import { useMemo } from "react";
import {
  BeakerIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { AlarmButtonGroup } from "@/components/AlarmButton";
import type { AlarmResult } from "@/lib/alarms";
import { StepStageIcon } from "@/components/icons/BakingStageIcons";
import type { FermentationPace } from "@/lib/expressMode";
import { heContent } from "@/lib/content";
import {
  buildForwardTimelineFromNow,
  formatScheduleTime,
} from "@/lib/timeline";
import {
  STEP_KIND_STYLES,
  getTimelineStepKind,
} from "@/lib/timelineVisual";
import type { TimelineStep } from "@/lib/types";
import { cn } from "@/lib/cn";

const copy = heContent.bakingTimeline;
const MS_H = 3_600_000;

/** Dough + schedule parameters for forward timeline projection */
export interface BakingTimelineDoughParams {
  starterPct: number;
  waterPct: number;
  flourPcts: number[];
  roomTempC?: number;
  hoursToAutolyse?: number;
  coldRetardHours?: number;
  autolyseHours?: number;
  bulkHours?: number;
  fermentationPace?: FermentationPace;
}

export interface BakingTimelineProps {
  /** Anchor time — defaults to now */
  currentTime?: Date | number;
  dough: BakingTimelineDoughParams;
  /** Show compact float-test callout before bulk / mix step */
  showFloatTestReminder?: boolean;
  className?: string;
  onAlarmResult?: (result: AlarmResult) => void;
}

function resolveStartMs(currentTime?: Date | number): number {
  if (currentTime == null) return Date.now();
  return currentTime instanceof Date ? currentTime.getTime() : currentTime;
}

function stepEndMs(steps: TimelineStep[], index: number): number {
  const next = steps[index + 1];
  if (next) return next.start;
  return steps[index].start + MS_H;
}

function isBulkStep(title: string): boolean {
  return title.includes("התפחה ראשונית") || title.includes("חיוב");
}

function formatTimeRange(start: number, end: number): string {
  const sameDay =
    new Date(start).toDateString() === new Date(end).toDateString();
  if (sameDay) {
    const startFmt = new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(start));
    const endFmt = new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(end));
    return `${startFmt} – ${endFmt}`;
  }
  return `${formatScheduleTime(start)} – ${formatScheduleTime(end)}`;
}

export function BakingTimeline({
  currentTime,
  dough,
  showFloatTestReminder = true,
  className,
  onAlarmResult,
}: BakingTimelineProps) {
  const startMs = resolveStartMs(currentTime);
  const nowMs = Date.now();

  const plan = useMemo(
    () =>
      buildForwardTimelineFromNow({
        targetBakeTime: "",
        coldRetardHours: dough.coldRetardHours ?? 12,
        starterPct: dough.starterPct,
        waterPct: dough.waterPct,
        roomTemp: dough.roomTempC ?? 22,
        hoursToAutolyse: dough.hoursToAutolyse ?? 8,
        flourPcts: dough.flourPcts,
        autolyseHours: dough.autolyseHours,
        bulkHours: dough.bulkHours,
        fermentationPace: dough.fermentationPace,
        startMs,
      }),
    [dough, startMs],
  );

  const activeIndex = useMemo(() => {
    for (let i = plan.steps.length - 1; i >= 0; i--) {
      if (nowMs >= plan.steps[i].start) return i;
    }
    return -1;
  }, [plan.steps, nowMs]);

  return (
    <section
      className={cn(
        "glass-panel min-w-0 overflow-x-clip p-4 sm:p-5",
        className,
      )}
      aria-label={copy.title}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h2 className="font-serif text-lg font-normal text-text-primary sm:text-xl">
            {copy.title}
          </h2>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">{copy.subtitle}</p>
        </div>
        <div className="border border-accent-gold/30 bg-accent-gold-muted/30 px-3 py-2 text-end">
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
            {copy.bakeReady}
          </p>
          <p className="font-serif text-sm font-normal text-accent-gold tabular-nums">
            {formatScheduleTime(plan.summary.bakeEnd)}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {copy.totalDuration} ~{plan.summary.totalHours} שע׳
          </p>
        </div>
      </header>

      <ol className="relative m-0 list-none space-y-0 overflow-x-clip p-0 pr-1 sm:pr-2">
        <span className="timeline-rail" aria-hidden />

        {plan.steps.map((step, index) => {
          const end = stepEndMs(plan.steps, index);
          const kind = getTimelineStepKind(step);
          const styles = STEP_KIND_STYLES[kind];
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          const showFloat =
            showFloatTestReminder &&
            isBulkStep(step.title) &&
            plan.steps[index - 1]?.title.includes("אוטוליזה");

          return (
            <li key={`${step.title}-${step.start}`} className="list-none">
              {showFloat && (
                <div className="relative pb-4 pr-11 sm:pb-5 sm:pr-14">
                  <span
                    className="absolute right-0 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent-gold/60 bg-accent-gold-muted text-accent-gold sm:h-10 sm:w-10"
                    aria-hidden
                  >
                    <BeakerIcon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p
                    role="note"
                    className="rounded-sm border border-dashed border-accent-gold/50 bg-accent-gold-muted/40 px-3 py-2.5 text-xs leading-relaxed text-text-secondary"
                  >
                    <strong className="font-semibold">{copy.floatTestTitle}</strong>
                    {" — "}
                    {copy.floatTestBody}
                  </p>
                </div>
              )}

              <div
                className={cn(
                  "relative pb-6 pr-11 last:pb-0 sm:pb-8 sm:pr-14",
                  isActive && "z-[1]",
                )}
              >
                <span
                  className={cn(
                    "absolute right-0 top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm transition sm:h-10 sm:w-10",
                    styles.dot,
                    isActive && "ring-2 ring-crust/40 ring-offset-2",
                    isPast && "opacity-70",
                  )}
                  aria-hidden
                >
                  <StepStageIcon title={step.title} />
                </span>

                <article
                  className={cn(
                    "rounded-sm border p-4 transition sm:p-5",
                    styles.card,
                    isActive && "shadow-md ring-1 ring-accent-gold/30",
                    isPast && "opacity-85",
                  )}
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <h3 className="m-0 font-serif text-base font-normal text-text-primary sm:text-lg">
                      {step.icon} {step.title}
                    </h3>
                    {isActive && (
                      <span className="rounded-sm bg-accent-gold px-2.5 py-0.5 text-[10px] font-medium text-background">
                        {copy.currentStep}
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary sm:text-sm">
                    <ClockIcon
                      className="h-4 w-4 shrink-0 text-text-muted"
                      aria-hidden
                    />
                    <time dateTime={new Date(step.start).toISOString()}>
                      {formatTimeRange(step.start, end)}
                    </time>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                        styles.badge,
                      )}
                    >
                      {step.duration}
                    </span>
                  </div>

                  <p className="m-0 text-xs leading-relaxed text-text-muted sm:text-sm">
                    {step.meta}
                  </p>

                  {step.alarms && step.alarms.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                      <p className="text-xs font-medium text-text-secondary">
                        {copy.foldLabel}
                      </p>
                      <AlarmButtonGroup
                        alarms={step.alarms}
                        onResult={onAlarmResult}
                        compact
                        stacked
                      />
                    </div>
                  )}

                  {index === 0 && plan.workflow && (
                    <p className="mt-3 border-t border-border-subtle pt-2 text-[11px] text-text-muted">
                      {plan.workflow.foldCount} קיפולים כל{" "}
                      {plan.workflow.foldEvery} · {plan.workflow.foldStyle}
                    </p>
                  )}
                </article>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
