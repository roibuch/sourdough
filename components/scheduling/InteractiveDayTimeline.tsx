"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import type {
  AdaptiveScheduleResult,
  BlackoutPeriod,
  DraggableBlockId,
  ScheduledBlock,
} from "@/lib/scheduling/types";
import { SchedulingEngine } from "@/lib/scheduling/SchedulingEngine";
import type { SchedulingEngineInput } from "@/lib/scheduling/types";
import {
  blackoutIntervalsForDay,
  formatTimeShort,
  MS_H,
  MS_MIN,
} from "@/lib/scheduling/timeUtils";
import { cn } from "@/lib/cn";

const DRAGGABLE: DraggableBlockId[] = [
  "starter",
  "autolyse",
  "bulk",
  "preshape",
];

const BLOCK_COLORS: Record<string, string> = {
  starter: "bg-amber-400/90 border-amber-600 text-amber-950",
  autolyse: "bg-sky-300/90 border-sky-500 text-sky-950",
  bulk: "bg-orange-300/90 border-orange-500 text-orange-950",
  preshape: "bg-crust/90 border-crust-dark text-dough",
  fold: "bg-orange-200/80 border-orange-400 text-orange-950",
  retard: "bg-stone-300/50 border-stone-400 text-stone-700",
  bake: "bg-wheat/90 border-wheat text-crust-dark",
};

interface InteractiveDayTimelineProps {
  schedule: AdaptiveScheduleResult;
  blackouts: BlackoutPeriod[];
  engineInput: SchedulingEngineInput;
  onScheduleChange: (next: AdaptiveScheduleResult) => void;
  className?: string;
}

function DraggableBlock({
  block,
  rangeStart,
  rangeEnd,
  trackWidthPx,
  onDragEnd,
}: {
  block: ScheduledBlock;
  rangeStart: number;
  rangeEnd: number;
  trackWidthPx: number;
  onDragEnd: (newStartMs: number) => void;
}) {
  const canDrag = DRAGGABLE.includes(block.id as DraggableBlockId);
  const rangeMs = rangeEnd - rangeStart;
  const leftPct = ((block.startMs - rangeStart) / rangeMs) * 100;
  const widthPct = Math.max(
    2,
    ((block.endMs - block.startMs) / rangeMs) * 100,
  );

  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      layout
      drag={canDrag ? "x" : false}
      dragMomentum={false}
      dragElastic={0}
      style={{ x, left: `${leftPct}%`, width: `${widthPct}%` }}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info) => {
        setDragging(false);
        if (!canDrag) return;
        const deltaMs = (info.offset.x / trackWidthPx) * rangeMs;
        const snapped =
          Math.round((block.startMs + deltaMs) / (15 * MS_MIN)) *
          (15 * MS_MIN);
        x.set(0);
        onDragEnd(snapped);
      }}
      className={cn(
        "absolute top-1 bottom-1 min-w-[2.5rem] cursor-grab rounded-xl border px-1 py-0.5 text-[10px] font-semibold leading-tight active:cursor-grabbing",
        BLOCK_COLORS[block.kind] ?? "bg-stone-200",
        dragging && "z-20 ring-2 ring-wheat shadow-lg",
        !canDrag && "cursor-default opacity-80",
      )}
      title={`${block.label} · ${formatTimeShort(block.startMs)}–${formatTimeShort(block.endMs)}`}
    >
      <span className="block truncate">
        {block.kind === "fold" ? block.label : block.label.split(" ")[0]}
      </span>
    </motion.div>
  );
}

