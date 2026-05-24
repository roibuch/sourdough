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
  hidden: { opacity: 0, x: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
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
      className="relative m-0 list-none space-y-0 p-0 pr-2"
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
              className="relative list-none pb-8 pr-14 sm:pr-16"
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
      className={cn(
        "relative list-none pb-8 pr-14 last:pb-0 sm:pr-16",
        index % 2 === 1 && "sm:pr-[4.5rem]",
      )}
      variants={reduceMotion ? undefined : itemVariants}
      layout={!reduceMotion}
    >
      <motion.span
        className={cn(
          "absolute right-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm",
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
          "rounded-2xl border p-5 shadow-sm sm:p-6",
          styles.card,
        )}
        layout={!reduceMotion}
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
              onResult={onAlarmResult}
            />
          </div>
        )}
      </motion.article>
    </motion.li>
  );
}
