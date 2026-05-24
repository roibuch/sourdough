"use client";

import { Fragment } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { AlarmButtonGroup } from "@/components/AlarmButton";
import type { AlarmResult } from "@/lib/alarms";
import {
  FloatTestReminderContent,
  FloatTestReminderRailDot,
  isMixingPhaseStep,
} from "@/components/feedback/FloatTestReminder";
import { StepStageIcon } from "@/components/icons/BakingStageIcons";
import { formatScheduleTime } from "@/lib/timeline";
import {
  STEP_KIND_STYLES,
  getTimelineStepKind,
} from "@/lib/timelineVisual";
import type { TimelinePlan, TimelineStep } from "@/lib/types";
import { cn } from "@/lib/cn";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

interface AnimatedScheduleTimelineProps {
  plan: TimelinePlan;
  planKey: string;
  onAlarmResult: (result: AlarmResult) => void;
}

export function AnimatedScheduleTimeline({
  plan,
  planKey,
  onAlarmResult,
}: AnimatedScheduleTimelineProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.ol
      key={planKey}
      className="relative m-0 min-w-0 list-none space-y-0 overflow-x-clip p-0 pr-1 sm:pr-2"
      aria-label="לוח זמנים כרונולוגי"
      variants={reduceMotion ? undefined : listVariants}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
    >
      <span className="timeline-rail" aria-hidden />

      {plan.steps.map((step, index) => (
        <Fragment key={`${step.title}-${step.start}`}>
          {isMixingPhaseStep(step.title) && (
            <motion.li
              className="relative list-none pb-6 pr-11 sm:pb-8 sm:pr-14"
              variants={reduceMotion ? undefined : itemVariants}
              aria-label="תזכורת מבחן הציפה"
            >
              <FloatTestReminderRailDot />
              <FloatTestReminderContent />
            </motion.li>
          )}
          <ScheduleStepRow
            step={step}
            index={index}
            reduceMotion={!!reduceMotion}
            onAlarmResult={onAlarmResult}
          />
        </Fragment>
      ))}
    </motion.ol>
  );
}

function ScheduleStepRow({
  step,
  index,
  reduceMotion,
  onAlarmResult,
}: {
  step: TimelineStep;
  index: number;
  reduceMotion: boolean;
  onAlarmResult: (result: AlarmResult) => void;
}) {
  const kind = getTimelineStepKind(step);
  const styles = STEP_KIND_STYLES[kind];
  const isAction = kind === "action";

  return (
    <motion.li
      className="relative list-none pb-6 pr-11 last:pb-0 sm:pb-8 sm:pr-14"
      variants={reduceMotion ? undefined : itemVariants}
      layout={!reduceMotion}
    >
      <motion.span
        className={cn(
          "absolute right-0 top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm sm:h-10 sm:w-10",
          styles.dot,
        )}
        aria-hidden
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        <StepStageIcon title={step.title} />
      </motion.span>

      <motion.article
        className={cn(
          "min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 md:p-6",
          styles.card,
        )}
        layout={!reduceMotion}
      >
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h4 className="m-0 min-w-0 flex-1 font-serif text-base font-semibold leading-snug text-stone-900 sm:text-lg">
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

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <p className="m-0 text-base font-semibold tabular-nums text-stone-800 sm:text-lg">
            {formatScheduleTime(step.start)}
          </p>
          {step.alarms && step.alarms.length > 0 && (
            <AlarmButtonGroup
              alarms={step.alarms}
              onResult={onAlarmResult}
              compact
              stacked
            />
          )}
        </div>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.meta}</p>
      </motion.article>
    </motion.li>
  );
}
