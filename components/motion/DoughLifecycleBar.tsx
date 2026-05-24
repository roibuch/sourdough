"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  buildLifecycleSegments,
  formatSegmentDuration,
} from "@/lib/timelineLifecycle";
import { StageIcon } from "@/components/icons/BakingStageIcons";
import type { TimelinePlan } from "@/lib/types";
import { cn } from "@/lib/cn";

interface DoughLifecycleBarProps {
  plan: TimelinePlan;
  className?: string;
}

export function DoughLifecycleBar({ plan, className }: DoughLifecycleBarProps) {
  const reduceMotion = useReducedMotion();
  const segments = useMemo(() => buildLifecycleSegments(plan), [plan]);
  const barKey = segments.map((s) => `${s.id}-${s.percent.toFixed(1)}`).join("|");

  if (segments.length === 0) return null;

  return (
    <div className={cn("mb-8", className)} aria-label="מחזור חיי הבצק">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          מחזור הבצק
        </p>
        <p className="text-xs text-stone-500">
          ~{plan.summary.totalHours} שעות סה״כ
        </p>
      </div>

      <motion.div
        key={barKey}
        className="flex h-3 overflow-hidden rounded-full bg-stone-200/80 shadow-inner"
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "right center" }}
      >
        {segments.map((seg, i) => (
          <motion.div
            key={seg.id}
            className={cn("h-full shrink-0", seg.colorClass)}
            initial={
              reduceMotion ? false : { width: 0, opacity: 0.5 }
            }
            animate={{
              width: `${seg.percent}%`,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 20,
              delay: reduceMotion ? 0 : i * 0.06,
            }}
            title={`${seg.label}: ${formatSegmentDuration(seg.durationMs)}`}
          />
        ))}
      </motion.div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <li
            key={seg.id}
            className="flex items-center gap-1.5 text-xs text-stone-600"
          >
            <span
              className={cn("h-2 w-2 rounded-full", seg.colorClass)}
              aria-hidden
            />
            <StageIcon phase={seg.id} className="h-3.5 w-3.5 text-stone-500" />
            <span className="font-medium text-stone-800">{seg.label}</span>
            <span className="text-stone-500">
              {formatSegmentDuration(seg.durationMs)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
