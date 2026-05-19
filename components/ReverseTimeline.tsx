"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BeakerIcon,
  CalendarDaysIcon,
  ClockIcon,
  FireIcon,
  HandRaisedIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { AlarmButtonGroup } from "@/components/AlarmButton";
import { ExpressModePanel } from "@/components/ExpressModePanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatScheduleTime } from "@/lib/timeline";
import {
  findScheduleOptionByTarget,
  generateScheduleOptions,
  type ScheduleOption,
} from "@/lib/scheduleOptions";
import {
  STEP_KIND_STYLES,
  getTimelineStepKind,
} from "@/lib/timelineVisual";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { TimelineStep } from "@/lib/types";
import { cn } from "@/lib/cn";

function StepIcon({ step }: { step: TimelineStep }) {
  const cls = "h-5 w-5";
  const stroke = 1.75;
  if (step.title.includes("מחמצת"))
    return <BeakerIcon className={cls} strokeWidth={stroke} />;
  if (step.title.includes("אוטוליזה"))
    return <ClockIcon className={cls} strokeWidth={stroke} />;
  if (step.title.includes("Bulk") || step.title.includes("מחמצת, מלח"))
    return <HandRaisedIcon className={cls} strokeWidth={stroke} />;
  if (step.title.includes("עיצוב"))
    return <HandRaisedIcon className={cls} strokeWidth={stroke} />;
  if (step.title.includes("מקרר"))
    return <ArchiveBoxIcon className={cls} strokeWidth={stroke} />;
  if (step.title.includes("אפייה"))
    return <FireIcon className={cls} strokeWidth={stroke} />;
  return <ClockIcon className={cls} strokeWidth={stroke} />;
}

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
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        !option.feasible &&
          "cursor-not-allowed border-stone-200 bg-stone-50 opacity-60",
        option.feasible &&
          !selected &&
          "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
        option.feasible &&
          selected &&
          "border-emerald-600 bg-emerald-50/80 shadow-md shadow-emerald-900/5",
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-lg font-semibold text-stone-900">
            {option.title}
          </p>
          <p className="mt-0.5 text-sm text-emerald-800">
            לחם מוכן: {option.bakeLabel}
            {option.isExpress && (
              <span className="ms-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                מואץ
              </span>
            )}
          </p>
        </div>
        {selected && (
          <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const options = useMemo(
    () => generateScheduleOptions(form.timelineInput),
    [form.timelineInput],
  );

  const feasibleOptions = options.filter((o) => o.feasible);

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

  const handleAlarmResult = (type: "android" | "ics" | "invalid") => {
    if (type === "android") form.showToast("פותח/ת את שעון האנדרואיד…");
    else if (type === "ics") form.showToast("הורד קובץ .ics — ייבא/י ליומן.");
    else if (type === "invalid")
      form.showToast("אין שעה מתוכננת — בחרו מועד מהרשימה.");
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
    <Card id="schedule-card" className="mb-8 sm:mb-10">
      <SectionHeader
        icon={<CalendarDaysIcon className="h-6 w-6" strokeWidth={1.75} />}
        title="מתי תרצו שהלחם יהיה מוכן?"
        subtitle="בחרו אחת מהאפשרויות — נראה מתי להתחיל, מתי עובדים ומתי אתם פנויים."
      />

      <ExpressModePanel form={form} />

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
            className="mb-3 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-center text-base text-stone-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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

      {form.showTimeline && form.timelinePlan && (
        <div id="schedule-plan" className="mt-8 border-t border-stone-200 pt-8">
          <h3 className="mb-6 font-serif text-xl font-semibold text-stone-900">
            התוכנית המלאה שלכם
          </h3>

          <div className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
            <p className="text-sm text-stone-600">מתחילים בהאכלת מחמצת</p>
            <p className="mt-1 font-serif text-xl font-semibold text-stone-900">
              {formatScheduleTime(form.timelinePlan.summary.starterFeed)}
            </p>
            <p className="mt-4 text-sm text-stone-600">סיום אפייה ביעד</p>
            <p className="mt-1 font-serif text-xl font-semibold text-emerald-900">
              {formatScheduleTime(form.timelinePlan.summary.bakeEnd)}
            </p>
            <p className="mt-4 text-sm text-stone-500">
              סה״כ ~{form.timelinePlan.summary.totalHours} שעות · Bulk ~
              {form.timelinePlan.summary.bulkHours} שעות ·{" "}
              {form.timelinePlan.summary.starterPct}% מחמצת
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-xs text-stone-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-400" />
              פעולה (קיפול / עבודה)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-stone-300" />
              המתנה (התפחה)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-600" />
              אפייה
            </span>
          </div>

          <ol
            className="relative m-0 list-none space-y-0 p-0 pr-2"
            aria-label="לוח זמנים כרונולוגי"
          >
            <span className="timeline-rail" aria-hidden />
            {form.timelinePlan.steps.map((step, index) => {
              const kind = getTimelineStepKind(step);
              const styles = STEP_KIND_STYLES[kind];
              const isAction = kind === "action";

              return (
                <li
                  key={`${step.title}-${step.start}`}
                  className={cn(
                    "relative pb-8 pr-14 last:pb-0 sm:pr-16",
                    index % 2 === 1 && "sm:pr-[4.5rem]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute right-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm",
                      styles.dot,
                    )}
                    aria-hidden
                  >
                    <StepIcon step={step} />
                  </span>

                  <article
                    className={cn(
                      "rounded-2xl border p-5 shadow-sm sm:p-6",
                      styles.card,
                    )}
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <h4 className="m-0 font-serif text-lg font-semibold text-stone-900">
                        {step.title}
                      </h4>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                          styles.badge,
                        )}
                      >
                        {isAction ? "פעולה" : kind === "wait" ? "המתנה" : "אפייה"} ·{" "}
                        {step.duration}
                      </span>
                    </div>

                    <p className="m-0 text-lg font-semibold text-stone-800">
                      {formatScheduleTime(step.start)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {step.meta}
                    </p>

                    {step.alarms && step.alarms.length > 0 && (
                      <div className="mt-4 border-t border-orange-200/60 pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-800">
                          התראות לשלב זה
                        </p>
                        <AlarmButtonGroup
                          alarms={step.alarms}
                          onResult={handleAlarmResult}
                        />
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
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
