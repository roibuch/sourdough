"use client";

import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { heContent } from "@/lib/content";
import type { ScheduleAdaptation } from "@/lib/scheduling/types";
import { cn } from "@/lib/cn";

export function ScheduleAdaptationsBanner({
  adaptations,
  feasible,
  className,
}: {
  adaptations: ScheduleAdaptation[];
  feasible: boolean;
  className?: string;
}) {
  if (adaptations.length === 0 && feasible) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {!feasible && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
          {heContent.scheduling.banner.conflict}
        </p>
      )}
      {adaptations.map((a) => (
        <div
          key={a.id}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-sm leading-relaxed",
            a.severity === "warning"
              ? "border-amber-300/80 bg-amber-50/90 text-amber-950"
              : "border-wheat/80 bg-wheat-muted/60 text-crust",
          )}
        >
          <p className="flex items-center gap-2 font-semibold">
            {a.severity === "warning" ? (
              <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
            ) : (
              <InformationCircleIcon className="h-4 w-4 shrink-0" />
            )}
            {a.title}
          </p>
          <p className="mt-1 text-charcoal-muted">{a.message}</p>
        </div>
      ))}
    </div>
  );
}
