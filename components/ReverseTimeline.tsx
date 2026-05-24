"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDaysIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { AnimatedScheduleTimeline } from "@/components/motion/AnimatedScheduleTimeline";
import { DoughLifecycleBar } from "@/components/motion/DoughLifecycleBar";
import { AlarmButtonGroup, alarmToastMessage } from "@/components/AlarmButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  exportAllAlarmsToCalendar,
  isAndroidDevice,
  isIOSDevice,
} from "@/lib/alarms";
import { ACTIVE_HOUR_END, ACTIVE_HOUR_START } from "@/lib/scheduleFriendly";
import { formatScheduleTime } from "@/lib/timeline";
import {
  findScheduleOptionByTarget,
  generateScheduleOptions,
  type ScheduleOption,
} from "@/lib/scheduleOptions";
import { SmartWarningBanner } from "@/components/feedback/SmartWarningBanner";
import { BlackoutPeriodsEditor } from "@/components/scheduling/BlackoutPeriodsEditor";
import { InteractiveDayTimeline } from "@/components/scheduling/InteractiveDayTimeline";
import { ScheduleAdaptationsBanner } from "@/components/scheduling/ScheduleAdaptationsBanner";
import { useBakerAlerts } from "@/hooks/useBakerAlerts";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent, t } from "@/lib/content";
import { cn } from "@/lib/cn";

const sch = heContent.inputs.schedule;

function ScheduleOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: ScheduleOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const startHighlight = option.highlights[0];
  const activeHighlight = option.highlights[2];
  const freeHighlight = option.highlights[3];

  return (
    <button
      type="button"
      disabled={!option.feasible}
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border-2 p-4 text-right transition sm:p-5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wheat focus-visible:ring-offset-2",
        !option.feasible &&
          "cursor-not-allowed border-warm-border bg-dough opacity-60",
        option.feasible && !selected && "brand-choice-idle",
        option.feasible && selected && "brand-choice-active",
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-lg font-semibold text-stone-900">
            {option.title}
          </p>
          <p className="mt-0.5 text-sm text-crust">
            {t(sch.readyAt, { time: option.bakeLabel })}
            {option.isExpress && (
              <span className="ms-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                {sch.express}
              </span>
            )}
          </p>
        </div>
        {selected && (
            <span className="rounded-full bg-crust px-3 py-1 text-xs font-bold text-dough">
            {sch.selected}
          </span>
        )}
      </div>

      {option.feasible ? (
        <ul className="space-y-2 text-sm text-stone-700">
          <li className="flex gap-2">
            <span aria-hidden>{startHighlight.icon}</span>
            <span>
              <strong className="text-stone-900">{startHighlight.label}</strong>
              <br />
              <span className="text-stone-600">{startHighlight.detail}</span>
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>{activeHighlight.icon}</span>
            <span>
              <strong className="text-stone-900">{activeHighlight.label}</strong>
              <br />
              <span className="text-stone-600">{activeHighlight.detail}</span>
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden>{freeHighlight.icon}</span>
            <span>
              <strong className="text-stone-900">{freeHighlight.label}</strong>
              <br />
              <span className="text-stone-600">{freeHighlight.detail}</span>
            </span>
          </li>
          <li className="mt-2 text-xs text-stone-500">
            סה״כ ~{option.plan.summary.totalHours} שעות מההאכלה ועד האפייה
          </li>
        </ul>
      ) : (
        <p className="text-sm text-amber-900">{option.infeasibleReason}</p>
      )}
    </button>
  );
}