export function InteractiveDayTimeline({
  schedule,
  blackouts,
  engineInput,
  onScheduleChange,
  className,
}: InteractiveDayTimelineProps) {
  const activeBlocks = schedule.blocks.filter((b) => b.activity === "active");
  const rangeStart = useMemo(() => {
    if (!schedule.blocks.length) return schedule.plan.summary.starterFeed - 0.5 * MS_H;
    const min = Math.min(...schedule.blocks.map((b) => b.startMs));
    return min - 0.5 * MS_H;
  }, [schedule.blocks, schedule.plan.summary.starterFeed]);
  const rangeEnd = useMemo(() => {
    if (!schedule.blocks.length) return schedule.plan.summary.bakeEnd + 0.5 * MS_H;
    const max = Math.max(...schedule.blocks.map((b) => b.endMs));
    return max + 0.5 * MS_H;
  }, [schedule.blocks, schedule.plan.summary.bakeEnd]);

  const dayMs = schedule.plan.summary.starterFeed;
  const [trackWidthPx, setTrackWidthPx] = useState(640);
  const hours = useMemo(() => {
    const labels: string[] = [];
    const start = new Date(rangeStart);
    start.setMinutes(0, 0, 0);
    for (let h = 0; h <= 24; h += 3) {
      const t = start.getTime() + h * MS_H;
      if (t <= rangeEnd + MS_H) {
        labels.push(formatTimeShort(t));
      }
    }
    return labels;
  }, [rangeStart, rangeEnd]);

  const handleDragEnd = useCallback(
    (blockId: string, newStartMs: number) => {
      if (!DRAGGABLE.includes(blockId as DraggableBlockId)) return;
      const result = SchedulingEngine.applyBlockDrag(
        engineInput,
        schedule.plan,
        { blockId: blockId as DraggableBlockId, newStartMs },
      );
      if (result) onScheduleChange(result);
    },
    [engineInput, onScheduleChange, schedule.plan],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs text-charcoal-muted">
        גררו בלוקים פעילים (מחמצת, אוטוליזה, בלק, עיצוב) — הלוח מחשב מחדש את
        האפייה וההתפחה.
      </p>

      <div className="relative -mx-1 overflow-x-auto overscroll-x-contain rounded-2xl border border-warm-border bg-white/80 p-2 sm:mx-0 sm:p-3">
        <div
          className="relative h-28 w-full min-w-[280px] sm:min-w-[480px] lg:min-w-[560px]"
          style={{ touchAction: "pan-x pan-y" }}
        >
          {blackouts.map((b) =>
            blackoutIntervalsForDay(b, dayMs).map((interval, idx) => {
              const left =
                ((interval.start - rangeStart) / (rangeEnd - rangeStart)) *
                100;
              const width =
                ((interval.end - interval.start) / (rangeEnd - rangeStart)) *
                100;
              return (
                <div
                  key={`${b.id}-${idx}`}
                  className="pointer-events-none absolute inset-y-0 rounded-lg bg-stone-400/20"
                  style={{
                    left: `${Math.max(0, left)}%`,
                    width: `${Math.min(100, width)}%`,
                  }}
                  title={b.label}
                />
              );
            }),
          )}

          <div
            ref={(el) => {
              if (el && el.offsetWidth > 0) setTrackWidthPx(el.offsetWidth);
            }}
            className="absolute inset-x-0 top-8 bottom-2 rounded-xl bg-dough/50"
          >
            {activeBlocks.map((block) => (
              <DraggableBlock
                key={block.id}
                block={block}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                trackWidthPx={trackWidthPx}
                onDragEnd={(ms) => handleDragEnd(block.id, ms)}
              />
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-charcoal-muted">
            {hours.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-charcoal-muted">
        {Object.entries(BLOCK_COLORS)
          .filter(([k]) => k !== "fold")
          .map(([k, cls]) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className={cn("h-2.5 w-2.5 rounded-sm border", cls)} />
              {k === "starter"
                ? "מחמצת"
                : k === "autolyse"
                  ? "אוטוליזה"
                  : k === "bulk"
                    ? "בלק"
                    : k === "preshape"
                      ? "עיצוב"
                      : k}
            </span>
          ))}
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-6 rounded-sm bg-stone-400/25" />
          חסום
        </span>
      </div>
    </div>
  );
}
