"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDaysIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { AnimatedScheduleTimeline } from "@/components/motion/AnimatedScheduleTimeline";
import { DoughLifecycleBar } from "@/components/motion/DoughLifecycleBar";
import { alarmToastMessage } from "@/components/AlarmButton";
import { Button } from "@/components/ui/Button";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  exportAllAlarmsToCalendar,
  isAndroidDevice,
  isIOSDevice,
} from "@/lib/alarms";
import { formatScheduleTime } from "@/lib/timeline";
import {
  findScheduleOptionByTarget,
  generateScheduleOptions,
  type ScheduleOption,
} from "@/lib/scheduleOptions";
import { PresetScheduleCard } from "@/components/scheduling/PresetScheduleCard";
import { ScheduleAdjustmentsPanel } from "@/components/scheduling/ScheduleAdjustmentsPanel";
import { ScheduleSmartAlerts } from "@/components/scheduling/ScheduleSmartAlerts";
import { InteractiveDayTimeline } from "@/components/scheduling/InteractiveDayTimeline";
import { useBakerAlerts } from "@/hooks/useBakerAlerts";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent, t } from "@/lib/content";
import { SectionErrorBoundary } from "@/components/feedback/SectionErrorBoundary";
import { cn } from "@/lib/cn";

const sch = heContent.inputs.schedule;

const SECTION_PRESETS = "presets";
const SECTION_ADJUSTMENTS = "adjustments";
const SECTION_TIMELINE = "timeline";