export function ReverseTimeline({ form }: { form: RecipeForm }) {
  const bakerAlerts = useBakerAlerts(form);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const options = useMemo(
    () => generateScheduleOptions(form.timelineInput),
    [form.timelineInput],
  );

  const feasibleOptions = options.filter((o) => o.feasible);

  const allAlarms = useMemo(() => {
    if (!form.timelinePlan) return [];
    const list: { ts: number; message: string; short: string }[] = [];
    for (const step of form.timelinePlan.steps) {
      if (step.alarms) list.push(...step.alarms);
    }
    return list;
  }, [form.timelinePlan]);

  useEffect(() => {
    if (!form.targetBakeTime) return;
    const match = findScheduleOptionByTarget(options, form.targetBakeTime);
    setSelectedId(match?.id ?? null);
  }, [options, form.targetBakeTime]);

  const handleSelectOption = (option: ScheduleOption) => {
    if (!option.feasible) return;
    setSelectedId(option.id);
    form.selectScheduleOption(option);
    setTimeout(() => {
      document.getElementById("schedule-plan")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
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
      setTimeout(() => {
        document.getElementById("schedule-plan")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  };

  return (
    <Card nested className="border-0 bg-transparent p-0 shadow-none">
      <SectionHeader
        icon={<CalendarDaysIcon className="h-6 w-6" strokeWidth={1.75} />}
        title={sch.title}
        subtitle={sch.subtitle}
      />

      {feasibleOptions.length === 0 && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {sch.noOptions}
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2" role="list">
        {options.map((option) => (
          <ScheduleOptionCard
            key={option.id}
            option={option}
            selected={selectedId === option.id}
            onSelect={() => handleSelectOption(option)}
          />
        ))}
      </div>

      <details
        className="mb-6 rounded-2xl border border-stone-200 bg-stone-50/60"
        open={showCustom}
        onToggle={(e) => setShowCustom((e.target as HTMLDetailsElement).open)}
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

      <p className="mb-2 text-xs text-stone-500">
        {t(sch.planFooter, {
          starter: form.starterPct,
          autolyse: form.hoursToAutolyse,
          temp: form.roomTemp,
        })}
      </p>

      <BlackoutPeriodsEditor
        className="mb-6"
        blackouts={form.blackouts}
        onChange={(next) => {
          form.setBlackouts(next);
          if (form.showTimeline && form.targetBakeTime) {
            form.rebuildTimeline(true);
          }
        }}
      />

      {bakerAlerts.length > 0 && (
        <SmartWarningBanner
          alerts={bakerAlerts.filter((a) => a.id.startsWith("schedule"))}
          className="mb-6"
        />
      )}

      {form.showTimeline && form.timelinePlan && (
        <div id="schedule-plan" className="mt-8 border-t border-stone-200 pt-8">
          <h3 className="mb-6 font-serif text-xl font-semibold text-stone-900">
            {sch.fullPlan}
          </h3>

          {form.adaptiveSchedule && (
            <>
              <ScheduleAdaptationsBanner
                className="mb-6"
                adaptations={form.adaptiveSchedule.adaptations}
                feasible={form.adaptiveSchedule.feasible}
              />
              <InteractiveDayTimeline
                className="mb-8"
                schedule={form.adaptiveSchedule}
                blackouts={form.blackouts}
                engineInput={form.schedulingEngineInput}
                onScheduleChange={form.applyAdaptiveSchedule}
              />
            </>
          )}

          <div className="mb-8 rounded-2xl border border-wheat/60 bg-gradient-to-br from-wheat-muted to-white p-5 sm:p-6">
            <p className="text-sm text-stone-600">{sch.startFeed}</p>
            <p className="mt-1 font-serif text-xl font-semibold text-stone-900">
              {formatScheduleTime(form.timelinePlan.summary.starterFeed)}
            </p>
            <p className="mt-4 text-sm text-stone-600">{sch.bakeTarget}</p>
            <p className="mt-1 font-serif text-xl font-semibold text-crust">
              {formatScheduleTime(form.timelinePlan.summary.bakeEnd)}
            </p>
            <p className="mt-4 text-sm text-stone-500">
              סה״כ ~{form.timelinePlan.summary.totalHours} שעות · התפחה ראשונית ~
              {form.timelinePlan.summary.bulkHours} שעות ·{" "}
              {form.timelinePlan.summary.starterPct}% מחמצת
            </p>
          </div>

          {isAndroidDevice() && (
            <div className="mb-6 rounded-2xl border border-wheat/60 bg-wheat-muted/80 p-4 text-sm leading-relaxed text-charcoal-muted">
              <p className="font-semibold text-crust">
                {heContent.alarms.deviceHelp.androidTitle}
              </p>
              <p className="mt-1">{heContent.alarms.deviceHelp.androidBody}</p>
            </div>
          )}

          {isIOSDevice() && !isAndroidDevice() && (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm leading-relaxed text-stone-700">
              <p className="font-semibold text-sky-950">
                {heContent.alarms.deviceHelp.iosTitle}
              </p>
              <p className="mt-1">{heContent.alarms.deviceHelp.iosBody}</p>
            </div>
          )}

          {allAlarms.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-sm text-stone-600">
                {heContent.alarms.results.exportClockHint}
              </p>
              <details className="rounded-2xl border border-stone-200 bg-stone-50/60">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-stone-700 [&::-webkit-details-marker]:hidden">
                  {heContent.alarms.buttons.exportAllCalendar} ({allAlarms.length})
                </summary>
                <div className="border-t border-stone-200 px-4 pb-4 pt-2">
                  <Button variant="secondary" fullWidth onClick={handleExportAllAlarms}>
                    <CalendarDaysIcon className="h-5 w-5" aria-hidden />
                    {heContent.alarms.buttons.exportAllCalendar}
                  </Button>
                </div>
              </details>
            </div>
          )}

          <DoughLifecycleBar plan={form.timelinePlan} />

          <div className="mb-4 flex flex-wrap gap-4 text-xs text-stone-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              מחמצת
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              אוטוליזה
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-400" />
              התפחה ראשונית
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-stone-400" />
              מקרר
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-crust" />
              אפייה
            </span>
          </div>

          <AnimatedScheduleTimeline
            plan={form.timelinePlan}
            planKey={`${form.timelinePlan.summary.bakeEnd}-${form.timelinePlan.summary.starterFeed}-${form.timelinePlan.summary.bulkHours}`}
            onAlarmResult={handleAlarmResult}
          />
        </div>
      )}

      {!form.showTimeline && feasibleOptions.length > 0 && (
        <p className="mt-4 text-center text-sm text-stone-500">
          {sch.selectPrompt}
        </p>
      )}
    </Card>
  );
}
