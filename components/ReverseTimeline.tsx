"use client";

import {
  BeakerIcon,
  CalendarDaysIcon,
  ClockIcon,
  FireIcon,
  HandRaisedIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { AlarmButtonGroup } from "@/components/AlarmButton";
import { PercentStepper } from "@/components/PercentStepper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatScheduleTime } from "@/lib/timeline";
import {
  STEP_KIND_STYLES,
  getTimelineStepKind,
} from "@/lib/timelineVisual";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import type { TimelineStep } from "@/lib/types";
import { cn } from "@/lib/cn";

function formatTargetLabel(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

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

export function ReverseTimeline({ form }: { form: RecipeForm }) {
  const targetLabel = formatTargetLabel(form.targetBakeTime);

  const handleAlarmResult = (type: "android" | "ics" | "invalid") => {
    if (type === "android") form.showToast("פותח/ת את שעון האנדרואיד…");
    else if (type === "ics") form.showToast("הורד קובץ .ics — ייבא/י ליומן.");
    else if (type === "invalid")
      form.showToast("אין שעה מתוכננת — בנו/י לוח זמנים קודם.");
  };

  return (
    <Card id="schedule-card" className="mb-8 sm:mb-10">
      <SectionHeader
        icon={<CalendarDaysIcon className="h-6 w-6" strokeWidth={1.75} />}
        title="לוח אפייה הפוך"
        subtitle="הזינו מתי הלחם צריך להיות מוכן — נחשב אחורה את ההאכלה, האוטוליזה, ה-Bulk והמקרר."
      />

      {targetLabel && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/80">
            יעד אפייה
          </p>
          <p className="mt-1 font-serif text-2xl font-semibold text-emerald-950 sm:text-3xl">
            {targetLabel}
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        <div className="col-span-full flex flex-col gap-2.5 sm:col-span-2">
          <label
            htmlFor="targetBakeTime"
            className="text-sm font-semibold text-stone-800"
          >
            זמן יעד — סיום אפייה
          </label>
          <input
            id="targetBakeTime"
            type="datetime-local"
            step={300}
            className="w-full rounded-2xl border-2 border-stone-200 bg-amber-50/60 px-4 py-4 text-center text-base text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            value={form.targetBakeTime}
            onChange={(e) => form.setTargetBakeTime(e.target.value)}
          />
        </div>

        <PercentStepper
          id="coldRetardHours"
          label="התפחה במקרר (שעות)"
          value={form.coldRetardHours}
          min={4}
          max={48}
          step={1}
          onChange={form.setColdRetardHours}
          minusLabel="הפחת שעות מקרר"
          plusLabel="הוסף שעות מקרר"
          compact
        />

      </div>

      <p className="mb-6 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
        משתמשים ב־{form.roomTemp}°C ו־{form.hoursToAutolyse} שעות עד אוטוליזה (ניתן
        לשנות במדריך האפייה).
      </p>

      <Button variant="primary" fullWidth onClick={form.handleBuildTimeline}>
        בניית לוח זמנים
      </Button>

      {form.showTimeline && form.timelinePlan && (
        <div className="mt-10">
          <div className="mb-8 rounded-2xl border border-stone-200 bg-stone-50/90 p-5 sm:p-6">
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
                  key={step.title}
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
                      <h3 className="m-0 font-serif text-lg font-semibold text-stone-900">
                        {step.title}
                      </h3>
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
    </Card>
  );
}
