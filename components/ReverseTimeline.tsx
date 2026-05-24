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
import { useBakerAlerts } from "@/hooks/useBakerAlerts";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

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
            לחם מוכן: {option.bakeLabel}
            {option.isExpress && (
              <span className="ms-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                מואץ
              </span>
            )}
          </p>
        </div>
        {selected && (
          <span className="rounded-full bg-crust px-3 py-1 text-xs font-bold text-dough">
            נבחר
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
      form.showToast("אין התראות — בחרו מועד ובנו לוח זמנים.");
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
        title="מתי תרצו שהלחם יהיה מוכן?"
        subtitle={`בחרו מועד — עבודה פעילה רק בין ${ACTIVE_HOUR_START}:00 ל־${ACTIVE_HOUR_END}:00 (בלי לילה).`}
      />

      {feasibleOptions.length === 0 && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          אין מועדים מתאימים עם הזמן שנשאר. השתמשו בזמן מותאם אישית למטה, או
          חשבו מתכון עם פחות שעות מקרר.
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
          <span>זמן יעד אחר (מותאם אישית)</span>
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
            סיום אפייה
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
            הצג/י תוכנית לזמן זה
          </Button>
        </div>
      </details>

      <p className="mb-2 text-xs text-stone-500">
        התכנון מבוסס על {form.starterPct}% מחמצת, {form.hoursToAutolyse} שעות עד
        אוטוליזה ו־{form.roomTemp}°C — עדכנו במזג האוויר או במדריך האפייה.
      </p>

      {bakerAlerts.length > 0 && (
        <SmartWarningBanner
          alerts={bakerAlerts.filter((a) => a.id.startsWith("schedule"))}
          className="mb-6"
        />
      )}

      {form.showTimeline && form.timelinePlan && (
        <div id="schedule-plan" className="mt-8 border-t border-stone-200 pt-8">
          <h3 className="mb-6 font-serif text-xl font-semibold text-stone-900">
            התוכנית המלאה שלכם
          </h3>

          <div className="mb-8 rounded-2xl border border-wheat/60 bg-gradient-to-br from-wheat-muted to-white p-5 sm:p-6">
            <p className="text-sm text-stone-600">מתחילים בהאכלת מחמצת</p>
            <p className="mt-1 font-serif text-xl font-semibold text-stone-900">
              {formatScheduleTime(form.timelinePlan.summary.starterFeed)}
            </p>
            <p className="mt-4 text-sm text-stone-600">סיום אפייה ביעד</p>
            <p className="mt-1 font-serif text-xl font-semibold text-crust">
              {formatScheduleTime(form.timelinePlan.summary.bakeEnd)}
            </p>
            <p className="mt-4 text-sm text-stone-500">
              סה״כ ~{form.timelinePlan.summary.totalHours} שעות · Bulk ~
              {form.timelinePlan.summary.bulkHours} שעות ·{" "}
              {form.timelinePlan.summary.starterPct}% מחמצת
            </p>
          </div>

          {isAndroidDevice() && (
            <div className="mb-6 rounded-2xl border border-wheat/60 bg-wheat-muted/80 p-4 text-sm leading-relaxed text-charcoal-muted">
              <p className="font-semibold text-crust">התראות באנדרואיד</p>
              <p className="mt-1">
                <strong>שעון</strong> — פותח את אפל שעון/שעון Google (אשרו ושמרו).
                אם לא נפתח: <strong>יומן</strong> → שיתוף ליומן או Google Calendar.
                מומלץ לפתוח באתר ב-<strong>Chrome</strong> (לא רק PWA) לשעון.
              </p>
            </div>
          )}

          {isIOSDevice() && !isAndroidDevice() && (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm leading-relaxed text-stone-700">
              <p className="font-semibold text-sky-950">התראות ב-iPhone</p>
              <p className="mt-1">
                לחצו «יומן» ובמסך השיתוף בחרו יומן (Calendar). אפשר גם Google.
              </p>
            </div>
          )}

          {allAlarms.length > 0 && (
            <div className="mb-6">
              <Button variant="secondary" fullWidth onClick={handleExportAllAlarms}>
                <CalendarDaysIcon className="h-5 w-5" aria-hidden />
                הוספת כל ההתראות ליומן ({allAlarms.length})
              </Button>
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
              Bulk
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
          בחרו מועד למעלה כדי לראות את כל השלבים והתראות
        </p>
      )}
    </Card>
  );
}