export function ReverseTimeline({ form }: { form: RecipeForm }) {
  const bakerAlerts = useBakerAlerts(form);
  const scheduleAlerts = bakerAlerts.filter((a) => a.id.startsWith("schedule"));
  const schedulePanelRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([SECTION_PRESETS]);

  const options = useMemo(() => {
    try {
      return generateScheduleOptions(form.timelineInput);
    } catch (err) {
      console.error("generateScheduleOptions failed", err);
      return [];
    }
  }, [form.timelineInput]);

  const feasibleOptions = options.filter((o) => o.feasible);
  const infeasibleOptions = options.filter((o) => !o.feasible);

  const allAlarms = useMemo(() => {
    if (!form.timelinePlan) return [];
    const list: { ts: number; message: string; short: string }[] = [];
    for (const step of form.timelinePlan.steps) {
      if (step.alarms) list.push(...step.alarms);
    }
    return list;
  }, [form.timelinePlan]);

  const revealSchedule = useCallback(() => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(SECTION_TIMELINE);
      return [...next];
    });
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el =
          document.getElementById("schedule-timeline-panel") ??
          schedulePanelRef.current;
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    });
  }, []);

  useEffect(() => {
    if (!form.targetBakeTime) return;
    const match = findScheduleOptionByTarget(options, form.targetBakeTime);
    setSelectedId(match?.id ?? null);
  }, [options, form.targetBakeTime]);

  useEffect(() => {
    if (form.showTimeline && form.timelinePlan) {
      setOpenSections((prev) => {
        if (prev.includes(SECTION_TIMELINE)) return prev;
        const next = new Set(prev);
        next.add(SECTION_TIMELINE);
        return [...next];
      });
    }
  }, [form.showTimeline, form.timelinePlan]);

  const handleSelectOption = (option: ScheduleOption) => {
    if (!option.feasible) return;
    setSelectedId(option.id);
    form.selectScheduleOption(option);
    revealSchedule();
  };

  const handleAlarmResult = (type: Parameters<typeof alarmToastMessage>[0]) => {
    form.showToast(alarmToastMessage(type));
  };

  const handleExportAllAlarms = async () => {
    const result = await exportAllAlarmsToCalendar(
      allAlarms.map((a) => ({
        startMs: a.ts,
        summary: a.message,
        durationMin: 15,
      })),
    );
    if (result === "empty") {
      form.showToast(heContent.alarms.results.exportEmpty);
      return;
    }
    form.showToast(alarmToastMessage(result));
  };

  const handleCustomBuild = () => {
    const plan = form.rebuildTimeline(false);
    if (plan) {
      const match = findScheduleOptionByTarget(options, form.targetBakeTime);
      setSelectedId(match?.id ?? null);
      revealSchedule();
    }
  };

  const timelineSubtitle = form.timelinePlan
    ? `${formatScheduleTime(form.timelinePlan.summary.starterFeed)} → ${formatScheduleTime(form.timelinePlan.summary.bakeEnd)}`
    : sch.selectPrompt;

  const alertCount =
    scheduleAlerts.length +
    (form.adaptiveSchedule?.adaptations.length ?? 0) +
    (form.adaptiveSchedule && !form.adaptiveSchedule.feasible ? 1 : 0);

  return (
    <SectionErrorBoundary title="שגיאה בלוח האפייה">
    <div ref={schedulePanelRef}>
      <SectionHeader
        icon={<CalendarIcon className="h-6 w-6" strokeWidth={1.75} />}
        title={sch.title}
        subtitle={sch.subtitle}
      />

      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="mt-6"
      >
        <AccordionItem
          id={SECTION_PRESETS}
          title={sch.accordion.presets}
          subtitle={sch.accordion.presetsHint}
          icon={<ClockIcon className="h-5 w-5" strokeWidth={1.75} />}
        >
          {feasibleOptions.length === 0 && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {sch.noOptions}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2" role="list">
            {feasibleOptions.map((option) => (
              <PresetScheduleCard
                key={option.id}
                option={option}
                selected={selectedId === option.id}
                onSelect={() => handleSelectOption(option)}
              />
            ))}
          </div>

          {infeasibleOptions.length > 0 && (
            <details className="mt-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-stone-600">
                מועדים לא זמינים ({infeasibleOptions.length})
              </summary>
              <div className="grid gap-3 border-t border-stone-200 p-3 sm:grid-cols-2">
                {infeasibleOptions.map((option) => (
                  <PresetScheduleCard
                    key={option.id}
                    option={option}
                    selected={selectedId === option.id}
                    onSelect={() => handleSelectOption(option)}
                  />
                ))}
              </div>
            </details>
          )}

          <details
            className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/60"
            open={showCustom}
            onToggle={(e) =>
              setShowCustom((e.target as HTMLDetailsElement).open)
            }
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-stone-800 [&::-webkit-details-marker]:hidden">
              <span>{sch.customTime}</span>
              <ChevronDownIcon
                className={cn(
                  "h-5 w-5 shrink-0 text-stone-500 transition",
                  showCustom && "rotate-180",
                )}
              />
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-3">
              <label
                htmlFor="targetBakeTime"
                className="mb-2 block text-sm text-stone-600"
              >
                {sch.customBakeLabel}
              </label>
              <input
                id="targetBakeTime"
                type="datetime-local"
                step={300}
                className="mb-3 w-full rounded-2xl border-2 border-warm-border bg-white px-4 py-3 text-center text-base text-charcoal focus:border-crust focus:outline-none focus:ring-2 focus:ring-wheat/40"
                value={form.targetBakeTime}
                onChange={(e) => {
                  form.setTargetBakeTime(e.target.value);
                  setSelectedId(null);
                }}
              />
              <Button variant="secondary" fullWidth onClick={handleCustomBuild}>
                {sch.showPlan}
              </Button>
            </div>
          </details>
        </AccordionItem>

        <AccordionItem
          id={SECTION_ADJUSTMENTS}
          title={sch.accordion.adjustments}
          subtitle={sch.accordion.adjustmentsHint}
          icon={<Cog6ToothIcon className="h-5 w-5" strokeWidth={1.75} />}
        >
          <ScheduleAdjustmentsPanel form={form} />
        </AccordionItem>

        <AccordionItem
          id={SECTION_TIMELINE}
          title={sch.accordion.timeline}
          subtitle={timelineSubtitle}
          icon={<CalendarDaysIcon className="h-5 w-5" strokeWidth={1.75} />}
          badge={
            alertCount > 0 ? (
              <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                {alertCount}
              </span>
            ) : undefined
          }
          contentClassName="!px-3 sm:!px-4"
        >
          <div id="schedule-timeline-panel">
            {!form.showTimeline || !form.timelinePlan ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-600">
                {sch.selectPrompt}
              </p>
            ) : (
              <div className="space-y-6">
                <ScheduleSmartAlerts
                  alerts={scheduleAlerts}
                  adaptations={form.adaptiveSchedule?.adaptations}
                  adaptationsFeasible={form.adaptiveSchedule?.feasible}
                />

                <div className="rounded-2xl border border-wheat/60 bg-gradient-to-br from-wheat-muted/90 to-white p-4 sm:p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {sch.accordion.summary}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-stone-600">{sch.startFeed}</p>
                      <p className="mt-0.5 font-serif text-xl font-semibold tabular-nums text-stone-900">
                        {formatScheduleTime(form.timelinePlan.summary.starterFeed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-600">{sch.bakeTarget}</p>
                      <p className="mt-0.5 font-serif text-xl font-semibold tabular-nums text-crust">
                        {formatScheduleTime(form.timelinePlan.summary.bakeEnd)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    סה״כ ~{form.timelinePlan.summary.totalHours} שעות · התפחה
                    ראשונית ~{form.timelinePlan.summary.bulkHours} שעות ·{" "}
                    {form.timelinePlan.summary.starterPct}% מחמצת
                  </p>
                </div>

                {form.adaptiveSchedule && (
                  <details className="rounded-2xl border border-stone-200 bg-white/80">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-stone-800 [&::-webkit-details-marker]:hidden">
                      {sch.accordion.interactiveDay}
                    </summary>
                    <div className="border-t border-stone-100 p-3 sm:p-4">
                      <InteractiveDayTimeline
                        schedule={form.adaptiveSchedule}
                        blackouts={form.blackouts}
                        engineInput={form.schedulingEngineInput}
                        onScheduleChange={form.applyAdaptiveSchedule}
                      />
                    </div>
                  </details>
                )}

                <DoughLifecycleBar plan={form.timelinePlan} />

                <div className="flex flex-wrap gap-3 text-xs text-stone-600">
                  <LegendDot className="bg-amber-400" label="מחמצת" />
                  <LegendDot className="bg-sky-400" label="אוטוליזה" />
                  <LegendDot className="bg-orange-400" label="התפחה ראשונית" />
                  <LegendDot className="bg-stone-400" label="מקרר" />
                  <LegendDot className="bg-crust" label="אפייה" />
                </div>

                <AnimatedScheduleTimeline
                  plan={form.timelinePlan}
                  planKey={`${form.timelinePlan.summary.bakeEnd}-${form.timelinePlan.summary.starterFeed}-${form.timelinePlan.summary.bulkHours}`}
                  onAlarmResult={handleAlarmResult}
                />

                {(isAndroidDevice() || isIOSDevice()) && (
                  <details className="rounded-xl border border-stone-200 bg-stone-50/80 text-sm">
                    <summary className="cursor-pointer px-4 py-2.5 font-medium text-stone-700">
                      עזרה להגדרת מעוררים
                    </summary>
                    <div className="border-t border-stone-200 px-4 py-3 leading-relaxed text-stone-600">
                      {isAndroidDevice() ? (
                        <>
                          <p className="font-semibold text-crust">
                            {heContent.alarms.deviceHelp.androidTitle}
                          </p>
                          <p className="mt-1">
                            {heContent.alarms.deviceHelp.androidBody}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-sky-950">
                            {heContent.alarms.deviceHelp.iosTitle}
                          </p>
                          <p className="mt-1">
                            {heContent.alarms.deviceHelp.iosBody}
                          </p>
                        </>
                      )}
                    </div>
                  </details>
                )}

                {allAlarms.length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
                    <p className="mb-2 text-xs text-stone-600">
                      {heContent.alarms.results.exportClockHint}
                    </p>
                    <Button
                      variant="secondary"
                      fullWidth
                      className="min-h-[2.5rem] py-2 text-sm"
                      onClick={handleExportAllAlarms}
                    >
                      <CalendarDaysIcon className="h-4 w-4" aria-hidden />
                      {heContent.alarms.buttons.exportAllCalendar} (
                      {allAlarms.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
    </SectionErrorBoundary>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} aria-hidden />
      {label}
    </span>
  );
}
