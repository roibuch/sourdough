"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { BlackoutPeriod } from "@/lib/scheduling/types";
import {
  minutesToHHmm,
  parseTimeToMinutes,
} from "@/lib/scheduling/timeUtils";
import { heContent, t } from "@/lib/content";
import { cn } from "@/lib/cn";

const blk = heContent.scheduling.blackouts;

const BLACKOUT_COLORS = [
  "bg-stone-400/35 border-stone-500/50",
  "bg-orange-300/35 border-orange-400/50",
  "bg-sky-300/35 border-sky-400/50",
];

interface BlackoutPeriodsEditorProps {
  blackouts: BlackoutPeriod[];
  onChange: (next: BlackoutPeriod[]) => void;
  className?: string;
}

export function BlackoutPeriodsEditor({
  blackouts,
  onChange,
  className,
}: BlackoutPeriodsEditorProps) {
  const update = (id: string, patch: Partial<BlackoutPeriod>) => {
    onChange(
      blackouts.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  const add = () => {
    const id = `custom-${Date.now()}`;
    onChange([
      ...blackouts,
      {
        id,
        label: blk.custom,
        startMinutes: parseTimeToMinutes("12:00"),
        endMinutes: parseTimeToMinutes("13:00"),
      },
    ]);
  };

  const remove = (id: string) => {
    onChange(blackouts.filter((b) => b.id !== id));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-base font-semibold text-charcoal">
            {blk.editorTitle}
          </h4>
          <p className="text-xs text-charcoal-muted">
            {blk.editorHint}
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-full border border-warm-border bg-white px-3 py-1.5 text-xs font-semibold text-crust hover:bg-wheat-muted/50"
        >
          <PlusIcon className="h-4 w-4" />
          הוספה
        </button>
      </div>

      <ul className="space-y-2">
        {blackouts.map((b, i) => (
          <li
            key={b.id}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-2xl border p-3",
              BLACKOUT_COLORS[i % BLACKOUT_COLORS.length],
            )}
          >
            <input
              type="text"
              value={b.label}
              onChange={(e) => update(b.id, { label: e.target.value })}
              className="min-w-[6rem] flex-1 rounded-xl border border-warm-border/80 bg-white/90 px-2 py-1.5 text-sm font-medium"
              aria-label="שם החלון"
            />
            <label className="flex items-center gap-1 text-xs text-charcoal-muted">
              מ
              <input
                type="time"
                value={minutesToHHmm(b.startMinutes)}
                onChange={(e) =>
                  update(b.id, {
                    startMinutes: parseTimeToMinutes(e.target.value),
                  })
                }
                className="rounded-lg border border-warm-border/80 bg-white px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-charcoal-muted">
              עד
              <input
                type="time"
                value={minutesToHHmm(b.endMinutes)}
                onChange={(e) =>
                  update(b.id, {
                    endMinutes: parseTimeToMinutes(e.target.value),
                  })
                }
                className="rounded-lg border border-warm-border/80 bg-white px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => remove(b.id)}
              className="ms-auto rounded-full p-1.5 text-charcoal-muted hover:bg-white/80 hover:text-red-700"
              aria-label={`מחק ${b.label}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
