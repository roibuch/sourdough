"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { SmartWarningBanner } from "@/components/feedback/SmartWarningBanner";
import { ScheduleAdaptationsBanner } from "@/components/scheduling/ScheduleAdaptationsBanner";
import type { BakerAlert } from "@/lib/bakerAlerts";
import type { ScheduleAdaptation } from "@/lib/scheduling/types";
import { cn } from "@/lib/cn";

interface ScheduleSmartAlertsProps {
  alerts: BakerAlert[];
  adaptations?: ScheduleAdaptation[];
  adaptationsFeasible?: boolean;
  className?: string;
}

export function ScheduleSmartAlerts({
  alerts,
  adaptations,
  adaptationsFeasible = true,
  className,
}: ScheduleSmartAlertsProps) {
  const hasAdaptations = adaptations && adaptations.length > 0;
  const hasAlerts = alerts.length > 0;

  if (!hasAdaptations && !hasAlerts) return null;

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/95 to-amber-50/40 p-4",
        className,
      )}
      role="region"
      aria-label="התראות חכמות ללוח האפייה"
    >
      <div className="flex items-center gap-2 text-amber-950">
        <ExclamationTriangleIcon
          className="h-5 w-5 shrink-0 text-amber-700"
          strokeWidth={1.75}
          aria-hidden
        />
        <p className="text-sm font-semibold">התראות והתאמות ללוח</p>
      </div>

      {hasAlerts && (
        <SmartWarningBanner alerts={alerts} dismissible className="!space-y-2" />
      )}

      {hasAdaptations && (
        <ScheduleAdaptationsBanner
          adaptations={adaptations}
          feasible={adaptationsFeasible}
          className="!mb-0 border-amber-200/60 bg-white/70"
        />
      )}
    </div>
  );
}
